import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { SOURCES } from '@sttm/banidb';
import { getShabadInfo, getSource, getRaag, getWriter, prepVerse } from '../banidb/mappers';
import { angToQuery } from '../banidb/search-operators';
import { isRangeOfNumbers } from '../common/input';
import { DatabaseService, type Row } from '../database/database.service';

// Every column a verse is mapped from, with its writer, raag and source.
export const VERSE_COLUMNS = `v.ID, v.Gurmukhi, v.GurmukhiUni, v.Translations, v.PageNo AS PageNo, v.LineNo,
    v.SourceID as SourceID, s.ShabadID, v.FirstLetterStr, v.MainLetters, v.Visraam,
    v.FirstLetterEng, v.Transliterations, v.WriterID, w.WriterEnglish,
    w.WriterGurmukhi, w.WriterUnicode, v.RaagID, r.RaagGurmukhi,
    r.RaagUnicode, r.RaagEnglish, r.RaagWithPage,
    src.SourceGurmukhi, src.SourceUnicode, src.SourceEnglish,
    GREATEST(s.Updated, v.Updated) AS Updated`;

// Search-as-you-type needs only the line and its translations.
export const LIVE_COLUMNS = `v.ID, v.Gurmukhi, v.GurmukhiUni, v.Translations, s.ShabadID`;

export const VERSE_FROM = `FROM Verse v
  LEFT JOIN Shabad s ON s.VerseID = v.ID
  LEFT JOIN Writer w USING(WriterID)
  LEFT JOIN Raag r USING(RaagID)
  LEFT JOIN Source src USING(SourceID)`;

// Shabad IDs from 5,000,000 up aren't published.
const PUBLISHED = 'AND s.ShabadID < 5000000';

export const isSource = (id: unknown): id is string =>
  typeof id === 'string' && Object.hasOwn(SOURCES, id);

export interface Navigation {
  previous: number | null;
  next: number | null;
}

export interface ResultsInfo {
  totalResults: number;
  pageResults: number;
  pages: { page: number; resultsPerPage: number; totalPages: number; nextPage?: string };
}

// The address of the next page of results: this request's, with `page` set.
// The protocol is the connection's, as before (http behind the proxy).
export function nextPageUrl(req: Request, page: number) {
  const query: Record<string, unknown> = { ...(req.query as Record<string, unknown>), page };
  const protocol = (req.socket as { encrypted?: boolean }).encrypted ? 'https' : 'http';
  const path = req.url.split('?')[0];
  const search = Object.keys(query)
    .map((key) => `${key}=${encodeURIComponent(String(query[key]))}`)
    .join('&');
  return `${protocol}://${req.get('host')}${path}?${search}`;
}

@Injectable()
export class VersesService {
  constructor(private readonly db: DatabaseService) {}

  // One shabad ({ shabadInfo, count, navigation, verses }), or several
  // ({ shabadIds, shabads }) when more than one ID is given or `forceMulti`;
  // {} when none exist (or none changed since `sinceDate`).
  async getShabad(ids: (string | number)[], sinceDate: string | null = null, forceMulti = false) {
    const tokens = ids.map(() => '?').join(',');
    const parameters: unknown[] = [...ids];

    let sinceQuery = '';
    if (sinceDate) {
      sinceQuery = 'AND GREATEST(s.Updated, v.Updated) > ?';
      parameters.push(sinceDate);
    }

    // Several shabads come back in the order asked for.
    let multipleShabadOrder = '';
    if (ids.length > 1) {
      multipleShabadOrder = `FIELD(ShabadID, ${tokens}),`;
      parameters.push(...ids);
    }

    const rows = await this.db.query(
      `SELECT ${VERSE_COLUMNS}, sn.VerseID as ShabadName
        ${VERSE_FROM} LEFT JOIN ShabadName sn USING(ShabadID)
        WHERE s.ShabadID IN (${tokens}) ${PUBLISHED} ${sinceQuery}
        ORDER BY ${multipleShabadOrder} v.ID ASC`,
      parameters,
    );

    if (rows.length === 0) return {};
    if (ids.length === 1 && !forceMulti) return this.shabadOf(rows);

    const shabadIds: number[] = [];
    const groups: Row[][] = [];
    rows.forEach((row) => {
      if (row.ShabadID !== shabadIds[shabadIds.length - 1]) {
        shabadIds.push(row.ShabadID as number);
        groups.push([]);
      }
      groups[groups.length - 1].push(row);
    });
    return { shabadIds, shabads: await Promise.all(groups.map((group) => this.shabadOf(group))) };
  }

