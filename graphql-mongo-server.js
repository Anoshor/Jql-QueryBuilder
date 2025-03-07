// server/index.js
const { ApolloServer, gql } = require('apollo-server');
const { MongoClient } = require('mongodb');
const _ = require('lodash');

// Replace with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/metrics-db';
const DB_NAME = 'metrics-db';
const COLLECTION_NAME = 'organization-metrics';

// Define GraphQL schema
const typeDefs = gql`
  type Metric {
    name: String!
    values: [Int!]!
    average: Float
    total: Int
  }

  type Team {
    name: String!
    metrics: [Metric!]!
  }

  type Project {
    name: String!
    teams: [Team!]!
    aggregatedMetrics: [Metric!]!
  }

  type Organization {
    name: String!
    projects: [Project!]!
    aggregatedMetrics: [Metric!]!
  }

  type YearData {
    year: String!
    organizations: [Organization!]!
    aggregatedMetrics: [Metric!]!
  }

  type Query {
    getMetricsData: [YearData!]!
    getOrganizationMetrics(orgName: String!): Organization
    getProjectMetrics(orgName: String!, projectName: String!): Project
    getTeamMetrics(orgName: String!, projectName: String!, teamName: String!): Team
  }
`;

// Helper function to aggregate metrics across an array of items
function aggregateMetrics(items, metricsPath) {
  // Find all unique metric names across all items
  const allMetricNames = new Set();
  
  items.forEach(item => {
    const metrics = _.get(item, metricsPath);
    if (metrics) {
      Object.keys(metrics).forEach(metricName => {
        allMetricNames.add(metricName);
      });
    }
  });

  // For each metric name, aggregate the values
  const aggregatedMetrics = [];
  
  allMetricNames.forEach(metricName => {
    const allValues = [];
    
    // Collect all values for this metric across all items
    items.forEach(item => {
      const metrics = _.get(item, metricsPath);
      if (metrics && metrics[metricName]) {
        allValues.push(...metrics[metricName]);
      }
    });
    
    // Calculate aggregate values
    const total = allValues.reduce((sum, val) => sum + val, 0);
    const average = allValues.length > 0 ? total / allValues.length : 0;
    
    // Aggregate the values by month (assuming 12 months of data)
    const aggregatedValues = [];
    for (let month = 0; month < 12; month++) {
      let monthTotal = 0;
      let monthCount = 0;
      
      items.forEach(item => {
        const metrics = _.get(item, metricsPath);
        if (metrics && metrics[metricName] && metrics[metricName][month] !== undefined) {
          monthTotal += metrics[metricName][month];
          monthCount++;
        }
      });
      
      aggregatedValues.push(monthCount > 0 ? monthTotal : 0);
    }
    
    aggregatedMetrics.push({
      name: metricName,
      values: aggregatedValues,
      average: average,
      total: total
    });
  });
  
  return aggregatedMetrics;
}

