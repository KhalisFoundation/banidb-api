const { buildSchema } = require('graphql');

const sdlString = require('./__generated__/schema-defs');
const resolvers = require('./resolvers');

const graphqlSchemaObj = buildSchema(sdlString);

module.exports = {
  schema: graphqlSchemaObj,
  resolvers,
};