  // One Ang ({ source, count, navigation, page }), or several ({ pageNos, pages })
  // for a range; null when there's nothing. A page number that isn't one reads
  // as 1, an unknown source as G, and Guru Granth Sahib stops at 1430.
  async getAngs({
    pageNo,
    sourceID,
    sinceDate,
  }: {
    pageNo: unknown;
    sourceID: unknown;
    sinceDate: string | null;
  }) {
    let page = isRangeOfNumbers(pageNo) ? pageNo : '1';
    const source = isSource(sourceID) ? sourceID : 'G';
    if (source === 'G' && Number(page) > 1430) page = '1430';

    const angQuery = angToQuery(page);
    // Only < and > with nothing else (e.g. <100) made the old API send broken
    // SQL; there's no such Ang.
    if (angQuery.q.endsWith('()')) return null;

    const parameters: unknown[] = [...angQuery.parameters, source];
    let sinceQuery = '';
    if (sinceDate) {
      sinceQuery = 'AND GREATEST(s.Updated, v.Updated) > ?';
      parameters.push(sinceDate);
    }

    const rows = await this.db.query(
      `SELECT ${VERSE_COLUMNS} ${VERSE_FROM}
      WHERE
        ${angQuery.q}
        AND v.SourceID = ?
        ${sinceQuery}
        ${PUBLISHED}
      ORDER BY PageNo,v.LineNo ASC, v.ID ASC`,
      parameters,
    );

    if (rows.length === 0) return null;
    if (angQuery.totalPages === 1) return this.angOf(rows);

    const pageNos: number[] = [];
    const groups: Row[][] = [];
    rows.forEach((row) => {
      if (row.PageNo !== pageNos[pageNos.length - 1]) {
        pageNos.push(row.PageNo as number);
        groups.push([]);
      }
      groups[groups.length - 1].push(row);
    });
    return { pageNos, pages: await Promise.all(groups.map((group) => this.angOf(group))) };
  }

  // Verses by ID, in the order given, 20 to a page.
  async byIds(
    req: Request | null,
    ids: (string | number)[],
    requestedPage: number,
    liveSearch: number,
  ) {
    const results = 20;
    if (ids.length === 0) {
      const pages = { page: 1, resultsPerPage: results, totalPages: 0 };
      return { resultsInfo: { totalResults: 0, pageResults: 0, pages }, verses: [] };
    }
    const placeholders = ids.map(() => '?').join(',');
    const q = `SELECT ${VERSE_COLUMNS} ${VERSE_FROM}
           WHERE v.ID IN (${placeholders}) ORDER BY field(v.ID, ${placeholders})`;

    const [count] = await this.db.query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM (${q}) AS count`,
      [...ids, ...ids],
    );
    const totalResults = count.total;
    const totalPages = Math.ceil(totalResults / results);
    const page = Math.min(requestedPage, totalPages);
    const resultsInfo: ResultsInfo = {
      totalResults,
      pageResults: totalResults,
      pages: { page, resultsPerPage: results, totalPages },
    };
    if (totalResults === 0) return { resultsInfo, verses: [] };

    if (req && page < totalPages) resultsInfo.pages.nextPage = nextPageUrl(req, page + 1);
    const rows = await this.db.query(`${q} LIMIT ?, ?`, [
      ...ids,
      ...ids,
      (page - 1) * results,
      results,
    ]);
    const verses = rows.map((row) => prepVerse(row, true, liveSearch));
    resultsInfo.pageResults = verses.length;
    return { resultsInfo, verses };
  }

  private async shabadOf(rows: Row[]) {
    const verses = rows.map((row) => prepVerse(row));
    return {
      shabadInfo: getShabadInfo(rows[0], rows),
      count: verses.length,
      navigation: await this.navigation('shabad', rows[0].ID, rows[rows.length - 1].ID),
      verses,
    };
  }

  private async angOf(rows: Row[]) {
    const { PageNo, SourceID } = rows[0];
    const page = rows.map((row) => {
      const verse = prepVerse(row);
      verse.writer = getWriter(row);
      verse.raag = getRaag(row);
      return verse;
    });
    return {
      source: getSource(rows[0]),
      count: rows.length,
      navigation: await this.navigation('ang', PageNo, PageNo, String(SourceID)),
      page,
    };
  }

  // The shabad (by its first and last verse) or Ang before and after this one.
  private async navigation(
    type: 'shabad' | 'ang',
    first: unknown,
    last: unknown,
    source = '',
  ): Promise<Navigation> {
    const shabad = type === 'shabad';
    const table = shabad ? 'Shabad' : 'Verse';
    const column = shabad ? 'ShabadID' : 'PageNo';
    const columnWhere = shabad ? 'VerseID' : 'PageNo';
    const where = shabad ? '' : 'AND SourceID = ?';
    const parameters = shabad ? [first, last] : [first, source, last, source];

    const rows = await this.db.query(
      `(SELECT 'previous' as navigation, ${column}
                  FROM ${table}
                  WHERE ${columnWhere} < ? ${where}
                  ORDER BY ${columnWhere} DESC LIMIT 1)
                UNION
                (SELECT 'next' as navigation, ${column}
                  FROM ${table}
                  WHERE ${columnWhere} > ? ${where}
                  ORDER BY ${columnWhere} LIMIT 1);`,
      parameters,
    );
    const navigation: Navigation = { previous: null, next: null };
    rows.forEach((row) => {
      if (row.navigation === 'previous') navigation.previous = row[column] as number;
      if (row.navigation === 'next') navigation.next = row[column] as number;
    });
    return navigation;
  }
}
