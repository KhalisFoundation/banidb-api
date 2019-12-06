module.exports = {
  angToQuery: PageNo => {
    const hasOperatorsRegEx = /[<>+-]/gm;

    if (!PageNo.match(hasOperatorsRegEx)) {
      return {
        q: 'v.PageNo = ?',
        parameters: [PageNo],
      };
    }

    const qOR = [];
    const qAND = [];
    const qIn = [];
    const parameters = [];

    const ltgtRegEx = /[<>][0-9]+/gm;

    const ltgt = PageNo.match(ltgtRegEx);
    if (ltgt) {
      ltgt.map(num => {
        if (!num.match(/-$/)) {
          parameters.push(num.slice(1));
          const operator = num.slice(0, 1);
          qAND.push(`v.PageNo ${operator} ?`);
        }
        return true;
      });
    }

    const betweenRegEx = /[0-9]+-[0-9]+/g;

    const between = PageNo.match(betweenRegEx);
    if (between) {
      let numbers = [];
      between.map(range => {
        numbers = range.match(/[0-9]+/g);
        parameters.push(...numbers);
        qOR.push('v.PageNo BETWEEN ? AND ?');
        return true;
      });
    }

    const equalsRegEx = /\+([0-9]+)-?/g;

    const equals = PageNo.match(equalsRegEx);

    if (equals) {
      equals.map(num => {
        if (!num.match(/-$/)) {
          parameters.push(num.replace(/\+/, ''));
          qIn.push('?');
        }
        return true;
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
    };
  },
};
