'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const banidb = require('@sttm/banidb');
const lib_1 = __importDefault(require('../lib'));
const anvaad = require('anvaad-js');
const sources = banidb.SOURCES;
const searchTypes = banidb.TYPES;
const allColumns = `v.ID, v.Gurmukhi, v.GurmukhiUni, v.Translations, v.PageNo AS PageNo, v.LineNo,
    v.SourceID as SourceID, s.ShabadID, v.FirstLetterStr, v.MainLetters, v.Visraam,
    v.FirstLetterEng, v.Transliterations, v.WriterID, w.WriterEnglish,
    w.WriterGurmukhi, w.WriterUnicode, v.RaagID, r.RaagGurmukhi,
    r.RaagUnicode, r.RaagEnglish, r.RaagWithPage, r.StartID, r.EndID,
    src.SourceGurmukhi, src.SourceUnicode, src.SourceEnglish,
    GREATEST(s.Updated, v.Updated) AS Updated`;
const liveColumns = `v.ID, v.Gurmukhi, v.GurmukhiUni, v.Translations, s.ShabadID`;
const allFrom = `FROM Verse v
  LEFT JOIN Shabad s ON s.VerseID = v.ID
  LEFT JOIN Writer w USING(WriterID)
  LEFT JOIN Raag r USING(RaagID)
  LEFT JOIN Source src USING(SourceID)`;
