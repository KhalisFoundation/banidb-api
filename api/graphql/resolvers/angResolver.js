const { getAngs } = require('../../controllers/shabads');
const lib = require('../../lib');

module.exports = {
  Query: {
    ang: async ({ id, sourceId, sinceDate }, { req, res }) => {
      const date = sinceDate ? lib.isValidDatetime(sinceDate) : null;

      return getAngs(req, res, { pageNo: id, sourceId, sinceDate: date });
    },
    multiAng: async ({ id, sourceId, sinceDate }, { req, res }) => {
      const date = sinceDate ? lib.isValidDatetime(sinceDate) : null;

      return getAngs(req, res, { pageNo: id, sourceId, sinceDate: date });
    },
  },
};
