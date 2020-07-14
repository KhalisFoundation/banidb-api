const { mergeResolvers } = require('@graphql-tools/merge');
const shabadResolver = require('./shabadResolver');
const baniResolver = require('./baniResolver');

const resolvers = [shabadResolver, baniResolver];

const mergedResolvers = mergeResolvers(resolvers);

module.exports = { ...mergedResolvers.Query };
