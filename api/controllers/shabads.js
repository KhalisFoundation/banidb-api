const { createPool, format } = require('mysql');
const banidb = require('shabados');
const {
  prepVerse,
  getSource,
  getRaag,
  getWriter,
} = require('./getJSON');
const config = require('../config');

const sources = banidb.SOURCES;
const searchTypes = banidb.TYPES;

const pool = createPool(config.mysql);
const query = pool.query.bind(pool);

const allColumns = `v.ID, v.Gurmukhi, v.GurmukhiUni, v.English, v.Punjabi,
    v.PunjabiUni, v.Spanish, v.PageNo AS PageNo, v.LineNo,
    v.SourceID as SourceID, s.ShabadID, v.FirstLetterStr, v.MainLetters,
    v.Bisram, v.igurbani_bisram1, v.igurbani_bisram2,
    v.FirstLetterEng, v.Transliteration, v.WriterID, w.WriterEnglish,
    w.WriterGurmukhi, w.WriterUnicode, v.RaagID, r.RaagGurmukhi,
    r.RaagUnicode, r.RaagEnglish, r.RaagWithPage, r.StartID, r.EndID,
    src.SourceGurmukhi, src.SourceUnicode, src.SourceEnglish,
    GREATEST(s.Updated, v.Updated) AS Updated
  FROM Verse v
  LEFT JOIN Shabad s ON s.VerseID = v.ID
  LEFT JOIN Writer w USING(WriterID)
  LEFT JOIN Raag r USING(RaagID)
  LEFT JOIN Source src USING(SourceID)`;

const allColumnsWhere = 'AND s.ShabadID < 5000000';

function error(err, res) {
  res.json(err);
}

