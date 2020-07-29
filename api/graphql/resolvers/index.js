const { mergeResolvers } = require('@graphql-tools/merge');
const shabadResolver = require('./shabadResolver');
const baniResolver = require('./baniResolver');
const angResolver = require('./angResolver');

const resolvers = [shabadResolver, baniResolver, angResolver];

const mergedResolvers = mergeResolvers(resolvers);

module.exports = { ...mergedResolvers.Query };
