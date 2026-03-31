/* eslint-disable no-underscore-dangle */

/**
 * omniSearch.js — Auto-detect search for Gurbani
 *
 * Search modes (auto-detected):
 *   Gurmukhi mode (isGurmukhi = true)
 *     • Single word, pure Gurmukhi chars → FirstLetterChar (char-code prefix)
 *     • Otherwise → FirstLetterStr, MainLetters, Gurmukhi, GurmukhiUnicode
 *
 *   English / Romanized mode (isGurmukhi = false)
 *     • No spaces → FirstLetterEng  (first-letter English)
 *     • Spaces     → Romanized transliteration + consonant skeleton fallback
 *                    + translation search, all merged and re-ranked
 */

const { MeiliSearch } = require('meilisearch');
const lib = require('../lib');
const { normalizePunjabiRoman, toConsonantSkeleton, searchRank } = require('./phonetic-helpers');

const client = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_API_KEY,
});

// Characters that are valid in the strict Gurmukhi romanization encoding
const GURMUKHI_CHARS = 'aAeshkKgG|cCjJ\\tTfFxqQdDnpPbBmXrlvS^Zz&LV';

const omniSearch = async (req, query, isGurmukhi, SourceID, writer, liveSearch) => {
  try {
    const rawQuery = query.trim().replaceAll('*', ',');
    let results = [];

    const activeFilters = [];
    if (SourceID !== 'a') activeFilters.push(`Source=${SourceID}`);
    if (writer !== null) activeFilters.push(`Writer=${writer}`);
    const filterStr = activeFilters.length > 0 ? activeFilters.join(' AND ') : undefined;

    const withFilter = (params) => (filterStr ? { ...params, filter: filterStr } : params);

    // ── GURMUKHI MODE ─────────────────────────────────────────────────────────
    if (isGurmukhi) {
      let processedQuery = rawQuery;
      const searchParams = {
        limit: 20,
        attributesToRetrieve: ['ID', 'RankingScore'],
        showRankingScore: true,
      };

      const isStrictGurmukhi = rawQuery.split('').every((char) => GURMUKHI_CHARS.includes(char));

      if (isStrictGurmukhi) {
        processedQuery = rawQuery
          .split('')
          .map((char) => char.charCodeAt(0).toString().padStart(3, '0'))
          .join(',');
        processedQuery += ',';
        searchParams.attributesToSearchOn = ['FirstLetterChar'];
      } else {
        searchParams.attributesToSearchOn = [
          'FirstLetterStr',
          'MainLetters',
          'Gurmukhi',
          'GurmukhiUnicode',
        ];
      }

      const gurmukhi = await client
        .index('verses')
        .search(processedQuery || '', withFilter(searchParams));

      results = gurmukhi.hits;

      // ── ENGLISH / ROMANIZED MODE ──────────────────────────────────────────────
    } else {
      const isSingleWord = !rawQuery.includes(' ');

      if (isSingleWord) {
        const singleWordResults = await client.index('verses').search(
          rawQuery,
          withFilter({
            limit: 20,
            attributesToRetrieve: ['ID', 'RankingScore'],
            showRankingScore: true,
            attributesToSearchOn: [
              'FirstLetterEng',
              'Translation_bdb',
              'Translation_ms',
              'Translation_ssk',
            ],
          }),
        );

        results = singleWordResults.hits;
      } else {
        // ── Multi-word romanized: the main path ───────────────────────────────
        const userNorm = normalizePunjabiRoman(rawQuery);
        const userSkeleton = toConsonantSkeleton(userNorm);
        const firstLetters = rawQuery
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w[0])
          .join('');

        const multiSearchResult = await client.multiSearch({
          queries: [
            // Search 1: Normalized romanization
            withFilter({
              q: userNorm,
              indexUid: 'verses',
              limit: 40,
              attributesToRetrieve: ['ID', 'RankingScore', 'ManualPhonetic'],
              attributesToSearchOn: ['ManualPhonetic', 'Transliteration'],
              showRankingScore: true,
              showRankingScoreDetails: true,
              matchingStrategy: 'frequency',
            }),
            // Search 2: Consonant skeleton
            withFilter({
              q: userSkeleton,
              indexUid: 'verses',
              limit: 40,
              attributesToRetrieve: ['ID', 'RankingScore', 'ManualPhonetic', 'ConsonantSkeleton'],
              attributesToSearchOn: ['ConsonantSkeleton'],
              showRankingScore: true,
              showRankingScoreDetails: true,
              matchingStrategy: 'frequency',
            }),
            // Search 3: First letter English fallback
            withFilter({
              q: firstLetters,
              indexUid: 'verses',
              limit: 20,
              attributesToRetrieve: ['ID', 'RankingScore'],
              attributesToSearchOn: ['FirstLetterEng'],
              showRankingScore: true,
              matchingStrategy: 'all',
            }),
          ],
        });

        // searchRank now handles all 3 result sets
        const ranked = searchRank(rawQuery, multiSearchResult.results);

        // Translation search (meaning-based, not romanized)
        const translationResults = await client.index('verses').search(
          rawQuery,
          withFilter({
            limit: 15,
            attributesToRetrieve: ['ID', 'RankingScore'],
            showRankingScore: true,
            attributesToSearchOn: ['Translation_bdb', 'Translation_ms', 'Translation_ssk'],
            matchingStrategy: 'frequency',
          }),
        );

        const rankedIds = new Set(ranked.map((r) => r.ID));
        const translationOnly = translationResults.hits
          .filter((h) => !rankedIds.has(h.ID))
          .map((h) => ({ ...h, _rankingScore: h._rankingScore * 0.5 }));

        results = [...ranked, ...translationOnly];
      }
    }

    const verseArray = results.map((hit) => hit.ID).filter((id) => id !== null && id !== undefined);

    const preppedResults = await lib.prepResults(req, verseArray, liveSearch);
    return preppedResults;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

exports.omniSearch = omniSearch;
