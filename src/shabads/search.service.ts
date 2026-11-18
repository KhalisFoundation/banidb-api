import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { TYPES } from '@sttm/banidb';
import anvaad from 'anvaad-js';
import { prepVerse } from '../banidb/mappers';
import * as ops from '../banidb/search-operators';
import { int, parseDateTime, str } from '../common/input';
import { APP_CONFIG, type AppConfig } from '../config/config';
import { DatabaseService } from '../database/database.service';
import { OmniSearch } from './omni-search';
import {
  isSource,
  LIVE_COLUMNS,
  nextPageUrl,
  type ResultsInfo,
  VERSE_COLUMNS,
  VERSE_FROM,
  VersesService,
} from './verses.service';

// Search types (@sttm/banidb TYPES): 0 first letters from the start, 1 first
// letters anywhere, 2 Gurmukhi words, 3 English words, 4 romanized words, 5 Ang,
// 6 main letters, 7 romanized first letters, 8 auto-detect (Meilisearch).
export const SEARCH_TYPES: string[] = TYPES;

@Injectable()
export class SearchService {
  private readonly omni: OmniSearch | null;

  constructor(
    private readonly db: DatabaseService,
    private readonly verses: VersesService,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.omni = config.meili ? new OmniSearch(config.meili) : null;
  }

  async search(req: Request, query: string) {
    const params = req.query;
    let searchQuery = query;
    const sourceId = (str(params.source) ?? '').substr(0, 1);
    let searchType = params.searchtype ? int(params.searchtype) : 0;
    let writer: number | null = int(params.writer) || null;
    let raag: number | null = int(params.raag) || null;
    let ang: number | null = int(params.ang) || null;
    let page = int(params.page) || 0;
    let results = int(params.results) || 20;
    const sinceDate = params.updatedsince ? parseDateTime(params.updatedsince) : null;
    const liveSearch = params.livesearch ? int(params.livesearch) : 0;
    const isGurmukhi = params.isGurmukhi ? int(params.isGurmukhi) : 0;

    if (!SEARCH_TYPES[searchType]) searchType = 0;
    if (writer !== null && writer < 0) writer = 0;
    if (raag !== null && raag < 0) raag = 0;
    if (ang !== null && ang < 0) ang = 0;
    if (page < 1) page = 1;
    if (results < 1) results = 20;

    let columns =
      liveSearch === 1 ? `${LIVE_COLUMNS} ${VERSE_FROM}` : `${VERSE_COLUMNS} ${VERSE_FROM}`;
    let charCodeQuery = '';
    let charCodeQueryWildCard = '';
    const conditions: string[] = [];
    const parameters: unknown[] = [];
    let groupBy = '';
    let orderBy = '';

    if (searchType === 0 || searchType === 1) {
      // First letters: no spaces, Unicode to ASCII, then each letter as its
      // zero-padded char code (operators are kept as they are).
      searchQuery = anvaad.unicode(searchQuery.replace(/\s+/g, ''), true);
      for (let x = 0; x < searchQuery.length; x += 1) {
        const charCode = searchQuery.charCodeAt(x);
        if (ops.DEC_SEARCH_OPERATORS.includes(charCode)) {
          charCodeQuery += searchQuery.charAt(x);
        } else {
          charCodeQuery += `,${charCode < 100 ? `0${charCode}` : charCode}`;
        }
      }
      charCodeQueryWildCard = `${charCodeQuery},z`;
    }

    if (isSource(sourceId)) {
      conditions.push('v.SourceID = ?');
      parameters.push(sourceId);
    }

    const add = (part: ops.QueryPart) => {
      columns += part.columns ?? '';
      conditions.push(part.condition);
      parameters.push(...part.parameters);
    };

    if (searchQuery) {
      if (searchType === 0) {
        add(ops.firstLetterStartToQuery(charCodeQuery, charCodeQueryWildCard));
        if (searchQuery.length < 3) orderBy = 'FirstLetterLen,';
      } else if (searchType === 1) {
        add(ops.firstLetterAnywhereToQuery(charCodeQuery, charCodeQueryWildCard));
        groupBy = 'GROUP BY v.ID';
        if (searchQuery.length < 3) orderBy = 'FirstLetterLen,';
      } else if (searchType === 2) {
        add(ops.fullWordGurmukhiToQuery(anvaad.unicode(searchQuery, true)));
        groupBy = 'GROUP BY v.ID';
      } else if (searchType === 3) {
        add(ops.fullWordEnglishToQuery(searchQuery));
        groupBy = 'GROUP BY v.ID';
      } else if (searchType === 4) {
        add(ops.fullWordRomanizedToQuery(searchQuery));
      } else if (searchType === 5) {
        conditions.push('v.PageNo = ?');
        parameters.push(searchQuery);
      } else if (searchType === 6) {
        add(ops.mainLettersToQuery(anvaad.unicode(searchQuery, true).split(' ').join('%')));
        groupBy = 'GROUP BY v.ID';
      } else if (searchType === 7) {
        conditions.push('v.FirstLetterEng LIKE ?');
        parameters.push(`%${searchQuery.replace(/\s+/g, '').toLowerCase()}%`);
      } else if (searchType === 8) {
        if (/^\d+$/.test(searchQuery.trim())) {
          // A number is an Ang.
          conditions.push('v.PageNo = ?');
          parameters.push(searchQuery);
        } else {
          if (!this.omni) throw new Error('Auto-detect search needs MEILI_HOST');
          const ids = await this.omni.search(
            searchQuery,
            isGurmukhi,
            isSource(sourceId) ? sourceId : null,
            writer,
          );
          return this.verses.byIds(null, ids, 1, liveSearch);
        }
      }
    }

    if (writer !== null && writer > 0) {
      conditions.push('v.WriterID = ?');
      parameters.push(writer);
    }
    if (raag !== null && raag > 0) {
      conditions.push('v.RaagID = ?');
      parameters.push(raag);
    }
    if (ang !== null && ang > 0) {
      conditions.push('v.PageNo = ?');
      parameters.push(ang);
    }
    if (sinceDate) {
      conditions.push('v.Updated > ?');
      parameters.push(sinceDate);
    }

    // Sorted by shabad only, as before: lines of one shabad come in whatever
    // order the database's plan gives (MariaDB and MySQL differ).
    const q = `SELECT ${columns}
      WHERE ${conditions.join(' AND ')}
      ${groupBy}
      ORDER BY ${orderBy} ShabadID ASC`;

    const [count] = await this.db.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM (${q}) AS count`,
      parameters,
    );
    const totalResults = count.total;
    const totalPages = Math.ceil(totalResults / results);
    if (page > totalPages) page = totalPages;
    const resultsInfo: ResultsInfo = {
      totalResults,
      pageResults: totalResults,
      pages: { page, resultsPerPage: results, totalPages },
    };
    if (totalResults === 0) return { resultsInfo, verses: [] };

    if (page < totalPages) resultsInfo.pages.nextPage = nextPageUrl(req, page + 1);
    const rows = await this.db.query(`${q} LIMIT ?, ?`, [
      ...parameters,
      (page - 1) * results,
      results,
    ]);
    const verses = rows.map((row) => prepVerse(row, true, liveSearch));
    resultsInfo.pageResults = verses.length;
    return { resultsInfo, verses };
  }
}
