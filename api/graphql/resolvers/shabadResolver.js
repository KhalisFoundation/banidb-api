const { getShabad } = require('../../controllers/shabads');

module.exports = {
  Query: {
    shabad: async ({ id }, { req, res }) => {
      return getShabad(req, res, `${id}`);
    },
  },
};