exports.search = (req, res) => {
  const searchQuery = req.params.query;
  let SourceID = req.query.source || '';
  let searchType = parseInt(req.query.searchtype, 10) || 1;
  let writer = parseInt(req.query.writer, 10) || null;
  let raag = parseInt(req.query.raag, 10) || null;
  let ang = parseInt(req.query.ang, 10) || null;
  let page = parseInt(req.query.page, 10) || 0;
  let results = parseInt(req.query.results, 10) || 20;

  SourceID = SourceID.substr(0, 1);

  if (!searchTypes[searchType]) {
    searchType = 1;
  }

  if (writer < 0) {
    writer = 0;
  }

  if (raag < 0) {
    raag = 0;
  }

  if (ang < 0) {
    ang = 0;
  }

  if (page < 1) {
    page = 1;
  }

  if (results < 1) {
    results = 20;
  }

  let columns = allColumns;
  let charCodeQuery = '';
  const conditions = [];
  const parameters = [];
  let groupBy = '';
  let orderBy = '';

  for (let x = 0, len = searchQuery.length; x < len; x += 1) {
    let charCode = searchQuery.charCodeAt(x);
    if (charCode < 100) {
      charCode = `0${charCode}`;
    }
    charCodeQuery += `,${charCode}`;
  }
  // Add trailing wildcard
  charCodeQuery += '%';

  if (sources[SourceID]) {
    conditions.push('v.SourceID = ?');
    parameters.push(SourceID);
  }

  if (searchQuery) {
    if (searchType === 0) { // First letter start
      conditions.push('v.FirstLetterStr LIKE ?');
      parameters.push(charCodeQuery);
      if (searchQuery.length < 3) {
        orderBy = 'FirstLetterLen,';
      }
    } else if (searchType === 1) { // First letter anywhere
      columns += ' LEFT JOIN tokenized_firstletters t ON t.verseid = v.ID';
      conditions.push('t.token LIKE BINARY ?');
      parameters.push(charCodeQuery);
      groupBy = 'GROUP BY v.ID';
      if (searchQuery.length < 3) {
        orderBy = 'FirstLetterLen,';
      }
    } else if (searchType === 2) { // Full word (Gurmukhi)
      columns += ' LEFT JOIN tokenized_gurmukhi t ON t.verseid = v.ID';
      conditions.push('t.token LIKE BINARY ?');
      parameters.push(searchQuery.replace(/(\[|\])/g, ''));
    } else if (searchType === 3) { // Full word (English)
      columns += ' LEFT JOIN tokenized_english t ON t.verseid = v.ID';
      conditions.push('t.token LIKE ?');
      parameters.push(`${searchQuery}%`);
      groupBy = 'GROUP BY v.ID';
    } else if (searchType === 4) { // Full word (Romanized)
      const spicy = searchQuery.toLowerCase().split(' ');
      spicy.map(word => word.substr(0, 1));
      conditions.push('v.FirstLetterEng LIKE ?');
      parameters.push(`%${spicy.join('')}`);
    } else if (searchType === 5) { // Ang
      // Reserved for Ang search - ideally it should go to /angs
      conditions.push('v.PageNo = ?');
      parameters.push(searchQuery);
    } else if (searchType === 6) { // Main letters
      columns += ' LEFT JOIN tokenized_mainletters t ON t.verseid = v.ID';
      const words = searchQuery.split(' ').join('%');
      conditions.push('t.token LIKE BINARY ?');
      parameters.push(`${words}%`);
      groupBy = 'GROUP BY v.ID';
    }
  }

  if (writer > 0) {
    conditions.push('v.WriterID = ?');
    parameters.push(writer);
  }

  if (raag > 0) {
    conditions.push('v.RaagID = ?');
    parameters.push(raag);
  }

  if (ang > 0) {
    conditions.push('v.PageNo = ?');
    parameters.push(ang);
  }

  const q = `SELECT ${columns}
    WHERE ${conditions.join(' AND ')}
    ${groupBy}
    ORDER BY ${orderBy} ShabadID ASC`;
  const prepQ = format(q, parameters);
  query(
    `SELECT COUNT(*) FROM (${prepQ}) AS count`,
    [],
    (err, row) => {
      if (err) {
        error(err, res);
      } else {
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
            totalPages
          }
        };
        if (totalResults > 0) {
          if (page < totalPages) {
            req.query.page = page + 1;
            resultsInfo.pages.nextPage = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}?${Object.keys(req.query).map(key => `${key}=${encodeURIComponent(req.query[key])}`).join('&')}`;
          }
          query(
            `${prepQ} LIMIT ?, ?`,
            [(page - 1) * results, results],
            (err1, rows) => {
              if (err1) {
                error(err1, res);
              } else {
                const verses = rows.map(verse => prepVerse(verse, true));
                resultsInfo.pageResults = verses.length;
                res.json({
                  resultsInfo,
                  verses
                });
              }
            }
          );
        } else {
          res.json({
            resultsInfo,
            verses: []
          });
        }
      }
    }
  );
};

exports.shabads = (req, res) => {
  const ShabadID = parseInt(req.params.ShabadID, 10);
  if (!Number.isNaN(ShabadID)) {
    getShabad(ShabadID)
      .then((rows) => {
        res.json(rows);
      })
      .catch(err => error(err, res));
  }
};

exports.angs = (req, res) => {
  let PageNo = parseInt(req.params.PageNo, 10);
  if (PageNo < 1) {
    PageNo = 1;
  }
  let { SourceID } = req.params;
  // Check if SourceID is supported or default to 'G'
  if (!sources[SourceID]) {
    SourceID = 'G';
  }
  // If SGGS, check if within 1430
  if (SourceID === 'G' && PageNo > 1430) {
    PageNo = 1430;
  }
  const q = `SELECT ${allColumns}
  WHERE
    v.PageNo = ?
    AND v.SourceID = ?
    ${allColumnsWhere}
  ORDER BY v.LineNo ASC, ShabadID ASC, v.ID ASC`;
  query(
    q,
    [PageNo, SourceID],
    (err, rows) => {
      if (rows.length > 0) {
        const source = getSource(rows[0]);
        const count = rows.length;
        const page = rows.map((row) => {
          const rowData = prepVerse(row);
          rowData.writer = getWriter(row);
          rowData.raag = getRaag(row);
          return rowData;
        });
        const q1 = `(SELECT 'previous' as navigation, PageNo FROM Verse WHERE PageNo = ? AND SourceID = ? LIMIT 1)
            UNION
          (SELECT 'next' as navigation, PageNo FROM Verse WHERE PageNo= ? AND SourceID = ? LIMIT 1);`;
        query(
          q1,
          [PageNo - 1, SourceID, PageNo + 1, SourceID],
          (err1, rows1) => {
            if (err) {
              error(err1);
            } else {
              let previous = null;
              let next = null;
              rows1.forEach((row) => {
                if (row.navigation === 'previous') {
                  previous = row.PageNo;
                }
                if (row.navigation === 'next') {
                  next = row.PageNo;
                }
              });
              const navigation = {
                previous,
                next,
              };
              res.json({
                source,
                count,
                navigation,
                page,
              });
            }
          }
        );
      }
    }
  );
};

exports.hukamnamas = (req, res) => {
  let q;
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
      q = 'SELECT ID as hukamDate, ShabadID FROM Hukam WHERE ID = ?';
      args.push(`${year}-${month}-${day}`);
    } else {
      error({
        error: 'badDate',
        errorDescription: 'Please specify a valid date. Archives go back to 2002-01-01',
      }, res);
      exit = true;
    }
  }
  if (!q) {
    q = 'SELECT ID as hukamDate, ShabadID FROM Hukam ORDER BY ID DESC LIMIT 1';
  }
  if (!exit) {
    query(
      q,
      args,
      (err, row) => {
        if (row.length > 0) {
          const { hukamDate, ShabadID } = row[0];
          getShabad(ShabadID)
            .then((rows) => {
              const hukamGregorianDate = new Date(hukamDate);
              const date = {
                gregorian: {
                  month: hukamGregorianDate.getMonth(),
                  date: hukamGregorianDate.getDate(),
                  year: hukamGregorianDate.getFullYear(),
                },
              };
              const output = Object.assign({ date }, rows);

              res.json(output);
            });
        } else {
          error({
            error: 'noHukam',
            errorDescription: 'Hukamnama is missing for that date',
          }, res);
        }
      }
    );
  }
};

exports.random = (req, res) => {
  let { SourceID } = req.params;
  // Check if SourceID is supported or default to 'G'
  if (!sources[SourceID]) {
    SourceID = 'G';
  }
  const q = 'SELECT DISTINCT s.ShabadID, v.PageNo FROM Shabad s JOIN Verse v ON s.VerseID = v.ID WHERE v.SourceID = ? ORDER BY RAND() LIMIT 1';
  query(
    q,
    [SourceID],
    (err, row) => {
      const { ShabadID } = row[0];
      getShabad(ShabadID)
        .then((rows) => {
          res.json(rows);
        });
    }
  );
};

function getShabad(ShabadIDQ) {
  return new Promise((resolve, reject) => {
    const q = `SELECT ${allColumns} WHERE s.ShabadID = ? ${allColumnsWhere} ORDER BY v.ID ASC`;
    query(
      q,
      [ShabadIDQ],
      (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows.length > 0) {
          const shabadInfo = {
            shabadId: rows[0].ShabadID,
            pageNo: rows[0].PageNo,
            source: getSource(rows[0]),
            raag: getRaag(rows[0]),
            writer: getWriter(rows[0]),
          };

          const verses = rows.map(prepVerse);
          const q1 = `(SELECT 'previous' as navigation,ShabadID FROM Shabad WHERE VerseID = ? LIMIT 1)
              UNION
            (SELECT 'next' as navigation,ShabadID FROM Shabad WHERE VerseID= ? LIMIT 1);`;
          query(
            q1,
            [rows[0].ID - 1, rows[rows.length - 1].ID + 1],
            (err1, rows1) => {
              let previous = null;
              let next = null;
              rows1.forEach((row) => {
                if (row.navigation === 'previous') {
                  previous = row.ShabadID;
                }
                if (row.navigation === 'next') {
                  next = row.ShabadID;
                }
              });
              const navigation = {
                previous,
                next,
              };

              resolve({
                shabadInfo,
                count: verses.length,
                navigation,
                verses,
              });
            }
          );
        }
      }
    );
  });
}
