import { Injectable } from '@nestjs/common';
import { getRaag, getSource, getWriter, prepBanis, prepVerse } from '../banidb/mappers';
import { DatabaseService, type Row } from '../database/database.service';

// Which version of a bani (?length=): SGPC, medium, Taksal, Buddha Dal.
const LENGTH_COLUMNS: Record<string, string> = {
  s: 'existsSGPC',
  m: 'existsMedium',
  t: 'existsTaksal',
  b: 'existsBuddhaDal',
};

const BANI_COLUMNS = `
b.Gurmukhi AS NameGurmukhi,
b.GurmukhiUni AS NameGurmukhiUni,
b.Transliterations AS NameTransliterations,
v.ID,
v.Gurmukhi,
v.Visraam,
v.GurmukhiUni,
v.Translations,
v.PageNo AS PageNo,
v.LineNo,
v.SourceID,
v.Transliterations,
v.WriterID,
w.WriterEnglish,
w.WriterGurmukhi,
w.WriterUnicode,
v.RaagID,
r.RaagGurmukhi,
r.RaagUnicode,
r.RaagEnglish,
r.RaagWithPage,
src.SourceGurmukhi,
src.SourceUnicode,
src.SourceEnglish,
v.header,
v.MangalPosition,
v.existsSGPC,
v.existsMedium,
v.existsTaksal,
v.existsBuddhaDal,
v.Paragraph,
v.Updated
FROM mv_Banis_Shabad v
LEFT JOIN Banis b ON b.ID=v.Bani
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

@Injectable()
export class BanisService {
  constructor(private readonly db: DatabaseService) {}

  // Banis from 1000 up aren't published.
  async all() {
    const rows = await this.db.query(
      'SELECT ID, Token as token, Gurmukhi as gurmukhi, GurmukhiUni as gurmukhiUni, Transliterations as transliterations, Updated as updated FROM Banis WHERE ID < 1000 ORDER BY ID ASC',
    );
    return rows.map(prepBanis);
  }

  // { baniInfo, verses }, or null when the bani doesn't exist (or nothing
  // changed since `sinceDate`). With a `length`, only that version's lines,
  // without the exists* flags.
  async bani(id: number | string, length: unknown, sinceDate: string | null) {
    const exists =
      typeof length === 'string' && Object.hasOwn(LENGTH_COLUMNS, length)
        ? LENGTH_COLUMNS[length]
        : null;
    const parameters: unknown[] = [id];
    let sinceQuery = '';
    if (sinceDate) {
      sinceQuery = 'AND v.Updated > ?';
      parameters.push(sinceDate);
    }
    const existsQuery = exists ? `AND v.${exists} = 1` : '';
    const rows = await this.db.query(
      `SELECT ${BANI_COLUMNS} WHERE v.Bani = ? ${sinceQuery} ${existsQuery} ORDER BY Seq ASC`,
      parameters,
    );
    if (rows.length === 0) return null;

    const first = rows[0];
    let names: Row = {};
    try {
      names = (JSON.parse(first.NameTransliterations as string) as Row | null) ?? {};
    } catch {
      // shown without its transliterations
    }
    return {
      baniInfo: {
        baniID: id,
        gurmukhi: first.NameGurmukhi,
        unicode: first.NameGurmukhiUni,
        english: names.en,
        hindi: names.hi,
        en: names.en,
        hi: names.hi,
        ipa: names.ipa,
        ur: names.ur,
        source: getSource(first),
        raag: getRaag(first),
        writer: getWriter(first),
      },
      verses: rows.map((row) => ({
        header: row.header,
        mangalPosition: row.MangalPosition,
        ...(exists
          ? {}
          : {
              existsSGPC: row.existsSGPC,
              existsMedium: row.existsMedium,
              existsTaksal: row.existsTaksal,
              existsBuddhaDal: row.existsBuddhaDal,
            }),
        paragraph: row.Paragraph,
        verse: prepVerse(row),
      })),
    };
  }
}
