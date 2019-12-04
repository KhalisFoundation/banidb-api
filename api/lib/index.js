module.exports = {
  isValidDatetime: str => {
    if (typeof str !== 'string') {
      return null;
    }

    if (
      str.match(
        /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9])(?:( [0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?(.[0-9]{1,6})?$/,
      )
    ) {
      return str;
    }

    return null;
  },
};
