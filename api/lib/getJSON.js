// ceremonies and perhaps future features have ranges, meaning
// translations and translit objects are now arrays of the
// original verse structures passed as one verse
// we now need to reduce them to look like a normal line for processing
const reduceObj = (accumulator, currentObj) => {
  const newAccumulator = Object.assign({}, accumulator);
  Object.entries(currentObj).forEach(([key, value]) => {
    const accumulatedVal = accumulator[key];
    if (!accumulatedVal) {
      newAccumulator[key] = value;
    } else if (typeof accumulatedVal === 'object') {
      newAccumulator[key] = reduceObj(accumulatedVal, value);
    } else if (typeof accumulatedVal === 'string') {
      newAccumulator[key] += ` ${value}`;
    }
  });
  return newAccumulator;
};

// wrapper func
const concatObjects = array => {
  return array.reduce((accumulator, current) => reduceObj(accumulator, current), {});
};

// reduce visraam array of objects with arrays to just objects with arrays
/* eslint-disable no-param-reassign */
const reduceVisraams = (visraam, wordCount) => {
  let totalWordCount = 0;
  const accumulator = {};
  visraam.forEach((line, i) => {
    Object.keys(line).forEach(vtype => {
      if (!accumulator[vtype]) {
        accumulator[vtype] = [];
      }
      line[vtype].forEach(v => {
        if (i > 0) {
          v.p = parseInt(v.p, 10) + totalWordCount;
        }
        accumulator[vtype].push(v);
      });
    });
    totalWordCount += wordCount[i];
  });
  return accumulator;
};

// this exists because the pu spec for v2 api looks different than data in db
const reducepuTranslations = (pu, puu) => {
  const accumulator = {};
  if (typeof pu === 'object') {
    Object.keys(pu).forEach(i => {
      accumulator[i] = {
        gurmukhi: pu[i],
        unicode: puu[i],
      };
    });
  }
  return accumulator;
};

/* eslint-enable no-param-reassign */
const prepVerse = (row, includeMeta = false, liveSearch = 0) => {
  let translations = JSON.parse(row.Translations);
  if (Array.isArray(translations)) {
    translations = concatObjects(translations);
  }
  const verse = {
    verseId: row.ID,
    shabadId: row.ShabadID,
    verse: {
      gurmukhi: row.Gurmukhi,
      unicode: row.GurmukhiUni,
    },
    larivaar: {
      gurmukhi: (String(row.Gurmukhi) || '').replace(/\s+/g, ''),
      unicode: (String(row.GurmukhiUni) || '').replace(/\s+/g, ''),
    },
    translation: {
      en: {
        ...translations.en,
      },
      pu: reducepuTranslations(translations.pu, translations.puu),
      es: {
        ...translations.es,
      },
      hi: {
        ...translations.hi,
      },
    },
  };

  if (liveSearch !== 1) {
    let transliterations = JSON.parse(row.Transliterations);
    if (Array.isArray(transliterations)) {
      transliterations = concatObjects(transliterations);
    }
    verse.transliteration = {
      english: transliterations.en,
      hindi: transliterations.hi,
      en: transliterations.en,
      hi: transliterations.hi,
      ipa: transliterations.ipa,
      ur: transliterations.ur,
    };
    verse.pageNo = row.PageNo;
    verse.lineNo = row.LineNo;
    verse.updated = row.Updated;
    try {
      verse.visraam = JSON.parse(row.Visraam);
    } catch (e) {
      verse.visraam = [];
    }
    if (Array.isArray(verse.visraam)) {
      const wordCount = JSON.parse(row.WordCount || '[0]');
      verse.visraam = reduceVisraams(verse.visraam, wordCount);
    }
  }

  if (includeMeta && !liveSearch) {
    verse.writer = getWriter(row);
    verse.source = getSource(row);
    verse.raag = getRaag(row);
  }
  return verse;
};

const getShabadInfo = (shabad, fullShabad) => ({
  shabadId: shabad.ShabadID,
  shabadName: shabad.ShabadName,
  pageNo: shabad.PageNo,
  source: getSource(shabad),
  raag: getRaag(shabad),
  writer: getWriter(shabad, fullShabad),
});

const getSource = shabad => ({
  sourceId: shabad.SourceID,
  gurmukhi: shabad.SourceGurmukhi,
  unicode: shabad.SourceUnicode,
  english: shabad.SourceEnglish,
  pageNo: shabad.PageNo,
});

/* eslint-disable no-param-reassign */
const getRaagExtended = shabad => {
  shabad.SourceInfo = JSON.parse(String(shabad.SourceInfo) || '');
  shabad.Sargun = JSON.parse(String(shabad.Sargun) || '');
  shabad.WritersGuru = JSON.parse(String(shabad.WritersGuru) || '');
  shabad.WritersBhagat = JSON.parse(String(shabad.WritersBhagat) || '');
  shabad.Writers = JSON.parse(String(shabad.Writers) || '');

  return shabad;
};
/* eslint-enable no-param-reassign */

