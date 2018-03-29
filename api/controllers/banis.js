const allColumns = `v.ID, b.Gurmukhi AS NameGurmukhi,
  b.GurmukhiUni AS NameGurmukhiUni, b.Transliteration AS NameTransliteration,
  v.Gurmukhi, v.GurmukhiUni, v.English, v.Punjabi,
  v.PunjabiUni, v.Spanish, v.PageNo AS PageNo, v.LineNo,
  v.SourceID, v.Bisram, v.igurbani_bisram1, v.igurbani_bisram2,
  v.Transliteration, v.WriterID, w.WriterEnglish,
  w.WriterGurmukhi, w.WriterUnicode, v.RaagID, r.RaagGurmukhi,
  r.RaagUnicode, r.RaagEnglish, r.RaagWithPage, src.SourceGurmukhi,
  src.SourceUnicode, src.SourceEnglish, v.header, v.MangalPosition,
  v.existsStandard, v.existsTaksal, v.existsBuddhaDal, v.Paragraph,
  v.Updated
FROM mv_Banis_Shabad v
LEFT JOIN Banis b ON b.ID=v.Bani
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

exports.all = (req, res) => {};

exports.bani = (req, res) => {};
