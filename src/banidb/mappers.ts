// BaniDB row → JSON mappers, ported from api/lib/getJSON.js. Output must match
// the old API exactly, key order included. Unlike there, an empty or broken
// JSON column doesn't fail the whole response: it maps as empty.

import { Logger } from '@nestjs/common';

type Row = Record<string, any>;
type Obj = Record<string, any>;

const logger = new Logger('Data');

// A JSON column's value, or `fallback` when it isn't valid JSON (logged).
// Like JSON.parse, SQL NULL gives null.
function parseJson(text: unknown, fallback: unknown, where: string): any {
  if (text === null) return null;
  try {
    return JSON.parse(text as string);
  } catch {
    logger.warn(
      `Not valid JSON in ${where}: ${typeof text === 'string' ? text.slice(0, 100) : typeof text}`,
    );
    return fallback;
  }
}

// Ceremonies and similar ranges store several lines as one verse: their
// translation and transliteration objects are arrays of per-line objects.
// Merge them into one line's shape, joining strings with a space.
function reduceObj(accumulator: Obj, current: Obj): Obj {
  const merged: Obj = { ...accumulator };
  Object.entries(current).forEach(([key, value]) => {
    const accumulated = accumulator[key];
    if (!accumulated) {
      merged[key] = value;
    } else if (typeof accumulated === 'object') {
      merged[key] = reduceObj(accumulated as Obj, value as Obj);
    } else if (typeof accumulated === 'string') {
      merged[key] += ` ${value}`;
    }
  });
  return merged;
}

const concatObjects = (array: Obj[]) => array.reduce<Obj>(reduceObj, {});

// Per-line visraam arrays → one object of arrays, word positions offset by the
// words in the lines before.
function reduceVisraams(visraam: Obj[], wordCount: number[]): Record<string, Obj[]> {
  let totalWordCount = 0;
  const accumulator: Record<string, Obj[]> = {};
  visraam.forEach((line, i) => {
    Object.keys(line).forEach((type) => {
      accumulator[type] ??= [];
      (line[type] as Obj[]).forEach((v) => {
        if (i > 0) v.p = Number.parseInt(String(v.p), 10) + totalWordCount;
        accumulator[type].push(v);
      });
    });
    totalWordCount += wordCount[i];
  });
  return accumulator;
}

// The API's Punjabi translations pair each source's gurmukhi (pu) and unicode (puu).
function reducePuTranslations(pu: unknown, puu: Obj | undefined) {
  const accumulator: Record<string, { gurmukhi: unknown; unicode: unknown }> = {};
  if (pu && typeof pu === 'object') {
    Object.keys(pu).forEach((key) => {
      accumulator[key] = { gurmukhi: (pu as Obj)[key], unicode: puu?.[key] };
    });
  }
  return accumulator;
}

// A translations or transliterations column: an object, or an array of
// per-line objects merged into one; {} when empty or broken.
function lineObject(text: unknown, where: string): Obj {
  const value = parseJson(text, {}, where) as Obj | Obj[] | null;
  if (Array.isArray(value)) return concatObjects(value);
  return value && typeof value === 'object' ? value : {};
}

export const getSource = (row: Row) => ({
  sourceId: row.SourceID,
  gurmukhi: row.SourceGurmukhi,
  unicode: row.SourceUnicode,
  english: row.SourceEnglish,
  pageNo: row.PageNo,
});

export const getRaag = (row: Row) => ({
  raagId: row.RaagID,
  gurmukhi: row.RaagGurmukhi,
  unicode: row.RaagUnicode,
  english: row.RaagEnglish,
  raagWithPage: row.RaagWithPage,
});

const writerOf = (row: Row) => ({
  writerId: row.WriterID,
  gurmukhi: row.WriterGurmukhi,
  unicode: row.WriterUnicode,
  english: row.WriterEnglish,
});

// The row's writer, else the first line of the shabad that has one.
export function getWriter(row: Row | undefined, fullShabad?: Row[]) {
  if (row?.WriterID) return writerOf(row);
  const withWriter = fullShabad?.find((line) => !!line.WriterID);
  if (withWriter) return writerOf(withWriter);
  return { writerId: null, gurmukhi: null, unicode: null, english: null };
}

// `includeMeta` adds writer, source and raag (search results); `liveSearch`
// (search-as-you-type) leaves out everything but the line and its translations.
export function prepVerse(row: Row, includeMeta = false, liveSearch: number = 0) {
  const where = `verse ${row.ID}`;
  const translations = lineObject(row.Translations, where);
  const verse: Obj = {
    verseId: row.ID,
    shabadId: row.ShabadID,
    verse: { gurmukhi: row.Gurmukhi, unicode: row.GurmukhiUni },
    larivaar: {
      gurmukhi: String(row.Gurmukhi).replace(/\s+/g, ''),
      unicode: String(row.GurmukhiUni).replace(/\s+/g, ''),
    },
    translation: {
      en: { ...translations.en },
      pu: reducePuTranslations(translations.pu, translations.puu),
      es: { ...translations.es },
      hi: { ...translations.hi },
    },
  };

  if (liveSearch !== 1) {
    const transliterations = lineObject(row.Transliterations, where);
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
    } catch {
      verse.visraam = [];
    }
    if (Array.isArray(verse.visraam)) {
      const wordCount = parseJson(row.WordCount || '[0]', [0], where) as number[] | null;
      verse.visraam = reduceVisraams(verse.visraam as Obj[], wordCount ?? [0]);
    }
  }

  if (includeMeta && !liveSearch) {
    verse.writer = getWriter(row);
    verse.source = getSource(row);
    verse.raag = getRaag(row);
  }
  return verse;
}

export const getShabadInfo = (row: Row, fullShabad: Row[]) => ({
  shabadId: row.ShabadID,
  shabadName: row.ShabadName,
  pageNo: row.PageNo,
  source: getSource(row),
  raag: getRaag(row),
  writer: getWriter(row, fullShabad),
});

// /raags: the JSON columns, parsed.
export function getRaagExtended(row: Row) {
  for (const column of ['SourceInfo', 'Sargun', 'WritersGuru', 'WritersBhagat', 'Writers']) {
    row[column] = parseJson(String(row[column]), null, `raag ${row.RaagID} ${column}`);
  }
  return row;
}

// A bani in the list.
export function prepBanis(row: Row) {
  const transliterations = lineObject(row.transliterations, `bani ${row.ID}`);
  return {
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
}

// An Amrit Keertan header or index row, with its JSON columns parsed.
export function prepAKIndex(row: Row) {
  const where = `Amrit Keertan ${row.IndexID ?? row.HeaderID}`;
  row.Transliterations = parseJson(row.Transliterations, null, where);
  row.Translations = parseJson(row.Translations, null, where);
  return row;
}
