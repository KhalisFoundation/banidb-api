const { ApolloServer } = require('apollo-server-express');

const typeDefs = require('./types');
const resolvers = require('./resolvers');

module.exports = expressApp => {
  const server = new ApolloServer({ typeDefs, resolvers });

  server.applyMiddleware({ app: expressApp });

  return server;
};
