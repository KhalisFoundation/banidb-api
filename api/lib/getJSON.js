const prepVerse = (row, includeMeta = false, liveSearch = 0) => {
  const translations = JSON.parse(row.Translations);
  const verse = {
    verseId: row.ID,
    shabadId: row.ShabadID,
    verse: {
      gurmukhi: row.Gurmukhi,
      unicode: row.GurmukhiUni,
    },
    larivaar: {
      gurmukhi: row.Gurmukhi.replace(/\s+/g, ''),
      unicode: row.GurmukhiUni.replace(/\s+/g, ''),
    },
    translation: {
      en: {
        ...translations.en,
      },
      pu: {
        ss: {
          gurmukhi: translations.pu.ss,
          unicode: translations.puu.ss,
        },
      },
      es: {
        ...translations.es,
      },
    },
  };

  if (liveSearch !== 1) {
    const transliterations = JSON.parse(row.Transliterations);
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
  }

  if (includeMeta && !liveSearch) {
    verse.writer = getWriter(row);
    verse.source = getSource(row);
    verse.raag = getRaag(row);
  }
  return verse;
};

const getShabadInfo = shabad => ({
  shabadId: shabad.ShabadID,
  shabadName: shabad.ShabadName,
  pageNo: shabad.PageNo,
  source: getSource(shabad),
  raag: getRaag(shabad),
  writer: getWriter(shabad),
});

const getSource = shabad => ({
  sourceId: shabad.SourceID,
  gurmukhi: shabad.SourceGurmukhi,
  unicode: shabad.SourceUnicode,
  english: shabad.SourceEnglish,
  pageNo: shabad.PageNo,
});

const getRaag = shabad => ({
  raagId: shabad.RaagID,
  gurmukhi: shabad.RaagGurmukhi,
  unicode: shabad.RaagUnicode,
  english: shabad.RaagEnglish,
  startAng: shabad.StartID,
  endAng: shabad.EndID,
  raagWithPage: shabad.RaagWithPage,
});

const getWriter = shabad => ({
  writerId: shabad.WriterID,
  gurmukhi: shabad.WriterGurmukhi,
  unicode: shabad.WriterUnicode,
  english: shabad.WriterEnglish,
});

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

module.exports = {
  prepVerse,
  prepBanis,
  prepAKIndex,
  getShabadInfo,
  getSource,
  getRaag,
  getWriter,
};
