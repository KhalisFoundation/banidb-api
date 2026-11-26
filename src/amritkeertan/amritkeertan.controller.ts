import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { prepAKIndex, prepVerse } from '../banidb/mappers';
import { ApiError } from '../common/api-error';
import { int, parseDateTime } from '../common/input';
import { Limit100 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';
import { Docs, IdParam, ServerError, UpdatedSince } from '../docs/decorators';

const SHABAD_COLUMNS = `
aki.IndexID,
aki.HeaderID,
aki.ShabadID,
v.VerseID,
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
v.Updated
FROM mv_AK_Shabad v
LEFT JOIN AKIndex aki USING(IndexID)
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

const INDEX_COLUMNS = `
b.IndexID,
b.HeaderID,
b.ShabadID,
b.Page as PageNo,
v.Gurmukhi,
v.Visraam,
v.GurmukhiUni,
v.Translations,
v.PageNo AS Ang,
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
v.Updated
FROM AKIndex b
LEFT JOIN Verse v ON b.VerseID=v.ID
LEFT JOIN Writer w USING(WriterID)
LEFT JOIN Raag r USING(RaagID)
LEFT JOIN Source src USING(SourceID)`;

const HEADER_COLUMNS = 'HeaderID, Gurmukhi, GurmukhiUni, Translations, Transliterations, Updated';

// Amrit Keertan (the kirtan pothi): headers (sections), the index of shabads
// under them, and each shabad.
@ApiTags('Amrit Keertan')
@ServerError()
@Controller('amritkeertan')
export class AmritKeertanController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  @Limit100()
  @Docs('The sections (headers)', 'AmritKeertanHeaders')
  async headers() {
    const rows = await this.db.query(
      `SELECT ${HEADER_COLUMNS} FROM AKHeaders ORDER BY HeaderID ASC`,
    );
    return { headers: rows.map(prepAKIndex) };
  }

  @Get('index')
  @Limit100()
  @Docs('Every shabad in the pothi, by section', 'AmritKeertanIndex')
  @UpdatedSince()
  index(@Query('updatedsince') updatedsince: unknown) {
    return this.indexOf(undefined, updatedsince);
  }

  // With a header: { header: [that header], index }.
  @Get('index/:HeaderID')
  @Limit100()
  @Docs('The shabads of a section, with the section', 'AmritKeertanIndex')
  @IdParam('HeaderID', 'A section (header) ID.', 7)
  @UpdatedSince()
  async indexOf(
    @Param('HeaderID') headerId: string | undefined,
    @Query('updatedsince') updatedsince: unknown,
  ) {
    const out: Record<string, unknown> = {};
    const parameters: unknown[] = [];
    let header = '';
    if (headerId) {
      const id = int(headerId);
      // Not a number: no such header, so nothing under it.
      if (Number.isNaN(id)) return { header: [], index: [] };
      header = 'AND b.headerID = ?';
      parameters.push(id);
      out.header = await this.header(id);
    }
    const sinceDate = updatedsince ? parseDateTime(updatedsince) : null;
    let sinceQuery = '';
    if (sinceDate) {
      sinceQuery = 'AND v.Updated > ?';
      parameters.push(sinceDate);
    }
    const rows = await this.db.query(
      `SELECT ${INDEX_COLUMNS} WHERE 1 ${header} ${sinceQuery} ORDER BY IndexID ASC`,
      parameters,
    );
    out.index = rows.map(prepAKIndex);
    return out;
  }

  @Get('shabads/:ShabadID')
  @Limit100()
  @Docs('A shabad of the pothi, with its section', 'AmritKeertanShabad', {
    404: 'No such shabad, or nothing changed since `updatedsince`.',
  })
  @IdParam('ShabadID', 'An index ID (`IndexID` in the index).', 147)
  @UpdatedSince()
  async shabad(@Param('ShabadID') shabadId: string, @Query('updatedsince') updatedsince: unknown) {
    const id = int(shabadId);
    if (Number.isNaN(id)) throw new ApiError('Shabad does not exist or has no updates.', 404);
    const parameters: unknown[] = [id];
    const sinceDate = updatedsince ? parseDateTime(updatedsince) : null;
    let sinceQuery = '';
    if (sinceDate) {
      sinceQuery = 'AND v.Updated > ?';
      parameters.push(sinceDate);
    }
    const rows = await this.db.query(
      `SELECT ${SHABAD_COLUMNS} WHERE v.IndexID = ? ${sinceQuery}`,
      parameters,
    );
    if (rows.length === 0) throw new ApiError('Shabad does not exist or has no updates.', 404);
    return {
      header: await this.header(rows[0].HeaderID),
      verses: rows.map((row) => prepVerse(row)),
    };
  }

  private async header(id: unknown) {
    const rows = await this.db.query(
      `SELECT ${HEADER_COLUMNS} FROM AKHeaders WHERE HeaderID = ? ORDER BY HeaderID ASC`,
      [id],
    );
    return rows.map(prepAKIndex);
  }
}
