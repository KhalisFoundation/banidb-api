module.exports = {
  angToQuery: PageNo => {
    const hasOperatorsRegEx = /[<>+-]/gm;

    if (!PageNo.match(hasOperatorsRegEx)) {
      return {
        q: 'v.PageNo = ?',
        parameters: [PageNo],
        least: PageNo,
        most: PageNo,
        totalPages: 1,
      };
    }

    const qOR = [];
    const qAND = [];
    const qIn = [];
    const parameters = [];
    let least = 0;
    let most = 0;

    const ltgtRegEx = /[<>][0-9]+/gm;

    const ltgt = PageNo.match(ltgtRegEx);
    if (ltgt) {
      let loopnum = 0;
      ltgt.forEach(num => {
        if (!num.match(/-$/)) {
          loopnum = num.slice(1);
          parameters.push(loopnum);
          const operator = num.slice(0, 1);
          qAND.push(`v.PageNo ${operator} ?`);
          if (loopnum < least || loopnum === 0) {
            least = loopnum;
          }
          if (loopnum > most) {
            most = loopnum;
          }
        }
      });
    }

    const betweenRegEx = /[0-9]+-[0-9]+/g;

    const between = PageNo.match(betweenRegEx);
    if (between) {
      let numbers = [];
      between.forEach(range => {
        numbers = range.match(/[0-9]+/g);
        parameters.push(...numbers);
        qOR.push('v.PageNo BETWEEN ? AND ?');
        numbers.forEach(num => {
          if (num < least || num === 0) {
            least = num;
          }
          if (num > most) {
            most = num;
          }
        });
      });
    }

    const equalsRegEx = /(^|\+)([0-9]+)-?/g;

    const equals = PageNo.match(equalsRegEx);

    if (equals) {
      equals.forEach(num => {
        if (!num.match(/-$/)) {
          parameters.push(num.replace(/\+/, ''));
          qIn.push('?');
          if (num < least || num === 0) {
            least = num;
          }
          if (num > most) {
            most = num;
          }
        }
      });
      if (qIn.length > 0) {
        const qInStr = qIn.join(',');
        qOR.push(`v.PageNo IN (${qInStr})`);
      }
    }

    const qOutOr = qOR.join(' OR ');
    qAND.push(`(${qOutOr})`);
    const qOut = qAND.join(' AND ');

    return {
      q: qOut,
      parameters,
      least,
      most,
      totalPages: ltgt ? null : parameters.length,
    };
  },
};
