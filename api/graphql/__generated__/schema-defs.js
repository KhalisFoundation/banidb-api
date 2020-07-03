/* eslint:disable */
// This file was automatically generated
const typeDefs = `
type baniInfo {
  baniID: ID!
  gurmukhi: String
  english: String
  hindi: String
  en: String
  hi: String
  ipa: String
  ur: String
  source: source
  raag: raag
  writer: writer
}

type baniVerse {
  header: Int
  mangalPosition: String
  existsSGPC: Int
  existsMedium: Int
  existsTaksal: Int
  existsBuddhaDal: Int
  paragraph: Int
  verse: Verse
}

type BaniObj {
  baniInfo: baniInfo
  verses: baniVerse
}

type Bani {
  ID: ID
  token: String
  gurmukhi: String
  gurmukhiUni: String
  transliteration: String
  transliterations: transliteration
  updated: String
}

type source {
  sourceId: String
  gurmukhi: String
  unicode: String
  english: String
  pageNo: Int
}

type raag {
  raagId: Int
  gurmukhi: String
  unicode: String
  english: String
  startAng: Int
  endAng: Int
  raagWithPage: String
}

type writer {
  writerId: Int
  gurmukhi: String
  unicode: String
  english: String
}

type transliteration {
  english: String
  hindi: String
  en: String
  hi: String
  ipa: String
  ur: String
}

type Query {
  shabad(id: ID!): Shabad
  banis: [Bani]
  bani(id: ID!, length: String, sinceData: String): BaniObj
}

type navigation {
  previous: Int
  next: Int
}

type shabadInfo {
  shabadId: ID
  shabadName: Int
  pageNo: Int
  source: source
  raag: raag
  writer: writer
}

type Shabad {
  shabadInfo: shabadInfo
  count: Int!
  navigation: navigation
  verses: [Verse]
}

type visraamObject {
  p: Int
  v: String
}

type visraam {
  sttm: [visraamObject]
  igurbani: [visraamObject]
  sttm2: [visraamObject]
}

type line {
  gurmukhi: String
  unicode: String
}

type enObj {
  bdb: String
}

type puObj {
  ss: line
  ft: line
}

type esObj {
  sn: String
}

type translations {
  en: enObj
  pu: puObj
  es: esObj
}
type Verse {
  verseId: ID
  shabadId: Int
  verse: line
  larivaar: line
  translation: translations
  transliteration: transliteration
  pageNo: Int
  lineNo: Int
  updated: String
  visraam: visraam
}

`;
module.exports = typeDefs;
/* eslint:enable */