const allColumnsWhere = 'AND s.ShabadID < 5000000';
exports.search = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let searchQuery = req.params.query;
    let SourceID = req.query.source || '';
    let searchType = req.query.searchtype ? parseInt(req.query.searchtype, 10) : 0;
    let writer = parseInt(req.query.writer, 10) || null;
    let raag = parseInt(req.query.raag, 10) || null;
    let ang = parseInt(req.query.ang, 10) || null;
    let page = parseInt(req.query.page, 10) || 0;
    let results = parseInt(req.query.results, 10) || 20;
    const sinceDate = req.query.updatedsince
      ? lib_1.default.isValidDatetime(req.query.updatedsince)
      : null;
    const liveSearch = req.query.livesearch ? parseInt(req.query.livesearch, 10) : 0;
    SourceID = SourceID.substr(0, 1);
    if (!searchTypes[searchType]) {
      searchType = 0;
    }
    if (writer && writer < 0) {
      writer = 0;
    }
    if (raag && raag < 0) {
      raag = 0;
    }
    if (ang && ang < 0) {
      ang = 0;
    }
    if (page && page < 1) {
      page = 1;
    }
    if (results < 1) {
      results = 20;
    }
    let columns = liveSearch === 1 ? `${liveColumns} ${allFrom}` : `${allColumns} ${allFrom}`;
    let charCodeQuery = '';
    let charCodeQueryWildCard = '';
    const conditions = [];
    const parameters = [];
    let groupBy = '';
    let orderBy = '';
    // only do for first letter searches
    if (searchType === 0 || searchType === 1) {
      // ignore spaces
      searchQuery = searchQuery.replace(/\s+/g, '');
      // convert unicode to ascii
      searchQuery = anvaad.unicode(searchQuery, true);
      for (let x = 0, len = searchQuery.length; x < len; x += 1) {
        let charCode = searchQuery.charCodeAt(x);
        // adding commas with the special characters make them harder to parse out, so just append them
        //  without having to worry about all that
        if (lib_1.default.searchOperators.DecSearchOperators.includes(charCode)) {
          charCodeQuery += searchQuery.charAt(x);
        } else {
          if (charCode < 100) {
            charCode = `0${charCode}`;
          }
          charCodeQuery += `,${charCode}`;
        }
      }
      // Add trailing wildcard
      charCodeQueryWildCard = `${charCodeQuery},z`;
    }
    if (sources[SourceID]) {
      conditions.push('v.SourceID = ?');
      parameters.push(SourceID);
    }
    if (searchQuery) {
      if (searchType === 0) {
        // First letter start
        const queryObj = lib_1.default.searchOperators.firstLetterStartToQuery(
          charCodeQuery,
          charCodeQueryWildCard,
        );
        conditions.push(queryObj.condition);
        parameters.push(...queryObj.parameters);
        if (searchQuery.length < 3) {
          orderBy = 'FirstLetterLen,';
        }
      } else if (searchType === 1) {
        // First letter anywhere
        const queryObj = lib_1.default.searchOperators.firstLetterAnywhereToQuery(
          charCodeQuery,
          charCodeQueryWildCard,
        );
        columns += queryObj.columns === undefined ? '' : queryObj.columns;
        conditions.push(queryObj.condition);
        parameters.push(...queryObj.parameters);
        groupBy = 'GROUP BY v.ID';
        if (searchQuery.length < 3) {
          orderBy = 'FirstLetterLen,';
        }
      } else if (searchType === 2) {
        // Full word (Gurmukhi)
        // convert unicode to ascii
        searchQuery = anvaad.unicode(searchQuery, true);
        const queryObj = lib_1.default.searchOperators.fullWordGurmukhiToQuery(searchQuery);
        conditions.push(queryObj.condition);
        parameters.push(...queryObj.parameters);
        groupBy = 'GROUP BY v.ID';
      } else if (searchType === 3) {
        // Full word (English)
        const queryObj = lib_1.default.searchOperators.fullWordEnglishToQuery(searchQuery);
        columns += queryObj.columns === undefined ? '' : queryObj.columns;
        conditions.push(queryObj.condition);
        parameters.push(...queryObj.parameters);
        groupBy = 'GROUP BY v.ID';
      } else if (searchType === 4) {
        const queryObj = lib_1.default.searchOperators.fullWordRomanizedToQuery(searchQuery);
        conditions.push(queryObj.condition);
        parameters.push(...queryObj.parameters);
      } else if (searchType === 5) {
        // Ang
        // Reserved for Ang search - ideally it should go to /angs
        conditions.push('v.PageNo = ?');
        parameters.push(searchQuery);
      } else if (searchType === 6) {
        // Main letters
        // convert unicode to ascii
        searchQuery = anvaad.unicode(searchQuery, true);
        const words = searchQuery.split(' ').join('%');
        const queryObj = lib_1.default.searchOperators.mainLettersToQuery(words);
        columns += queryObj.columns === undefined ? '' : queryObj.columns;
        conditions.push(queryObj.condition);
        parameters.push(...queryObj.parameters);
        groupBy = 'GROUP BY v.ID';
      } else if (searchType === 7) {
        // first letters english
        // ignore spaces
        searchQuery = searchQuery.replace(/\s+/g, '');
        searchQuery = searchQuery.toLowerCase();
        conditions.push('v.FirstLetterEng LIKE ?');
        parameters.push(`%${searchQuery}%`);
      }
    }
    if (writer && writer > 0) {
      conditions.push('v.WriterID = ?');
      parameters.push(writer);
    }
    if (raag && raag > 0) {
      conditions.push('v.RaagID = ?');
      parameters.push(raag);
    }
    if (ang && ang > 0) {
      conditions.push('v.PageNo = ?');
      parameters.push(ang);
    }
    if (sinceDate) {
      conditions.push('v.Updated > ?');
      parameters.push(sinceDate);
    }
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q = `SELECT ${columns}
      WHERE ${conditions.join(' AND ')}
      ${groupBy}
      ORDER BY ${orderBy} ShabadID ASC`;
      const row = yield conn.query(`SELECT COUNT(*) FROM (${q}) AS count`, parameters);
      const totalResults = row[0]['COUNT(*)'];
      const totalPages = Math.ceil(totalResults / results);
      if (page > totalPages) {
        page = totalPages;
      }
      const resultsInfo = {
        totalResults,
        pageResults: totalResults,
        pages: {
          page,
          resultsPerPage: results,
          totalPages,
        },
      };
      if (totalResults > 0) {
        if (page < totalPages) {
          req.query.page = page + 1;
          resultsInfo.pages.nextPage = `${req.protocol}://${req.get('host')}${req.baseUrl}${
            req.path
          }?${Object.keys(req.query)
            .map(key => `${key}=${encodeURIComponent(req.query[key])}`)
            .join('&')}`;
        }
        const rows = yield conn.query(`${q} LIMIT ?, ?`, [
          ...parameters,
          (page - 1) * results,
          results,
        ]);
        const verses = rows.map(verse => lib_1.default.prepVerse(verse, true, liveSearch));
        resultsInfo.pageResults = verses.length;
        res.json({
          resultsInfo,
          verses,
        });
      } else {
        res.json({
          resultsInfo,
          verses: [],
        });
      }
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.shabads = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let { ShabadID } = req.params;
    const sinceDate = req.query.updatedsince
      ? lib_1.default.isValidDatetime(req.query.updatedsince)
      : null;
    if (lib_1.default.isListOfNumbers(ShabadID)) {
      ShabadID = ShabadID.split(/[,+]/g);
      try {
        const rows = yield getShabad(req, res, ShabadID, sinceDate);
        if (Object.entries(rows).length === 0) {
          lib_1.default.error(
            'Shabad does not exist or no updates found for specified Shabad.',
            res,
            404,
            false,
          );
        } else {
          res.json(rows);
        }
      } catch (err) {
        lib_1.default.error(err, res, 500);
      }
    } else {
      lib_1.default.error('Malformed URL', res, 400, false);
    }
  });
