import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiError } from '../common/api-error';
import { CacheFor, NoCache } from '../common/cache-control';
import { int, isListOfNumbers, parseDateTime } from '../common/input';
import { Limit100, Limit250 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';
import { Docs, IdParam, ServerError, SOURCES, SourceParam, UpdatedSince } from '../docs/decorators';
import { SearchService } from './search.service';
import { isSource, VersesService } from './verses.service';

const sinceDateOf = (updatedsince: unknown) => (updatedsince ? parseDateTime(updatedsince) : null);

const SEARCH_TYPES = [
  'First letter of each word, from the start (Gurmukhi)',
  'First letter of each word, anywhere (Gurmukhi)',
  'Whole words (Gurmukhi)',
  'Whole words of the English translation',
  'Romanized Gurmukhi words (their first letters)',
  'Ang: the query is an Ang number',
  'Main letters, without vowel signs (Gurmukhi)',
  'Romanized first letters, anywhere',
  'Auto-detect: Gurmukhi or romanized first letters, words or translations; a number is an Ang',
];

const SEARCH_DESCRIPTION = `Gurmukhi queries can be Unicode or ASCII (Gurbani Akhar). Most search
types take operators: \`+\` (must have), \`-\` (must not have), \`*\` (anything) and quotes
(exactly). Results come 20 to a page (\`results\`), sorted by shabad.`;

const ANG = IdParam(
  'PageNo',
  'An Ang, or several: `1`, `2-3`, `4+6`, `2-3+7`. Not a number reads as 1; Guru Granth Sahib stops at 1430.',
);
const HUKAMNAMA_ERRORS = {
  404: 'The date is before 2002-01-01, after tomorrow or not a date, or has no hukamnama.',
};

@ApiTags('Shabads and search')
@ServerError()
@Controller()
export class ShabadsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly verses: VersesService,
    private readonly searcher: SearchService,
  ) {}

  @Get('search/:query')
  @Limit250()
  @Docs('Search', 'SearchResults', {}, SEARCH_DESCRIPTION)
  @IdParam('query', 'What to search for.', 'jmTAq')
  @ApiQuery({
    name: 'searchtype',
    required: false,
    description: SEARCH_TYPES.map((name, i) => `\`${i}\` ${name}`).join('; '),
    schema: { type: 'integer', minimum: 0, maximum: 8, default: 0 },
  })
  @ApiQuery({
    name: 'source',
    required: false,
    description: Object.entries(SOURCES)
      .map(([id, name]) => `\`${id}\` ${name}`)
      .join(', '),
    schema: { type: 'string', enum: Object.keys(SOURCES) },
  })
  @ApiQuery({
    name: 'writer',
    required: false,
    description: 'A writer ID (/v2/writers).',
    schema: { type: 'integer' },
  })
  @ApiQuery({
    name: 'raag',
    required: false,
    description: 'A raag ID (/v2/raags).',
    schema: { type: 'integer' },
  })
  @ApiQuery({
    name: 'ang',
    required: false,
    description: 'Only this Ang.',
    schema: { type: 'integer' },
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1 } })
  @ApiQuery({
    name: 'results',
    required: false,
    description: 'Results per page.',
    schema: { type: 'integer', default: 20 },
  })
  @ApiQuery({
    name: 'livesearch',
    required: false,
    description: '1: only the line and its translations, for search-as-you-type.',
    schema: { type: 'integer', enum: [0, 1] },
  })
  @ApiQuery({
    name: 'isGurmukhi',
    required: false,
    description: 'Auto-detect only: 1 when the query is in Gurmukhi.',
    schema: { type: 'integer', enum: [0, 1] },
  })
  @UpdatedSince()
  search(@Req() req: Request, @Param('query') query: string) {
    return this.searcher.search(req, query);
  }

  @Get('search-results/:VerseIds')
  @Limit250()
  @Docs('Verses by ID, as search results', 'SearchResults', { 400: 'Not a list of numbers.' })
  @IdParam('VerseIds', 'Verse IDs, separated by commas.', '1,2,3')
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 1 } })
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
  @Docs(
    'Shabad',
    'ShabadOrShabads',
    {
      400: 'Not a list of numbers.',
      404: 'No such shabad, or nothing changed since `updatedsince`.',
    },
    'One shabad, or several (`1,2` or `1+2`, in that order) as `{ shabadIds, shabads }`.',
  )
  @IdParam('ShabadID', 'A shabad ID, or several separated by `,` or `+`.')
  @UpdatedSince()
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
  @Docs(
    'Ang of Sri Guru Granth Sahib Ji',
    'AngOrAngs',
    { 404: 'No such Ang, or nothing changed since `updatedsince`.' },
    'One Ang, or several (a range) as `{ pageNos, pages }`.',
  )
  @ANG
  @UpdatedSince()
  ang(@Param('PageNo') pageNo: string, @Query('updatedsince') updatedsince: unknown) {
    return this.angOfSource(pageNo, undefined, updatedsince);
  }

  @Get('angs/:PageNo/:SourceID')
  @Limit100()
  @Docs(
    'Ang of a source',
    'AngOrAngs',
    { 404: 'No such Ang, or nothing changed since `updatedsince`.' },
    'One Ang, or several (a range) as `{ pageNos, pages }`.',
  )
  @ANG
  @SourceParam()
  @UpdatedSince()
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
  @Docs("Today's hukamnama from Sri Harmandir Sahib", 'Hukamnama', HUKAMNAMA_ERRORS)
  latestHukamnama() {
    return this.hukamnama();
  }

  // Only a full date picks a day; /hukamnamas/:year and /:year/:month are the latest.
  @Get('hukamnamas/:year')
  @Limit100()
  @CacheFor(1800)
  @Docs('The latest hukamnama (a year alone picks nothing)', 'Hukamnama', HUKAMNAMA_ERRORS)
  @IdParam('year', 'Ignored.', 2024)
  hukamnamaOfYear() {
    return this.hukamnama();
  }

  @Get('hukamnamas/:year/:month')
  @Limit100()
  @CacheFor(1800)
  @Docs('The latest hukamnama (a month alone picks nothing)', 'Hukamnama', HUKAMNAMA_ERRORS)
  @IdParam('year', 'Ignored.', 2024)
  @IdParam('month', 'Ignored.', 1)
  hukamnamaOfMonth() {
    return this.hukamnama();
  }

  @Get('hukamnamas/:year/:month/:day')
  @Limit100()
  @CacheFor(1800)
  @Docs('The hukamnama of a day', 'Hukamnama', HUKAMNAMA_ERRORS, 'Archived from 2002-01-01.')
  @ApiParam({ name: 'year', schema: { type: 'integer', example: 2024 } })
  @ApiParam({ name: 'month', schema: { type: 'integer', example: 1 } })
  @ApiParam({ name: 'day', schema: { type: 'integer', example: 31 } })
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
  @Docs('A random shabad of Sri Guru Granth Sahib Ji', 'RandomShabad')
  random() {
    return this.randomOf(undefined);
  }

  @Get('random/:SourceID')
  @Limit100()
  @NoCache()
  @Docs('A random shabad of a source', 'RandomShabad')
  @SourceParam(', `all` any source')
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
