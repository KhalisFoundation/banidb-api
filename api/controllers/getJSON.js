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
  getSource,
  getRaag,
  getWriter,
};
