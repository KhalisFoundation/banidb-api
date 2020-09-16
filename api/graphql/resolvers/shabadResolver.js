const { getShabad } = require('../../controllers/shabads');
const lib = require('../../lib');

module.exports = {
  Query: {
    shabad: async ({ id, sinceDate }, { req, res }) => {
      const date = sinceDate ? lib.isValidDatetime(sinceDate) : null;
      return getShabad(req, res, [`${id}`], date, false);
    },
    multiShabad: async ({ id, sinceDate }, { req, res }) => {
      const ShabadIDs = id.split(/[,+]/g);
      const date = sinceDate ? lib.isValidDatetime(sinceDate) : null;

      return getShabad(req, res, ShabadIDs, date, true);
    },
  },
};