const getRaag = shabad => ({
  raagId: shabad.RaagID,
  gurmukhi: shabad.RaagGurmukhi,
  unicode: shabad.RaagUnicode,
  english: shabad.RaagEnglish,
  raagWithPage: shabad.RaagWithPage,
});

const getWriter = (shabad, fullShabad) => {
  if (shabad && shabad.WriterID) {
    return {
      writerId: shabad.WriterID,
      gurmukhi: shabad.WriterGurmukhi,
      unicode: shabad.WriterUnicode,
      english: shabad.WriterEnglish,
    };
  }
  const writerInfoRow =
    fullShabad && fullShabad.length > 0 ? fullShabad.find(row => !!row.WriterID) : undefined;

  if (writerInfoRow) {
    return {
      writerId: writerInfoRow.WriterID,
      gurmukhi: writerInfoRow.WriterGurmukhi,
      unicode: writerInfoRow.WriterUnicode,
      english: writerInfoRow.WriterEnglish,
    };
  }

  return {
    writerId: null,
    gurmukhi: null,
    unicode: null,
    english: null,
  };
};

const prepBanis = row => {
  const transliterations = JSON.parse(row.transliterations);
  const banis = {
    ID: row.ID,
    token: row.token,
    gurmukhi: row.gurmukhi,
    gurmukhiUni: row.gurmukhiUni,
    transliteration: transliterations.en,
    transliterations: {
      english: transliterations.en,
      hindi: transliterations.hi,
      en: transliterations.en,
      hi: transliterations.hi,
      ipa: transliterations.ipa,
      ur: transliterations.ur,
    },
    updated: row.updated,
  };
  return banis;
};

const prepAKIndex = row => {
  const akIndexRow = row;
  akIndexRow.Transliterations = JSON.parse(row.Transliterations);
  akIndexRow.Translations = JSON.parse(row.Translations);
  return akIndexRow;
};

const prepResults = async (req, verseArray) => {
  try {
    const output = {
      resultsInfo: {
        totalResults: 0,
        pageResults: 0,
        pages: { page: 1, resultsPerPage: 20, totalPages: 0 },
      },
      verses: [],
    };

    if (verseArray.length === 0) {
      return output;
    }

    const resultsPerPage = 20;
    let page = 1;

    // Build query similar to resultsInfo in shabads.js
    const allColumns = `v.ID, v.Gurmukhi, v.GurmukhiUni, v.Translations, v.PageNo AS PageNo, v.LineNo,
          v.SourceID as SourceID, s.ShabadID, v.FirstLetterStr, v.MainLetters, v.Visraam,
          v.FirstLetterEng, v.Transliterations, v.WriterID, w.WriterEnglish,
          w.WriterGurmukhi, w.WriterUnicode, v.RaagID, r.RaagGurmukhi,
          r.RaagUnicode, r.RaagEnglish, r.RaagWithPage,
          src.SourceGurmukhi, src.SourceUnicode, src.SourceEnglish,
          GREATEST(s.Updated, v.Updated) AS Updated`;

    const allFrom = `FROM Verse v
        LEFT JOIN Shabad s ON s.VerseID = v.ID
        LEFT JOIN Writer w USING(WriterID)
        LEFT JOIN Raag r USING(RaagID)
        LEFT JOIN Source src USING(SourceID)`;

    const placeholders = verseArray.map(() => '?').join(',');
    const q = `SELECT ${allColumns} ${allFrom}
                 WHERE v.ID IN (${placeholders}) ORDER BY field(v.ID, ${placeholders})`;

    let conn;
    try {
      conn = await req.app.locals.pool.getConnection();
      const row = await conn.query(`SELECT COUNT(*) FROM (${q}) AS count`, [
        ...verseArray,
        ...verseArray,
      ]);
      const totalResults = row[0]['COUNT(*)'];
      const totalPages = Math.ceil(totalResults / resultsPerPage);
      if (page > totalPages) page = totalPages;

      const resultRows = await conn.query(`${q} LIMIT ?, ?`, [
        ...verseArray,
        ...verseArray,
        (page - 1) * resultsPerPage,
        resultsPerPage,
      ]);

      const verses = resultRows.map(verse => prepVerse(verse, true, false));

      return {
        resultsInfo: {
          totalResults,
          pageResults: verses.length,
          pages: { page, resultsPerPage, totalPages },
        },
        verses,
      };
    } finally {
      if (conn) conn.release();
    }
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

module.exports = {
  prepResults,
  prepVerse,
  prepBanis,
  prepAKIndex,
  getShabadInfo,
  getSource,
  getRaag,
  getRaagExtended,
  getWriter,
};