exports.angs = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let { PageNo } = req.params;
    const sinceDate = req.query.updatedsince
      ? lib_1.default.isValidDatetime(req.query.updatedsince)
      : null;
    if (!lib_1.default.isRangeOfNumbers(PageNo)) {
      PageNo = '1';
    }
    let { SourceID } = req.params;
    // Check if SourceID is supported or default to 'G'
    if (!sources[SourceID]) {
      SourceID = 'G';
    }
    // If SGGS, check if within 1430
    if (SourceID === 'G' && PageNo > 1430) {
      PageNo = '1430';
    }
    const PageNoQuery = lib_1.default.searchOperators.angToQuery(PageNo);
    const parameters = [...PageNoQuery.parameters, SourceID];
    let sinceQuery = '';
    if (sinceDate) {
      sinceQuery = 'AND GREATEST(s.Updated, v.Updated) > ?';
      parameters.push(sinceDate);
    }
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q = `SELECT ${allColumns} ${allFrom}
      WHERE
        ${PageNoQuery.q}
        AND v.SourceID = ?
        ${sinceQuery}
        ${allColumnsWhere}
      ORDER BY PageNo,v.LineNo ASC, ShabadID ASC, v.ID ASC`;
      const rows = yield conn.query(q, parameters);
      if (rows.length > 0 && PageNoQuery.totalPages === 1) {
        // single ang
        const output = yield getAngSingle(req, res, rows);
        res.json(output);
      } else if (rows.length > 0) {
        // multiple ang
        const output = {
          pageNos: [],
          pages: [],
        };
        let curPage = -1;
        let counter = 0;
        rows.forEach(row => {
          if (row.PageNo !== curPage) {
            curPage = row.PageNo;
            output.pageNos.push(curPage);
            counter = output.pages.push([]) - 1;
          }
          output.pages[counter].push(row);
        });
        const outputPagePromises = output.pages.map(row => getAngSingle(req, res, row));
        output.pages = yield Promise.all(outputPagePromises);
        res.json(output);
      } else {
        lib_1.default.error('That ang does not exist or no updates found.', res, 404, false);
      }
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
exports.hukamnamas = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let q;
    const output = {};
    const args = [];
    let exit = false;
    if (req.params.year && req.params.month && req.params.day) {
      const year = parseInt(req.params.year, 10);
      const month = parseInt(req.params.month, 10);
      const day = parseInt(req.params.day, 10);
      const validDate = new Date(year, month - 1, day).getTime();
      const archiveDate = new Date(2002, 0, 1).getTime();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (validDate >= archiveDate && validDate <= tomorrow.getTime()) {
        q = 'SELECT ID as hukamDate, ShabadID FROM Hukamnama WHERE ID = ?';
        args.push(`${year}-${month}-${day}`);
      } else {
        lib_1.default.error(
          'Please specify a valid date. Archives go back to 2002-01-01',
          res,
          404,
          false,
        );
        exit = true;
      }
    }
    if (!q) {
      q = 'SELECT ID as hukamDate, ShabadID FROM Hukamnama ORDER BY ID DESC LIMIT 1';
      output.isLatest = true;
    }
    if (!exit) {
      let conn;
      try {
        conn = yield req.app.locals.pool.getConnection();
        const row = yield conn.query(q, args);
        if (row.length > 0) {
          const { hukamDate } = row[0];
          const ShabadIDs = JSON.parse(row[0].ShabadID);
          const shabads = yield getShabad(req, res, ShabadIDs, null, true);
          const hukamGregorianDate = new Date(hukamDate);
          const date = {
            gregorian: {
              month: hukamGregorianDate.getMonth() + 1,
              date: hukamGregorianDate.getDate(),
              year: hukamGregorianDate.getFullYear(),
            },
          };
          output.date = date;
          output.shabadIds = ShabadIDs;
          output.shabads = shabads.shabads ? shabads.shabads : shabads;
          res.cacheControl = { maxAge: 1800 };
          res.json(output);
        } else {
          lib_1.default.error('Hukamnama is missing for that date', res, 404, false);
        }
      } catch (err) {
        lib_1.default.error(err, res, 500);
      } finally {
        if (conn) conn.end();
      }
    }
  });
exports.random = (req, res) =>
  __awaiter(void 0, void 0, void 0, function*() {
    let { SourceID } = req.params;
    // Check if SourceID is supported or default to 'G'
    if (!sources[SourceID]) {
      SourceID = 'G';
    }
    let conn;
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q =
        'SELECT DISTINCT s.ShabadID, v.PageNo FROM Shabad s JOIN Verse v ON s.VerseID = v.ID WHERE v.SourceID = ? ORDER BY RAND() LIMIT 1';
      const row = yield conn.query(q, [SourceID]);
      const { ShabadID } = row[0];
      const rows = yield getShabad(req, res, [ShabadID]);
      res.cacheControl = { noCache: true };
      res.json(rows);
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
  });
