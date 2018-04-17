function prepVerse(row) {
  return {
    verseId: row.ID,
    verse: {
      gurmukhi: row.Gurmukhi,
      unicode: row.GurmukhiUni,
    },
    larivaar: {
      gurmukhi: row.Gurmukhi.replace(/\s+/, ''),
      unicode: row.GurmukhiUni.replace(/\s+/, ''),
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
    firstLetters: {
      ascii: row.FirstLetterStr,
      english: row.FirstLetterEng,
    },
    bisram: {
      sttm: row.Bisram,
      igurbani1: row.igurbani_bisram1,
      igurbani2: row.igurbani_bisram2,
    },
  };
}

function getSource(shabad) {
  return {
    sourceId: shabad.SourceID,
    gurmukhi: shabad.SourceGurmukhi,
    unicode: shabad.SourceUnicode,
    english: shabad.SourceEnglish,
    pageNo: shabad.PageNo,
  };
}

function getRaag(shabad) {
  return {
    raagId: shabad.RaagID,
    gurmukhi: shabad.RaagGurmukhi,
    unicode: shabad.RaagUnicode,
    english: shabad.RaagEnglish,
    startAng: shabad.StartID,
    endAng: shabad.EndID,
    raagWithPage: shabad.RaagWithPage,
  };
}

function getWriter(shabad) {
  return {
    writerId: shabad.WriterID,
    gurmukhi: shabad.WriterGurmukhi,
    unicode: shabad.WriterUnicode,
    english: shabad.WriterEnglish,
  };
}

module.exports = {
  prepVerse,
  getSource,
  getRaag,
  getWriter,
};
