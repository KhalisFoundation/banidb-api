import getObject from 'lodash/get';

// ceremonies and perhaps future features have ranges, meaning
// translations and translit objects are now arrays of the
// original verse structures passed as one verse
// we now need to reduce them to look like a normal line for processing
const reduceObj = (accumulator: any, currentObj: any) => {
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
const concatObjects = (array: any) => {
  return array.reduce((accumulator: any, current: any) => reduceObj(accumulator, current), {});
};

// reduce visraam array of objects with arrays to just objects with arrays
/* eslint-disable no-param-reassign */
const reduceVisraams = (visraam: any, wordCount: any) => {
  let totalWordCount = 0;
  const accumulator: any = {};
  visraam.forEach((line: any, i: number) => {
    Object.keys(line).forEach(vtype => {
      if (!accumulator[vtype]) {
        accumulator[vtype] = [];
      }
      line[vtype].forEach((v: any) => {
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
/* eslint-enable no-param-reassign */

const prepVerse = (row: any, includeMeta = false, liveSearch = 0) => {
  let translations = JSON.parse(row.Translations);
  if (Array.isArray(translations)) {
    translations = concatObjects(translations);
  }
  const verse: any = {
    verseId: row.ID,
    shabadId: row.ShabadID,
    verse: {
      gurmukhi: row.Gurmukhi,
      unicode: row.GurmukhiUni,
    },
    larivaar: {
      gurmukhi: (row.Gurmukhi || '').toString().replace(/\s+/g, ''),
      unicode: (row.GurmukhiUni || '').toString().replace(/\s+/g, ''),
    },
    translation: {
      en: {
        ...translations.en,
      },
      pu: {
        ss: {
          gurmukhi: getObject(translations, 'pu.ss', ''),
          unicode: getObject(translations, 'puu.ss', ''),
        },
        ft: {
          gurmukhi: getObject(translations, 'pu.ft', ''),
          unicode: getObject(translations, 'puu.ft', ''),
        },
      },
      es: {
        ...translations.es,
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
    verse.visraam = JSON.parse(row.Visraam);
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

const getShabadInfo = (shabad: any) => ({
  shabadId: shabad.ShabadID,
  shabadName: shabad.ShabadName,
  pageNo: shabad.PageNo,
  source: getSource(shabad),
  raag: getRaag(shabad),
  writer: getWriter(shabad),
});

const getSource = (shabad: any) => ({
  sourceId: shabad.SourceID,
  gurmukhi: shabad.SourceGurmukhi,
  unicode: shabad.SourceUnicode,
  english: shabad.SourceEnglish,
  pageNo: shabad.PageNo,
});

const getRaag = (shabad: any) => ({
  raagId: shabad.RaagID,
  gurmukhi: shabad.RaagGurmukhi,
  unicode: shabad.RaagUnicode,
  english: shabad.RaagEnglish,
  startAng: shabad.StartID,
  endAng: shabad.EndID,
  raagWithPage: shabad.RaagWithPage,
});

const getWriter = (shabad: any) => ({
  writerId: shabad.WriterID,
  gurmukhi: shabad.WriterGurmukhi,
  unicode: shabad.WriterUnicode,
  english: shabad.WriterEnglish,
});

const prepBanis = (row: any) => {
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

const prepAKIndex = (row: any) => {
  const akIndexRow = row;
  akIndexRow.Transliterations = JSON.parse(row.Transliterations);
  akIndexRow.Translations = JSON.parse(row.Translations);
  return akIndexRow;
};

export default {
  prepVerse,
  prepBanis,
  prepAKIndex,
  getShabadInfo,
  getSource,
  getRaag,
  getWriter,
};