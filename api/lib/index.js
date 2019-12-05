const getJSON = require('./getJSON');

const lib = {
  customError: (err, res, code) => {
    res.status(code).json({
      error: true,
      data: {
        error: err,
      },
    });
  },
  error: (err, res) => {
    console.error(err);
    Error.captureStackTrace(err);
    res.status(400).json({
      error: true,
      data: {
        error: err,
        stack: err.stack,
      },
    });
  },
  isListOfNumbers: str => {
    if (typeof str !== 'string' && Number.isNaN(str)) {
      return false;
    }

    // will validate 123 or 123,123,... or 123+123+...
    const numbersRegEx = /^(([0-9]+)([,+](?=[0-9]))?)+$/;

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
};
