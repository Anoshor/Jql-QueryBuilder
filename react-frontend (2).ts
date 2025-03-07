// src/App.tsx
import React, { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, gql } from '@apollo/client';
import './App.css';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:4000',
  cache: new InMemoryCache()
});

// GraphQL query to get organization metrics
const GET_ORGANIZATION_METRICS = gql`
  query GetOrganizationMetrics($orgName: String!) {
    getOrganizationMetrics(orgName: $orgName) {
      name
      aggregatedMetrics {
        name
        values
        average
        total
      }
      projects {
        name
        aggregatedMetrics {
          name
          values
          average
          total
        }
      }
    }
  }
`;

// GraphQL query to get project metrics
const GET_PROJECT_METRICS = gql`
  query GetProjectMetrics($orgName: String!, $projectName: String!) {
    getProjectMetrics(orgName: $orgName, projectName: $projectName) {
      name
      aggregatedMetrics {
        name
        values
        average
        total
      }
      teams {
        name
        metrics {
          name
          values
          average
          total
        }
      }
    }
  }
`;

const OrganizationMetrics: React.FC = () => {
  const [orgName, setOrgName] = useState('RingCX');
  const [projectName, setProjectName] = useState('');
  
  const { loading: orgLoading, error: orgError, data: orgData } = useQuery(
    GET_ORGANIZATION_METRICS, 
    { variables: { orgName } }
  );
  
  const { loading: projectLoading, error: projectError, data: projectData } = useQuery(
    GET_PROJECT_METRICS, 
    { 
      variables: { orgName, projectName },
      skip: !projectName
    }
  );
  
  if (orgLoading) return <p>Loading organization data...</p>;
  if (orgError) return <p>Error loading organization data: {orgError.message}</p>;
  
  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrgName(e.target.value);
    setProjectName(''); // Reset project selection when org changes
  };
  
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProjectName(e.target.value);
  };
  
  // Log the data for demonstration
  console.log('Organization Data:', orgData);
  if (projectData) {
    console.log('Project Data:', projectData);
  }
  
  return (
    <div className="metrics-container">
      <h2>Metrics Dashboard</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Organization:</label>
          <select value={orgName} onChange={handleOrgChange}>
            <option value="RingCX">RingCX</option>
            <option value="VoiceAI">VoiceAI</option>
          </select>
        </div>
        
        {orgData?.getOrganizationMetrics && (
          <div className="filter-group">
            <label>Project:</label>
            <select value={projectName} onChange={handleProjectChange}>
              <option value="">All Projects</option>
              {orgData.getOrganizationMetrics.projects.map((project: any) => (
                <option key={project.name} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Organization-level metrics */}
      {!projectName && orgData?.getOrganizationMetrics && (
        <div className="metrics-section">
          <h3>Organization Metrics: {orgData.getOrganizationMetrics.name}</h3>
          
          <div className="metrics-grid">
            {orgData.getOrganizationMetrics.aggregatedMetrics.map((metric: any) => (
              <div key={metric.name} className="metric-card">
                <h4>{metric.name}</h4>
                <div className="metric-stats">
                  <div className="stat">
                    <span>Average:</span> {metric.average.toFixed(2)}
                  </div>
                  <div className="stat">
                    <span>Total:</span> {metric.total}
                  </div>
                </div>
                <div className="metric-values">
                  <h5>Monthly Values:</h5>
                  <div className="month-values">
                    {metric.values.map((value: number, index: number) => (
                      <div key={index} className="month-value">
                        <span className="month">{index + 1}</span>
                        <span className="value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <h3>Projects Summary</h3>
          <div className="projects-summary">
            {orgData.getOrganizationMetrics.projects.map((project: any) => (
              <div key={project.name} className="project-card">
                <h4>{project.name}</h4>
                
                {project.aggregatedMetrics.map((metric: any) => (
                  <div key={metric.name} className="project-metric">
                    <h5>{metric.name}</h5>
                    <div className="metric-stats">
                      <div className="stat">
                        <span>Average:</span> {metric.average.toFixed(2)}
                      </div>
                      <div className="stat">
                        <span>Total:</span> {metric.total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Project-level metrics */}
      {projectName && projectData?.getProjectMetrics && (
        <div className="metrics-section">
          <h3>Project Metrics: {projectData.getProjectMetrics.name}</h3>
          
          <div className="metrics-grid">
            {projectData.getProjectMetrics.aggregatedMetrics.map((metric: any) => (
              <div key={metric.name} className="metric-card">
                <h4>{metric.name}</h4>
                <div className="metric-stats">
                  <div className="stat">
                    <span>Average:</span> {metric.average.toFixed(2)}
                  </div>
                  <div className="stat">
                    <span>Total:</span> {metric.total}
                  </div>
                </div>
                <div className="metric-values">
                  <h5>Monthly Values:</h5>
                  <div className="month-values">
                    {metric.values.map((value: number, index: number) => (
                      <div key={index} className="month-value">
                        <span className="month">{index + 1}</span>
                        <span className="value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <h3>Teams</h3>
          <div className="teams-section">
            {projectData.getProjectMetrics.teams.map((team: any) => (
              <div key={team.name} className="team-card">
                <h4>{team.name}</h4>
                
                {team.metrics.map((metric: any) => (
                  <div key={metric.name} className="team-metric">
                    <h5>{metric.name}</h5>
                    <div className="metric-stats">
                      <div className="stat">
                        <span>Average:</span> {metric.average.toFixed(2)}
                      </div>
                      <div className="stat">
                        <span>Total:</span> {metric.total}
                      </div>
                    </div>
                    <div className="team-metric-chart">
                      {metric.values.map((value: number, index: number) => (
                        <div 
                          key={index} 
                          className="chart-bar"
                          style={{ height: `${value / 2}px` }}
                          title={`Month ${index + 1}: ${value}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <h1>Metrics Analysis Dashboard</h1>
        </header>
        <main>
          <OrganizationMetrics />
        </main>
      </div>
    </ApolloProvider>
  );
};

export default App;

// src/App.css
.App {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.App-header {
  background-color: #2c3e50;
  color: white;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}

.metrics-container {
  background-color: #f8f9fa;
  border-radius: 5px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-weight: bold;
  min-width: 100px;
}

.filter-group select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-width: 200px;
}

.metrics-section {
  margin-top: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.metric-card {
  background-color: #fff;
  border-radius: 5px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-stats {
  display: flex;
  gap: 15px;
  margin: 10px 0;
}

.stat {
  background-color: #f1f8ff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
}

.stat span {
  font-weight: bold;
  color: #0366d6;
}

.metric-values h5 {
  margin: 10px 0 5px;
  color: #555;
}

.month-values {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
}

.month-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
  background-color: #f5f5f5;
  border-radius: 3px;
  font-size: 12px;
}

.month {
  font-weight: bold;
  color: #666;
}

.projects-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.project-card {
  background-color: #fff;
  border-radius: 5px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.project-metric {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.project-metric h5 {
  margin: 0 0 5px;
  color: #555;
}

.teams-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.team-card {
  background-color: #fff;
  border-radius: 5px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.team-metric {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.team-metric h5 {
  margin: 0 0 5px;
  color: #555;
}

.team-metric-chart {
  display: flex;
  align-items: flex-end;
  height: 100px;
  margin-top: 10px;
  gap: 4px;
}

.chart-bar {
  flex: 1;
  background-color: #4a90e2;
  min-width: 15px;
  border-radius: 3px 3px 0 0;
}