const getShabad = (req, res, ShabadIDQ, sinceDate = null, forceMulti = false) =>
  new Promise((resolve, reject) => {
    req.app.locals.pool
      .getConnection()
      .then(conn => {
        const parameters = [...ShabadIDQ];
        const ShabadIDQLength = ShabadIDQ.length;
        const tokens = new Array(ShabadIDQLength).fill('?').join(',');
        let sinceQuery = '';
        if (sinceDate) {
          sinceQuery = 'AND GREATEST(s.Updated, v.Updated) > ?';
          parameters.push(sinceDate);
        }
        let multipleShabadOrder = '';
        if (ShabadIDQLength > 1) {
          multipleShabadOrder = `FIELD(ShabadID, ${tokens}),`;
          parameters.push(...ShabadIDQ);
        }
        const q = `SELECT ${allColumns}, sn.VerseID as ShabadName
                    ${allFrom} LEFT JOIN ShabadName sn USING(ShabadID)
                    WHERE s.ShabadID IN (${tokens}) ${allColumnsWhere} ${sinceQuery}
                    ORDER BY ${multipleShabadOrder} v.ID ASC`;
        conn
          .query(q, parameters)
          .then(rows =>
            __awaiter(void 0, void 0, void 0, function*() {
              if (rows.length > 0 && ShabadIDQLength === 1 && forceMulti === false) {
                // single shabad
                const retShabad = yield getShabadSingle(req, res, rows);
                resolve(retShabad);
              } else if (rows.length > 0) {
                // multiple shabads
                const output = {
                  shabadIds: [],
                  shabads: [],
                };
                let curShabadID = -1;
                let counter = 0;
                rows.forEach(row => {
                  if (row.ShabadID !== curShabadID) {
                    curShabadID = row.ShabadID;
                    output.shabadIds.push(curShabadID);
                    counter = output.shabads.push([]) - 1;
                  }
                  output.shabads[counter].push(row);
                });
                const outputShabadPromises = output.shabads.map(row =>
                  getShabadSingle(req, res, row),
                );
                output.shabads = yield Promise.all(outputShabadPromises);
                resolve(output);
              } else {
                resolve({});
              }
              if (conn) conn.end();
            }),
          )
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
const getAngSingle = (req, res, rows) =>
  __awaiter(void 0, void 0, void 0, function*() {
    const { PageNo, SourceID } = rows[0];
    const source = lib_1.default.getSource(rows[0]);
    const count = rows.length;
    const page = rows.map(row => {
      const rowData = lib_1.default.prepVerse(row);
      rowData.writer = lib_1.default.getWriter(row);
      rowData.raag = lib_1.default.getRaag(row);
      return rowData;
    });
    const navigation = yield getNavigation(req, res, 'ang', PageNo, PageNo, SourceID);
    return {
      source,
      count,
      navigation,
      page,
    };
  });
const getShabadSingle = (req, res, rows) =>
  __awaiter(void 0, void 0, void 0, function*() {
    const shabadInfo = lib_1.default.getShabadInfo(rows[0]);
    const verses = rows.map(lib_1.default.prepVerse);
    const navigation = yield getNavigation(
      req,
      res,
      'shabad',
      rows[0].ID,
      rows[rows.length - 1].ID,
    );
    return {
      shabadInfo,
      count: verses.length,
      navigation,
      verses,
    };
  });
const getNavigation = (req, res, type, first, last, source = '') =>
  __awaiter(void 0, void 0, void 0, function*() {
    let conn;
    let table = 'Verse';
    let column = '';
    let where = '';
    let columnWhere = '';
    let parameters = [first, last];
    if (type === 'shabad') {
      table = 'Shabad';
      column = 'ShabadID';
      columnWhere = 'VerseID';
    } else if (type === 'ang') {
      column = 'PageNo';
      parameters = [first, source, last, source];
      columnWhere = column;
      where = 'AND SourceID = ?';
    } else {
      return false;
    }
    try {
      conn = yield req.app.locals.pool.getConnection();
      const q1 = `(SELECT 'previous' as navigation, ${column}
                  FROM ${table}
                  WHERE ${columnWhere} < ? ${where}
                  ORDER BY ${columnWhere} DESC LIMIT 1)
                UNION
                (SELECT 'next' as navigation, ${column}
                  FROM ${table}
                  WHERE ${columnWhere} > ? ${where}
                  ORDER BY ${columnWhere} LIMIT 1);`;
      const rows1 = yield conn.query(q1, parameters);
      let previous = null;
      let next = null;
      rows1.forEach(row => {
        if (row.navigation === 'previous') {
          previous = row[column];
        }
        if (row.navigation === 'next') {
          next = row[column];
        }
      });
      return {
        previous,
        next,
      };
    } catch (err) {
      lib_1.default.error(err, res, 500);
    } finally {
      if (conn) conn.end();
    }
    return {};
  });
