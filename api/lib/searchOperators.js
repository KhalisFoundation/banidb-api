// defining this as an object was the only way I could access
// AsteriskMariadbTranslation, and AsteriskAsciiValue in the firstLetterStartToQuery function..
const constantsObj = {
  AsteriskAsciiValue: 42,
  AsteriskMariadbTranslation: '%',
  SearchOperators: ['+', '-', '*', '"', "'"],
};

module.exports = {
  AsteriskAsciiValue: constantsObj.AsteriskAsciiValue,
  AsteriskMariadbTranslation: constantsObj.AsteriskMariadbTranslation,
  SearchOperators: constantsObj.SearchOperators,
  firstLetterStartToQuery: (charCodeQuery, charCodeQueryWildcard) => {
    // make sure node version > 6 to use includes
    if (charCodeQuery.includes(constantsObj.AsteriskMariadbTranslation)) {
      return {
        conditions: ['v.FirstLetterStr LIKE ?'],
        parameters: [`${charCodeQuery}${constantsObj.AsteriskMariadbTranslation}`],
      };
    }
    return {
      conditions: ['v.FirstLetterStr BETWEEN ? AND ?'],
      parameters: [charCodeQuery, charCodeQueryWildcard],
    };
  },
  fullWordGurmukhiToQuery: searchQuery => {
    // check if one or more of the search operators are in the searchQuery
    let modifiedSearchQuery = searchQuery.replace(/(\[|\])/g, '');

    if (constantsObj.SearchOperators.some(operator => modifiedSearchQuery.includes(operator))) {
      // pretty much the entire ascii range EXCEPT plus (\x2B) and minus (\x2D) which serve as seperators
      // have to disable linter here until we find a better regex
      // eslint-disable-next-line no-control-regex
      const seperateAtPlusorMinus = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;
      const matches = modifiedSearchQuery.match(seperateAtPlusorMinus);

      const conditions = [];
      const parameters = [];

      matches.forEach(match => {
        // !match.includes('+') && !match.includes('-') means this is the very first part of the query
        // which is implicitly a plus (e.g. Awip+inrMjnu) means (e.g. +Awip+inrMjnu)
        if (match.includes('+') || (!match.includes('+') && !match.includes('-'))) {
          // remove + if it exists
          let modifiedMatch = match.replace(/\++/g, '');
          conditions.push('v.Gurmukhi LIKE BINARY ?');

          // as it stands, theres really no difference between '*', "", '', etc.
          // so the following queries give the same results
          // "Awip" + "inrMjnu" + "Awpy" vs *Awip* + *inrMjnu* + *Awpy* vs Awip + inrMjnu + Awpy
          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          } else if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          // remove spaces
          modifiedMatch = `%${modifiedMatch.replace(/\s+/g, '')}%`;
          parameters.push(modifiedMatch);
        } else if (match.includes('-')) {
          // remove - if it exists
          let modifiedMatch = match.replace(/-+/g, '');
          conditions.push('v.Gurmukhi NOT LIKE BINARY ?');

          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          } else if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          modifiedMatch = `%${modifiedMatch.replace(/\s+/g, '')}%`;
          parameters.push(modifiedMatch);
        }
      });

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      // in the case they only have an asterisk or quotes, just clean up the operators
      modifiedSearchQuery = modifiedSearchQuery.replace(
        /\*+/g,
        constantsObj.AsteriskMariadbTranslation,
      );
      modifiedSearchQuery = modifiedSearchQuery.replace(/"+/g, '');
      modifiedSearchQuery = modifiedSearchQuery.replace(/'+/g, '');
      return {
        condition: 'v.Gurmukhi LIKE BINARY ?',
        parameters: [modifiedSearchQuery],
      };
    }
    return {
      condition: 'v.Gurmukhi LIKE BINARY ?',
      parameters: [`%${modifiedSearchQuery}%`],
    };
  },
  fullWordEnglishToQuery: searchQuery => {
    let modifiedSearchQuery = searchQuery;
    if (constantsObj.SearchOperators.some(operator => modifiedSearchQuery.includes(operator))) {
      // refer to above method (uses same regex) for an explanation
      // eslint-disable-next-line no-control-regex
      const seperateAtPlusorMinus = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;
      const matches = modifiedSearchQuery.match(seperateAtPlusorMinus);

      const conditions = [];
      const parameters = [];

      matches.forEach(match => {
        if (match.includes('+') || (!match.includes('+') && !match.includes('-'))) {
          let modifiedMatch = match.replace(/\++/g, '');
          conditions.push("json_extract(v.Translations, '$.en.bdb') LIKE ?");

          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          } else if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          // don't need to worry about replacing spaces because we're not doing a LIKE BINARY (though I suppose it wouldn't hurt...)
          parameters.push(`%${modifiedMatch}%`);
        } else if (match.includes('-')) {
          let modifiedMatch = match.replace(/-+/g, '');
          conditions.push("json_extract(v.Translations, '$.en.bdb') NOT LIKE ?");

          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          } else if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          parameters.push(`%${modifiedMatch}%`);
        }
      });

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      // in the case they only have an asterisk or quotes, just clean up the operators
      modifiedSearchQuery = modifiedSearchQuery.replace(
        /\*+/g,
        constantsObj.AsteriskMariadbTranslation,
      );
      modifiedSearchQuery = modifiedSearchQuery.replace(/"+/g, '');
      modifiedSearchQuery = modifiedSearchQuery.replace(/'+/g, '');
      return {
        condition: "json_extract(v.Translations, '$.en.bdb') LIKE ?",
        parameters: [modifiedSearchQuery],
      };
    }
    return {
      columns: ' LEFT JOIN tokenized_english t ON t.verseid = v.ID',
      condition: 't.token LIKE ?',
      // shouldn't there be a % at the beginning as well?
      // lets just keep it the same for now to not break existing flows.
      parameters: [`${searchQuery}%`],
    };
  },
  mainLettersToQuery: words => {
    let modifiedWords = words;
    if (constantsObj.SearchOperators.some(operator => modifiedWords.includes(operator))) {
      // refer to above method (uses same regex) for an explanation
      // eslint-disable-next-line no-control-regex
      const seperateAtPlusorMinus = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;
      const matches = modifiedWords.match(seperateAtPlusorMinus);

      const conditions = [];
      const parameters = [];

      matches.forEach(match => {
        if (match.includes('+') || (!match.includes('+') && !match.includes('-'))) {
          let modifiedMatch = match.replace(/\++/g, '');
          conditions.push('v.MainLetters LIKE BINARY ?');

          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          } else if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          // remove spaces
          modifiedMatch = `%${modifiedMatch.replace(/\s+/g, '')}%`;
          parameters.push(modifiedMatch);
        } else if (match.includes('-')) {
          let modifiedMatch = match.replace(/-+/g, '');
          conditions.push('v.MainLetters NOT LIKE BINARY ?');

          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          } else if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          modifiedMatch = `%${modifiedMatch.replace(/\s+/g, '')}%`;
          parameters.push(modifiedMatch);
        }
      });

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      // in the case they only have an asterisk or quotes, just clean up the operators
      modifiedWords = modifiedWords.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
      modifiedWords = modifiedWords.replace(/"+/g, '');
      modifiedWords = modifiedWords.replace(/'+/g, '');
      return {
        condition: 'v.MainLetters LIKE BINARY ?',
        parameters: [modifiedWords],
      };
    }
    return {
      columns: ' LEFT JOIN tokenized_mainletters t ON t.verseid = v.ID',
      condition: 't.token LIKE BINARY ?',
      // shouldn't there be a % at the beginning as well?
      // lets just keep it the same for now to not break existing flows.
      parameters: [`${words}%`],
    };
  },
  /**
   * Convert ang search operators to database query
   *
   * @since 2.1.2
   * @param {string} single page no, or page nos with operators
   * @returns {string} Returns database WHERE clauses
   * @example
   *
   * angToQuery: <1000+105+900-905
   * // => {
   *       q: 'v.PageNo < ? AND (v.PageNo BETWEEN ? AND ? OR v.PageNo IN (?))',
   *       parameters: [ '1000', '900', '905', '105' ],
   *       least: 0,
   *       most: '905',
   *       totalPages: null
   *       }
   */
  angToQuery: PageNo => {
    const hasOperatorsRegEx = /[<>+-]/g;

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

    const ltgtRegEx = /[<>][0-9]+/g;

    const ltgt = PageNo.match(ltgtRegEx);
    if (ltgt) {
      let loopnum = 0;
      ltgt.forEach(num => {
        if (!num.match(/-$/)) {
          loopnum = num.slice(1);
          parameters.push(loopnum);
          const operator = num.slice(0, 1);
          qAND.push(`v.PageNo ${operator} ?`);
          if (loopnum < least || loopnum === '0') {
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
          if (num < least || num === '0') {
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
          if (num < least || num === '0') {
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
    console.log({
      q: qOut,
      parameters,
      least,
      most,
      totalPages: ltgt ? null : parameters.length,
    });
    return {
      q: qOut,
      parameters,
      least,
      most,
      totalPages: ltgt ? null : parameters.length,
    };
  },
};
