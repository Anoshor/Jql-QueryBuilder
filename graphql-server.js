// server/index.js - Simple Apollo Server with MongoDB
const { ApolloServer, gql } = require('apollo-server');
const { MongoClient, ObjectId } = require('mongodb');

// Replace with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/graphql-mongo';
const DB_NAME = 'graphql-mongo';

// Define GraphQL schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    age: Int
  }

  type Query {
    users: [User]
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, age: Int): User
    updateUser(id: ID!, name: String, age: Int): User
    deleteUser(id: ID!): Boolean
  }
`;

// Create Apollo Server resolvers
const resolvers = {
  Query: {
    users: async (_, __, { db }) => {
      const users = await db.collection('users').find().toArray();
      return users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        age: user.age
      }));
    },
    user: async (_, { id }, { db }) => {
      try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
        if (!user) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          age: user.age
        };
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    }
  },
  Mutation: {
    createUser: async (_, { name, age }, { db }) => {
      const result = await db.collection('users').insertOne({ name, age });
      return {
        id: result.insertedId.toString(),
        name,
        age
      };
    },
    updateUser: async (_, { id, name, age }, { db }) => {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (age !== undefined) updateData.age = age;
      
      await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      
      const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
      return {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        age: updatedUser.age
      };
    },
    deleteUser: async (_, { id }, { db }) => {
      const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    }
  }
};

// Connect to MongoDB and start the server
async function startServer() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Create server
    const server = new ApolloServer({ 
      typeDefs, 
      resolvers,
      context: { db },
      playground: true
    });
    
    // Start server
    const { url } = await server.listen(4000);
    console.log(`🚀 Server ready at ${url}`);
  } catch (e) {
    console.error('Error starting server:', e);
    await client.close();
  }
}

startServer();

// server/package.json
/*
{
  "name": "graphql-mongodb-server",
  "version": "1.0.0",
  "description": "GraphQL server with MongoDB",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "apollo-server": "^3.12.0",
    "graphql": "^16.6.0",
    "mongodb": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
*/
