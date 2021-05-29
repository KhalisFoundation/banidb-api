const lodash = require('lodash');
// defining this as an object was the only way I could access
// AsteriskMariadbTranslation, and AsteriskAsciiValue in the firstLetterStartToQuery function..
const constantsObj = {
  AsteriskAsciiValue: 42,
  AsteriskMariadbTranslation: '%',
  SearchOperators: ['+', '-', '*', '"', "'"],
  DecSearchOperators: [43, 45, 42, 34, 39],
};

const replaceAsterisksAndQuotes = str => {
  let res = str;

  if (str.includes('*')) {
    res = str.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
  }

  if (str.includes('"') || str.includes("'")) {
    res = res.replace(/"+/g, '');
    res = res.replace(/'+/g, '');
  }

  return res;
};

const getQueryConditionsAndParams = (
  matches,
  removeSpaces,
  isStartSearch,
  positiveCondition,
  negativeCondition,
) => {
  const conditions = [];
  const parameters = [];

  matches.forEach(match => {
    let modifiedMatch = removeSpaces ? match.replace(/\s+/g, '') : match;
    modifiedMatch = replaceAsterisksAndQuotes(modifiedMatch);

    if (isStartSearch && matches.length === 1 && !match.includes('+') && !match.includes('-')) {
      // this means either a "*" or "" is in the query, so the first letter part becomes more important
      // don't care about what comes after, just need to make sure the start matches properly if its first letter

      conditions.push(positiveCondition);
      parameters.push(`${modifiedMatch}%`);
    } else if (
      modifiedMatch.includes('+') ||
      (!modifiedMatch.includes('+') && !modifiedMatch.includes('-'))
    ) {
      // !match.includes('+') && !match.includes('-') means this is the very first part of the query
      // which is implicitly a plus (e.g. Awip+inrMjnu) means (e.g. +Awip+inrMjnu)
      // remove + if it exists
      modifiedMatch = modifiedMatch.replace(/\++/g, '');

      conditions.push(positiveCondition);
      parameters.push(`%${modifiedMatch}%`);
    } else if (modifiedMatch.includes('-')) {
      // remove - if it exists
      modifiedMatch = modifiedMatch.replace(/-+/g, '');

      conditions.push(negativeCondition);
      parameters.push(`%${modifiedMatch}%`);
    }
  });

  return {
    conditions,
    parameters,
  };
};

module.exports = {
  AsteriskAsciiValue: constantsObj.AsteriskAsciiValue,
  AsteriskMariadbTranslation: constantsObj.AsteriskMariadbTranslation,
  SearchOperators: constantsObj.SearchOperators,
  DecSearchOperators: constantsObj.DecSearchOperators,
  firstLetterStartToQuery: (charCodeQuery, charCodeQueryWildcard) => {
    if (constantsObj.SearchOperators.some(operator => charCodeQuery.includes(operator))) {
      // eslint-disable-next-line no-control-regex
      const seperateAtPlusorMinus = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;
      const matches = charCodeQuery.match(seperateAtPlusorMinus);
      const { conditions, parameters } = getQueryConditionsAndParams(
        matches,
        false,
        true,
        'v.FirstLetterStr LIKE ?',
        'v.FirstLetterStr NOT LIKE ?',
      );

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      const modifiedSearchQuery = replaceAsterisksAndQuotes(charCodeQuery);
      return {
        condition: 'v.FirstLetterStr LIKE ?',
        parameters: [modifiedSearchQuery],
      };
    }
    return {
      condition: 'v.FirstLetterStr BETWEEN ? AND ?',
      parameters: [charCodeQuery, charCodeQueryWildcard],
    };
  },
  firstLetterAnywhereToQuery: (charCodeQuery, charCodeQueryWildcard) => {
    if (constantsObj.SearchOperators.some(operator => charCodeQuery.includes(operator))) {
      // eslint-disable-next-line no-control-regex
      const seperateAtPlusorMinus = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;
      const matches = charCodeQuery.match(seperateAtPlusorMinus);

      const { conditions, parameters } = getQueryConditionsAndParams(
        matches,
        false,
        false,
        'v.FirstLetterStr LIKE ?',
        'v.FirstLetterStr NOT LIKE ?',
      );

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      const modifiedSearchQuery = replaceAsterisksAndQuotes(charCodeQuery);
      return {
        condition: 'v.FirstLetterStr LIKE ?',
        parameters: [modifiedSearchQuery],
      };
    }
    return {
      columns: ' LEFT JOIN tokenized_firstletters t ON t.verseid = v.ID',
      condition: 't.token BETWEEN ? AND ?',
      parameters: [charCodeQuery, charCodeQueryWildcard],
    };
  },
  fullWordRomanizedToQuery: searchQuery => {
    if (constantsObj.SearchOperators.some(operator => searchQuery.includes(operator))) {
      let modifiedSearchQuery = searchQuery.toLowerCase();

      // eslint-disable-next-line no-control-regex
      const seperateAtPlusorMinus = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;
      const matches = modifiedSearchQuery.match(seperateAtPlusorMinus);

      const conditions = [];
      const parameters = [];

      // this is a little bit different than what happens in the non-search operators path
      //  in that path, we split on the words and then construct the parameters
      //  in this path we'll split on the search operators and then construct the params
      matches.forEach(match => {
        if (match.includes('+') || (!match.includes('+') && !match.includes('-'))) {
          let modifiedMatch = match.replace(/\++/g, '');
          conditions.push('v.FirstLetterEng LIKE ?');

          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          }

          if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          let spicyWords = modifiedMatch.split(' ');
          spicyWords = spicyWords.map(word => word.substr(0, 1));

          modifiedMatch = `%${spicyWords.join('')}%`;
          parameters.push(modifiedMatch);
        } else if (match.includes('-')) {
          let modifiedMatch = match.replace(/-+/g, '');
          conditions.push('v.FirstLetterEng NOT LIKE ?');

          if (match.includes('*')) {
            modifiedMatch = modifiedMatch.replace(/\*+/g, constantsObj.AsteriskMariadbTranslation);
          }

          if (match.includes('"') || match.includes("'")) {
            modifiedMatch = modifiedMatch.replace(/"+/g, '');
            modifiedMatch = modifiedMatch.replace(/'+/g, '');
          }

          let spicyWords = modifiedMatch.split(' ');
          spicyWords = spicyWords.map(word => word.substr(0, 1));

          modifiedMatch = `%${spicyWords.join('')}%`;
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
      modifiedSearchQuery = replaceAsterisksAndQuotes(modifiedSearchQuery);

      let spicyWords = modifiedSearchQuery.split(' ');
      spicyWords = spicyWords.map(word => word.substr(0, 1));

      modifiedSearchQuery = `%${spicyWords.join('')}%`;

      return {
        condition: 'v.FirstLetterEng LIKE ?',
        parameters: [modifiedSearchQuery],
      };
    }

    // modifiedMatch.replace(/\s+/g, '')}
    let spicy = searchQuery.toLowerCase().split(' ');
    spicy = spicy.map(word => word.substr(0, 1));

    return {
      condition: 'v.FirstLetterEng LIKE ?',
      parameters: [`%${spicy.join('')}%`],
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

      const { conditions, parameters } = getQueryConditionsAndParams(
        matches,
        true,
        false,
        'v.Gurmukhi LIKE BINARY ?',
        'v.Gurmukhi NOT LIKE BINARY ?',
      );

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      // in the case they only have an asterisk or quotes, just clean up the operators
      modifiedSearchQuery = replaceAsterisksAndQuotes(modifiedSearchQuery);
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

      const { conditions, parameters } = getQueryConditionsAndParams(
        matches,
        false,
        false,
        "json_extract(v.Translations, '$.en.bdb') LIKE ? COLLATE utf8mb4_general_ci",
        "json_extract(v.Translations, '$.en.bdb') NOT LIKE ? COLLATE utf8mb4_general_ci",
      );

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      // in the case they only have an asterisk or quotes, just clean up the operators
      modifiedSearchQuery = replaceAsterisksAndQuotes(modifiedSearchQuery);
      return {
        condition: "json_extract(v.Translations, '$.en.bdb') LIKE ? COLLATE utf8mb4_general_ci",
        parameters: [modifiedSearchQuery],
      };
    }
    return {
      columns: ' LEFT JOIN tokenized_english t ON t.verseid = v.ID',
      condition: '(t.token LIKE ? OR t.token LIKE ?)',
      parameters: [`${lodash.upperFirst(searchQuery)}%`, `${lodash.lowerFirst(searchQuery)}%`],
    };
  },
  mainLettersToQuery: words => {
    let modifiedWords = words;
    if (constantsObj.SearchOperators.some(operator => modifiedWords.includes(operator))) {
      // refer to above method (uses same regex) for an explanation
      // eslint-disable-next-line no-control-regex
      const seperateAtPlusorMinus = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;
      const matches = modifiedWords.match(seperateAtPlusorMinus);

      const { conditions, parameters } = getQueryConditionsAndParams(
        matches,
        true,
        false,
        'v.MainLetters LIKE BINARY ?',
        'v.MainLetters NOT LIKE BINARY ?',
      );

      if (matches.length > 0) {
        return {
          condition: conditions.join(' AND '),
          parameters,
        };
      }

      // in the case they only have an asterisk or quotes, just clean up the operators
      modifiedWords = replaceAsterisksAndQuotes(modifiedWords);
      return {
        condition: 'v.MainLetters LIKE BINARY ?',
        parameters: [modifiedWords],
      };
    }
    return {
      columns: ' LEFT JOIN tokenized_mainletters t ON t.verseid = v.ID',
      condition: 't.token LIKE BINARY ?',
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

    return {
      q: qOut,
      parameters,
      least,
      most,
      totalPages: ltgt ? null : parameters.length,
    };
  },
};
