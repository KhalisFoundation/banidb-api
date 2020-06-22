const getJSON = require('./getJSON');
const searchOperators = require('./searchOperators');

const lib = {
  error: (err, res, code, stack = true) => {
    res.cacheControl = { noCache: true };
    const ret = {
      error: true,
      data: {
        error: err,
      },
    };
    if (stack === true) {
      ret.data.stack = err.stack.split('\n');
      console.error(err);
    }
    res.status(code).json(ret);
  },
  isListOfNumbers: str => {
    if (typeof str !== 'string') {
      return false;
    }

    // will validate 123 or 123,123,... or 123+123+...
    const numbersRegEx = /^(([0-9]+)([,+](?=[0-9]))?)+$/;

    if (str.match(numbersRegEx)) {
      return true;
    }

    return false;
  },
  isRangeOfNumbers: str => {
    if (typeof str !== 'string') {
      return false;
    }

    // will validate 123 or 123+123... or 123-124
    const numbersRegEx = /^[<>]?(([0-9]+)([+-](?=[0-9]))?)+$/;

    if (str.match(numbersRegEx)) {
      return true;
    }

    return false;
  },
  isValidDatetime: str => {
    if (typeof str !== 'string') {
      return null;
    }

    const mariadbDateTimeRegEx = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9])(?:( [0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?(.[0-9]{1,6})?$/;

    if (str.match(mariadbDateTimeRegEx)) {
      return str;
    }

    return null;
  },
};

module.exports = {
  ...lib,
  ...getJSON,
  searchOperators,
};
