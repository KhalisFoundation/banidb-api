// Search query → SQL conditions, ported from api/lib/searchOperators.js.
// Users can combine terms with operators: `+` (must have), `-` (must not
// have), `*` (anything), and quotes (exact).

import { lowerFirst, upperFirst } from 'lodash';

export interface QueryPart {
  condition: string;
  parameters: string[];
  columns?: string;
}

const ASTERISK_SQL = '%';
const SEARCH_OPERATORS = ['+', '-', '*', '"', "'"];
// Char codes of the operators above, which first-letter searches keep as they are.
export const DEC_SEARCH_OPERATORS = [43, 45, 42, 34, 39];

// Splits a query at + and - (each part keeps its sign): pretty much the whole
// ASCII range except + (\x2B) and - (\x2D).
// eslint-disable-next-line no-control-regex
const SPLIT_AT_PLUS_OR_MINUS = /[+-]?[\x00-\x2A\x2C\x2A\x2E-\x7F]+/g;

const hasOperator = (query: string) => SEARCH_OPERATORS.some((op) => query.includes(op));

// Letters that can carry a bindi (ਸ/ਸ਼ …): a first-letter search for one also
// finds the other. ASCII char codes as the first-letter strings store them.
const BINDI_CHARACTERS: Record<string, string> = {
  '103': '090', // ਸ: ਸ਼
  '106': '122', // ਖ: ਖ਼
  '115': '083', // ਗ: ਗ਼
  '075': '094', // ਜ: ਜ਼
  '080': '038', // ਫ: ਫ਼
};

