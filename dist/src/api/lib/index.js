'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const getJSON_1 = __importDefault(require('./getJSON'));
const searchOperators_1 = __importDefault(require('./searchOperators'));
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
      ret.data.stack = err.stack;
      console.error(err);
      Error.captureStackTrace(err);
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
exports.default = Object.assign(Object.assign(Object.assign({}, lib), getJSON_1.default), {
  searchOperators: searchOperators_1.default,
});
