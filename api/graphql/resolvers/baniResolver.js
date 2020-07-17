const { getAll, getBani } = require('../../controllers/banis');

module.exports = {
  Query: {
    banis: async (_, { req }) => {
      const { rows } = await getAll(req);
      return rows;
    },
    bani: async ({ id, length, sinceDate }, { req }) => {
      return getBani({ id, length, sinceDate }, req);
    },
  },
};
