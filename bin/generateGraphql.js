const fs = require('fs');

const { readdirSync, readFileSync, writeFileSync } = fs;

const defsOutputFile = './api/graphql/__generated__/schema-defs.js';
const requireGraphQL = name => {
  const filename = require.resolve(name);

  return readFileSync(filename, 'utf8');
};

const typeDefs = readdirSync('./api/graphql/schema-types-defs')
  .filter(filename => filename.endsWith('.graphql'))
  .map(filename => requireGraphQL(`../api/graphql/schema-types-defs/${filename}`))
  .join('\n');

writeFileSync(
  defsOutputFile,
  `/* eslint:disable */
// This file was automatically generated
const typeDefs = \`
${typeDefs}
\`;
module.exports = typeDefs;
/* eslint:enable */
`,
);