// Create resolvers
const resolvers = {
  Query: {
    getMetricsData: async (_, __, { db }) => {
      const data = await db.collection(COLLECTION_NAME).find({}).toArray();
      
      return data.map(yearData => {
        const organizations = yearData.organizations.map(org => {
          const projects = org.projects.map(project => {
            const teams = project.teams.map(team => {
              const teamMetrics = Object.keys(team.metrics).map(metricName => ({
                name: metricName,
                values: team.metrics[metricName],
                average: _.mean(team.metrics[metricName]),
                total: _.sum(team.metrics[metricName])
              }));
              
              return {
                name: team.name,
                metrics: teamMetrics
              };
            });
            
            return {
              name: project.name,
              teams,
              aggregatedMetrics: aggregateMetrics(project.teams, 'metrics')
            };
          });
          
          return {
            name: org.name,
            projects,
            aggregatedMetrics: aggregateMetrics(
              org.projects.flatMap(project => project.teams),
              'metrics'
            )
          };
        });
        
        return {
          year: yearData.year,
          organizations,
          aggregatedMetrics: aggregateMetrics(
            yearData.organizations.flatMap(org => 
              org.projects.flatMap(project => project.teams)
            ),
            'metrics'
          )
        };
      });
    },
    
    getOrganizationMetrics: async (_, { orgName }, { db }) => {
      const data = await db.collection(COLLECTION_NAME).find({}).toArray();
      
      // Find the organization in any year
      for (const yearData of data) {
        const org = yearData.organizations.find(o => o.name === orgName);
        if (org) {
          const projects = org.projects.map(project => {
            const teams = project.teams.map(team => {
              const teamMetrics = Object.keys(team.metrics).map(metricName => ({
                name: metricName,
                values: team.metrics[metricName],
                average: _.mean(team.metrics[metricName]),
                total: _.sum(team.metrics[metricName])
              }));
              
              return {
                name: team.name,
                metrics: teamMetrics
              };
            });
            
            return {
              name: project.name,
              teams,
              aggregatedMetrics: aggregateMetrics(project.teams, 'metrics')
            };
          });
          
          return {
            name: org.name,
            projects,
            aggregatedMetrics: aggregateMetrics(
              org.projects.flatMap(project => project.teams),
              'metrics'
            )
          };
        }
      }
      
      return null;
    },
    
    getProjectMetrics: async (_, { orgName, projectName }, { db }) => {
      const data = await db.collection(COLLECTION_NAME).find({}).toArray();
      
      // Find the project in any year/organization
      for (const yearData of data) {
        for (const org of yearData.organizations) {
          if (org.name === orgName) {
            const project = org.projects.find(p => p.name === projectName);
            if (project) {
              const teams = project.teams.map(team => {
                const teamMetrics = Object.keys(team.metrics).map(metricName => ({
                  name: metricName,
                  values: team.metrics[metricName],
                  average: _.mean(team.metrics[metricName]),
                  total: _.sum(team.metrics[metricName])
                }));
                
                return {
                  name: team.name,
                  metrics: teamMetrics
                };
              });
              
              return {
                name: project.name,
                teams,
                aggregatedMetrics: aggregateMetrics(project.teams, 'metrics')
              };
            }
          }
        }
      }
      
      return null;
    },
    
    getTeamMetrics: async (_, { orgName, projectName, teamName }, { db }) => {
      const data = await db.collection(COLLECTION_NAME).find({}).toArray();
      
      // Find the team in any year/organization/project
      for (const yearData of data) {
        for (const org of yearData.organizations) {
          if (org.name === orgName) {
            for (const project of org.projects) {
              if (project.name === projectName) {
                const team = project.teams.find(t => t.name === teamName);
                if (team) {
                  const teamMetrics = Object.keys(team.metrics).map(metricName => ({
                    name: metricName,
                    values: team.metrics[metricName],
                    average: _.mean(team.metrics[metricName]),
                    total: _.sum(team.metrics[metricName])
                  }));
                  
                  return {
                    name: team.name,
                    metrics: teamMetrics
                  };
                }
              }
            }
          }
        }
      }
      
      return null;
    }
  }
};

// Initialize and start the server
async function startServer() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Check if collection exists, if not create it with sample data
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      console.log('Creating sample data in collection...');
      await initializeDatabase(db);
    }
    
    // Create server
    const server = new ApolloServer({ 
      typeDefs, 
      resolvers,
      context: { db }
    });
    
    // Start server
    const { url } = await server.listen(4000);
    console.log(`🚀 Server ready at ${url}`);
  } catch (e) {
    console.error('Error starting server:', e);
    await client.close();
  }
}

// Initialize the database with sample data
async function initializeDatabase(db) {
  const sampleData = [
    {
      "year": "2024",
      "organizations": [
        {
          "name": "RingCX",
          "projects": [
            {
              "name": "EVAA",
              "teams": [
                {
                  "name": "AUS-FT",
                  "metrics": {
                    "metric1": [100, 120, 95, 110, 125, 115, 90, 105, 130, 120, 110, 115],
                    "metric2": [85, 90, 95, 92, 88, 94, 96, 91, 89, 93, 92, 97]
                  }
                },
                {
                  "name": "US-PT",
                  "metrics": {
                    "metric1": [90, 95, 100, 105, 110, 105, 100, 95, 115, 110, 105, 95],
                    "metric2": [75, 80, 85, 82, 78, 84, 86, 81, 79, 83, 82, 87]
                  }
                }
              ]
            },
            {
              "name": "Skynet",
              "teams": [
                {
                  "name": "EU-FT",
                  "metrics": {
                    "metric1": [150, 160, 165, 155, 170, 180, 175, 160, 155, 165, 170, 175],
                    "metric2": [85, 88, 92, 90, 94, 95, 93, 91, 89, 90, 92, 93]
                  }
                }
              ]
            }
          ]
        },
        {
          "name": "VoiceAI",
          "projects": [
            {
              "name": "Jarvis",
              "teams": [
                {
                  "name": "APAC-FT",
                  "metrics": {
                    "metric1": [80, 85, 90, 95, 100, 105, 110, 105, 100, 95, 90, 85],
                    "metric2": [70, 75, 77, 79, 80, 82, 84, 83, 81, 78, 76, 74]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ];
  
  await db.collection(COLLECTION_NAME).insertMany(sampleData);
  console.log('Sample data inserted');
}

// Start the server
startServer();

// server/package.json
/*
{
  "name": "metrics-graphql-server",
  "version": "1.0.0",
  "description": "GraphQL API for metrics aggregation",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "apollo-server": "^3.12.0",
    "graphql": "^16.6.0",
    "lodash": "^4.17.21",
    "mongodb": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
*/
