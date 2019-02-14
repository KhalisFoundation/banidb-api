const prepVerse = (row, includeMeta = false) => {
  const verse = {
    verseId: row.ID,
    verse: {
      gurmukhi: row.Gurmukhi,
      unicode: row.GurmukhiUni,
    },
    larivaar: {
      gurmukhi: row.Gurmukhi.replace(/\s+/g, ''),
      unicode: row.GurmukhiUni.replace(/\s+/g, ''),
    },
    translation: {
      english: {
        ssk: row.English,
      },
      punjabi: {
        bms: {
          gurmukhi: row.Punjabi,
          unicode: row.PunjabiUni,
        },
      },
      spanish: row.Spanish,
    },
    transliteration: {
      english: row.Transliteration,
    },
    shabadId: row.ShabadID,
    pageNo: row.PageNo,
    lineNo: row.LineNo,
    updated: row.Updated,
    bisram: {
      sttm: row.Bisram,
      igurbani1: row.igurbani_bisram1,
      igurbani2: row.igurbani_bisram2,
    },
  };
  if (includeMeta) {
    verse.writer = getWriter(row);
    verse.source = getSource(row);
    verse.raag = getRaag(row);
  }
  return verse;
};

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

module.exports = {
  prepVerse,
  getSource,
  getRaag,
  getWriter,
};