function replaceAsterisksAndQuotes(str: string) {
  let res = str;
  if (str.includes('*')) res = str.replace(/\*+/g, ASTERISK_SQL);
  if (str.includes('"') || str.includes("'")) {
    res = res.replace(/"+/g, '');
    res = res.replace(/'+/g, '');
  }
  return res;
}

function conditionsAndParams(
  matches: string[],
  removeSpaces: boolean,
  isStartSearch: boolean,
  positiveCondition: string,
  negativeCondition: string,
) {
  const conditions: string[] = [];
  const parameters: string[] = [];

  matches.forEach((match) => {
    let modifiedMatch = removeSpaces ? match.replace(/\s+/g, '') : match;
    modifiedMatch = replaceAsterisksAndQuotes(modifiedMatch);

    if (isStartSearch && matches.length === 1 && !match.includes('+') && !match.includes('-')) {
      // A "*" or quotes in a first-letter-start search: only the start has to match.
      conditions.push(positiveCondition);
      parameters.push(`${modifiedMatch}%`);
    } else if (
      modifiedMatch.includes('+') ||
      (!modifiedMatch.includes('+') && !modifiedMatch.includes('-'))
    ) {
      // The first part has no sign; it's an implicit +.
      modifiedMatch = modifiedMatch.replace(/\++/g, '');
      conditions.push(positiveCondition);
      parameters.push(`%${modifiedMatch}%`);
    } else if (modifiedMatch.includes('-')) {
      modifiedMatch = modifiedMatch.replace(/-+/g, '');
      conditions.push(negativeCondition);
      parameters.push(`%${modifiedMatch}%`);
    }
  });

  return { conditions, parameters };
}

// The same condition again with bindi letters swapped (ਸ → ਸ਼), OR-ed.
function withBindiVariants(part: QueryPart): QueryPart {
  const [charCodeQuery, charCodeQueryWildcard] = part.parameters;
  const variants = charCodeQuery
    .split(',')
    .reduce<[string, string]>(
      ([query, wildcard], charCode) =>
        Object.hasOwn(BINDI_CHARACTERS, charCode)
          ? [
              query.replaceAll(charCode, BINDI_CHARACTERS[charCode]),
              wildcard.replaceAll(charCode, BINDI_CHARACTERS[charCode]),
            ]
          : [query, wildcard],
      [charCodeQuery, charCodeQueryWildcard],
    );

  return {
    ...part,
    condition: `(${part.condition} OR ${part.condition})`,
    parameters: [...part.parameters, ...variants],
  };
}

// Splits at the operators and turns each part into a condition on `column`.
function operatorsToQuery(
  query: string,
  removeSpaces: boolean,
  isStartSearch: boolean,
  positive: string,
  negative: string,
): QueryPart {
  const matches = query.match(SPLIT_AT_PLUS_OR_MINUS);
  if (matches && matches.length > 0) {
    const { conditions, parameters } = conditionsAndParams(
      matches,
      removeSpaces,
      isStartSearch,
      positive,
      negative,
    );
    return { condition: conditions.join(' AND '), parameters };
  }
  // Only an asterisk or quotes: just clean up the operators.
  return { condition: positive, parameters: [replaceAsterisksAndQuotes(query)] };
}

// First letter of each word, from the start of the line.
export function firstLetterStartToQuery(
  charCodeQuery: string,
  charCodeQueryWildcard: string,
): QueryPart {
  if (hasOperator(charCodeQuery)) {
    return operatorsToQuery(
      charCodeQuery,
      false,
      true,
      'v.FirstLetterStr LIKE ?',
      'v.FirstLetterStr NOT LIKE ?',
    );
  }
  return withBindiVariants({
    condition: 'v.FirstLetterStr BETWEEN ? AND ?',
    parameters: [charCodeQuery, charCodeQueryWildcard],
  });
}

// First letter of each word, anywhere in the line.
export function firstLetterAnywhereToQuery(
  charCodeQuery: string,
  charCodeQueryWildcard: string,
): QueryPart {
  if (hasOperator(charCodeQuery)) {
    return operatorsToQuery(
      charCodeQuery,
      false,
      false,
      'v.FirstLetterStr LIKE ?',
      'v.FirstLetterStr NOT LIKE ?',
    );
  }
  return withBindiVariants({
    columns: ' LEFT JOIN tokenized_firstletters t ON t.verseid = v.ID',
    condition: 't.token BETWEEN ? AND ?',
    parameters: [charCodeQuery, charCodeQueryWildcard],
  });
}

// Romanized words: the first letter of each word, matched against FirstLetterEng.
const firstLettersOfWords = (text: string) =>
  `%${text
    .split(' ')
    .map((word) => word.substr(0, 1))
    .join('')}%`;

export function fullWordRomanizedToQuery(searchQuery: string): QueryPart {
  if (hasOperator(searchQuery)) {
    const lower = searchQuery.toLowerCase();
    const matches = lower.match(SPLIT_AT_PLUS_OR_MINUS);

    if (matches && matches.length > 0) {
      const conditions: string[] = [];
      const parameters: string[] = [];
      // Unlike the other searches, the parts are split at the operators first
      // and then into words.
      matches.forEach((match) => {
        const negative = !(match.includes('+') || (!match.includes('+') && !match.includes('-')));
        if (negative && !match.includes('-')) return;
        let modifiedMatch = match.replace(negative ? /-+/g : /\++/g, '');
        conditions.push(negative ? 'v.FirstLetterEng NOT LIKE ?' : 'v.FirstLetterEng LIKE ?');
        if (match.includes('*')) modifiedMatch = modifiedMatch.replace(/\*+/g, ASTERISK_SQL);
        if (match.includes('"') || match.includes("'")) {
          modifiedMatch = modifiedMatch.replace(/"+/g, '');
          modifiedMatch = modifiedMatch.replace(/'+/g, '');
        }
        parameters.push(firstLettersOfWords(modifiedMatch));
      });
      return { condition: conditions.join(' AND '), parameters };
    }

    return {
      condition: 'v.FirstLetterEng LIKE ?',
      parameters: [firstLettersOfWords(replaceAsterisksAndQuotes(lower))],
    };
  }

  return {
    condition: 'v.FirstLetterEng LIKE ?',
    parameters: [firstLettersOfWords(searchQuery.toLowerCase())],
  };
}

// Whole Gurmukhi (ASCII) words.
export function fullWordGurmukhiToQuery(searchQuery: string): QueryPart {
  const query = searchQuery.replace(/(\[|\])/g, '');
  if (hasOperator(query)) {
    return operatorsToQuery(
      query,
      true,
      false,
      'v.Gurmukhi LIKE BINARY ?',
      'v.Gurmukhi NOT LIKE BINARY ?',
    );
  }
  return { condition: 'v.Gurmukhi LIKE BINARY ?', parameters: [`%${query}%`] };
}

// Whole English words in the BaniDB translation.
export function fullWordEnglishToQuery(searchQuery: string): QueryPart {
  if (hasOperator(searchQuery)) {
    return operatorsToQuery(
      searchQuery,
      false,
      false,
      "json_extract(v.Translations, '$.en.bdb') LIKE ? COLLATE utf8mb4_general_ci",
      "json_extract(v.Translations, '$.en.bdb') NOT LIKE ? COLLATE utf8mb4_general_ci",
    );
  }
  return {
    columns: ' LEFT JOIN tokenized_english t ON t.verseid = v.ID',
    condition: '(t.token LIKE ? OR t.token LIKE ?)',
    parameters: [`${upperFirst(searchQuery)}%`, `${lowerFirst(searchQuery)}%`],
  };
}

// Main letters (the line without vowel signs); words joined by %.
export function mainLettersToQuery(words: string): QueryPart {
  if (hasOperator(words)) {
    return operatorsToQuery(
      words,
      true,
      false,
      'v.MainLetters LIKE BINARY ?',
      'v.MainLetters NOT LIKE BINARY ?',
    );
  }
  return {
    columns: ' LEFT JOIN tokenized_mainletters t ON t.verseid = v.ID',
    condition: 't.token LIKE BINARY ?',
    parameters: [`${words}%`],
  };
}

export interface AngQuery {
  q: string;
  parameters: string[];
  totalPages: number | null;
}

/**
 * Ang (page) numbers with operators → a WHERE clause.
 *
 * @example
 * angToQuery('<1000+105+900-905')
 * // q: 'v.PageNo < ? AND (v.PageNo BETWEEN ? AND ? OR v.PageNo IN (?))'
 * // parameters: ['1000', '900', '905', '105'], totalPages: null
 */
export function angToQuery(pageNo: string): AngQuery {
  if (!/[<>+-]/.test(pageNo)) {
    return { q: 'v.PageNo = ?', parameters: [pageNo], totalPages: 1 };
  }

  const qOR: string[] = [];
  const qAND: string[] = [];
  const qIn: string[] = [];
  const parameters: string[] = [];

  const ltgt = pageNo.match(/[<>][0-9]+/g);
  ltgt?.forEach((num) => {
    parameters.push(num.slice(1));
    qAND.push(`v.PageNo ${num.slice(0, 1)} ?`);
  });

  pageNo.match(/[0-9]+-[0-9]+/g)?.forEach((range) => {
    parameters.push(...(range.match(/[0-9]+/g) as string[]));
    qOR.push('v.PageNo BETWEEN ? AND ?');
  });

  pageNo.match(/(^|\+)([0-9]+)-?/g)?.forEach((num) => {
    if (!/-$/.test(num)) {
      parameters.push(num.replace(/\+/, ''));
      qIn.push('?');
    }
  });
  if (qIn.length > 0) qOR.push(`v.PageNo IN (${qIn.join(',')})`);

  qAND.push(`(${qOR.join(' OR ')})`);
  return { q: qAND.join(' AND '), parameters, totalPages: ltgt ? null : parameters.length };
}
