import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiError } from '../common/api-error';
import { CacheFor, NoCache } from '../common/cache-control';
import { int, isListOfNumbers, parseDateTime } from '../common/input';
import { Limit100, Limit250 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';
import { SearchService } from './search.service';
import { isSource, VersesService } from './verses.service';

const sinceDateOf = (updatedsince: unknown) => (updatedsince ? parseDateTime(updatedsince) : null);

@Controller()
export class ShabadsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly verses: VersesService,
    private readonly searcher: SearchService,
  ) {}

  @Get('search/:query')
  @Limit250()
  search(@Req() req: Request, @Param('query') query: string) {
    return this.searcher.search(req, query);
  }

  @Get('search-results/:VerseIds')
  @Limit250()
  searchResults(
    @Req() req: Request,
    @Param('VerseIds') verseIds: string,
    @Query('page') page: unknown,
  ) {
    if (!isListOfNumbers(verseIds)) {
      throw new ApiError('Malformed URL. Please check the VerseID list and try again.', 400);
    }
    return this.verses.byIds(req, verseIds.split(','), Math.max(int(page) || 1, 1), 0);
  }

  @Get('shabads/:ShabadID')
  @Limit100()
  async shabads(@Param('ShabadID') shabadId: string, @Query('updatedsince') updatedsince: unknown) {
    if (!isListOfNumbers(shabadId)) throw new ApiError('Malformed URL', 400);
    const shabad = await this.verses.getShabad(shabadId.split(/[,+]/g), sinceDateOf(updatedsince));
    if (Object.keys(shabad).length === 0) {
      throw new ApiError('Shabad does not exist or no updates found for specified Shabad.', 404);
    }
    return shabad;
  }

  @Get('angs/:PageNo')
  @Limit100()
  ang(@Param('PageNo') pageNo: string, @Query('updatedsince') updatedsince: unknown) {
    return this.angOfSource(pageNo, undefined, updatedsince);
  }

  @Get('angs/:PageNo/:SourceID')
  @Limit100()
  async angOfSource(
    @Param('PageNo') pageNo: string,
    @Param('SourceID') sourceId: string | undefined,
    @Query('updatedsince') updatedsince: unknown,
  ) {
    const angs = await this.verses.getAngs({
      pageNo,
      sourceID: sourceId,
      sinceDate: sinceDateOf(updatedsince),
    });
    if (!angs) throw new ApiError('That ang does not exist or no updates found.', 404);
    return angs;
  }

  @Get('hukamnamas')
  @Limit100()
  @CacheFor(1800)
  latestHukamnama() {
    return this.hukamnama();
  }

  // Only a full date picks a day; /hukamnamas/:year and /:year/:month are the latest.
  @Get('hukamnamas/:year')
  @Limit100()
  @CacheFor(1800)
  hukamnamaOfYear() {
    return this.hukamnama();
  }

  @Get('hukamnamas/:year/:month')
  @Limit100()
  @CacheFor(1800)
  hukamnamaOfMonth() {
    return this.hukamnama();
  }

  @Get('hukamnamas/:year/:month/:day')
  @Limit100()
  @CacheFor(1800)
  hukamnamaOfDay(
    @Param('year') year: string,
    @Param('month') month: string,
    @Param('day') day: string,
  ) {
    return this.hukamnama(int(year), int(month), int(day));
  }

  @Get('random')
  @Limit100()
  @NoCache()
  random() {
    return this.randomOf(undefined);
  }

  @Get('random/:SourceID')
  @Limit100()
  @NoCache()
  async randomOf(@Param('SourceID') sourceId: string | undefined) {
    const source = isSource(sourceId) ? sourceId : 'G';
    const where = source === 'all' ? '' : 'WHERE v.SourceID = ?';
    const [row] = await this.db.query(
      `SELECT DISTINCT s.ShabadID, v.PageNo FROM Shabad s JOIN Verse v ON s.VerseID = v.ID ${where} ORDER BY RAND() LIMIT 1`,
      source === 'all' ? [] : [source],
    );
    if (!row) throw new Error(`No shabad in source ${source}`);
    return this.verses.getShabad([row.ShabadID as number]);
  }

  private async hukamnama(year?: number, month?: number, day?: number) {
    const output: Record<string, unknown> = {};
    let q = 'SELECT ID as hukamDate, ShabadID FROM Hukamnama ORDER BY ID DESC LIMIT 1';
    const args: string[] = [];
    if (year !== undefined && month !== undefined && day !== undefined) {
      const date = new Date(year, month - 1, day);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (!(
        date.getTime() >= new Date(2002, 0, 1).getTime() && date.getTime() <= tomorrow.getTime()
      )) {
        throw new ApiError('Please specify a valid date. Archives go back to 2002-01-01', 404);
      }
      // A day the month doesn't have (31 February): MariaDB found nothing for
      // it, MySQL fails the query.
      if (date.getMonth() !== month - 1 || date.getDate() !== day) {
        throw new ApiError('Hukamnama is missing for that date', 404);
      }
      q = 'SELECT ID as hukamDate, ShabadID FROM Hukamnama WHERE ID = ?';
      args.push(`${year}-${month}-${day}`);
    } else {
      output.isLatest = true;
    }

    const [row] = await this.db.query<{ hukamDate: string; ShabadID: string }>(q, args);
    if (!row) throw new ApiError('Hukamnama is missing for that date', 404);

    const shabadIds = JSON.parse(row.ShabadID) as number[];
    const shabads = (await this.verses.getShabad(shabadIds, null, true)) as { shabads?: unknown };
    const hukamDate = new Date(row.hukamDate);
    output.date = {
      gregorian: {
        month: hukamDate.getMonth() + 1,
        date: hukamDate.getDate(),
        year: hukamDate.getFullYear(),
      },
    };
    output.shabadIds = shabadIds;
    output.shabads = shabads.shabads ? shabads.shabads : shabads;
    return output;
  }
}
