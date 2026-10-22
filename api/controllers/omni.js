const { MeiliSearch } = require('meilisearch');
const lib = require('../lib');
const { normalizePunjabiRoman, toConsonantSkeleton } = require('./phonetic');

const client = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_API_KEY,
});

const GURMUKHI_CHARS = 'aAeshkKgG|cCjJ\\tTfFxqQdDnpPbBmXrlvS^Zz&LV';
const RESULT_LIMIT = 20;
const TRANSLATIONS = ['Translation_bdb', 'Translation_ms', 'Translation_ssk'];
// For a single word, a translation that contains it should beat a romanized
// match, so romanized single-word scores are scaled just below translation ones.
const SINGLE_WORD_ROMAN_WEIGHT = 0.8;

// Words starting with ੳ/ਅ/ੲ get their English first letter from the
// transliteration (ਉਤਰਸਿ → "u"), but people type them as any vowel. The index's
// FirstLetterEngLoose field treats every vowel as "a"; the query must match.
const looseFirstLetters = letters => letters.toLowerCase().replace(/[aeiou]/g, 'a');

const uniqueHits = hitLists => {
  const seen = new Set();
  return hitLists.flat().filter(hit => !seen.has(hit.ID) && seen.add(hit.ID));
};

const omniSearch = async (req, query, isGurmukhi, SourceID, writer, liveSearch) => {
  try {
    let processedQuery = query.trim().replaceAll('*', ',');

    const activeFilters = [];
    if (SourceID !== 'a') {
      activeFilters.push(`Source=${SourceID}`);
    }
    if (writer !== null) {
      activeFilters.push(`Writer=${writer}`);
    }

    const searchParams = {
      limit: RESULT_LIMIT,
      attributesToRetrieve: ['ID'],
    };

    if (activeFilters.length > 0) {
      searchParams.filter = activeFilters.join(' AND ');
    }

    const search = (q, attributesToSearchOn, extra = {}) =>
      client.index('verses').search(q, { ...searchParams, attributesToSearchOn, ...extra });

    let hits;
    const words = processedQuery.split(/\s+/).filter(Boolean);

    if (isGurmukhi) {
      if (query.split('').every(char => GURMUKHI_CHARS.includes(char))) {
        processedQuery = '';
        query.split('').forEach(q => {
          const code = q.charCodeAt(0);
          const padded = code.toString().padStart(3, '0');
          processedQuery += `${padded},`;
        });
        ({ hits } = await search(processedQuery, ['FirstLetterChar']));
      } else {
        ({ hits } = await search(processedQuery, ['FirstLetterStr', 'MainLetters', 'Gurmukhi']));
      }
    } else {
      const firstLetterTiers = async letters => {
        const [exact, loose] = await Promise.all([
          search(letters, ['FirstLetterEng']),
          // Optional until the index has FirstLetterEngLoose (omni-controller).
          search(looseFirstLetters(letters), ['FirstLetterEngLoose']).catch(() => ({ hits: [] })),
        ]);
        return uniqueHits([exact.hits, loose.hits]);
      };
      // Whole words, romanized Gurbani or English: search the normalised
      // romanization, its consonant skeleton and the translations, and rank
      // everything by how well each line matched.
      const wordMatches = async ({ skeleton: useSkeleton = true, romanWeight = 1 } = {}) => {
        const normalized = normalizePunjabiRoman(processedQuery);
        const scored = { showRankingScore: true };
        const [roman, skeleton, translations] = await Promise.all([
          normalized
            ? search(normalized, ['ManualPhonetic'], scored).catch(() => ({ hits: [] }))
            : { hits: [] },
          normalized && useSkeleton
            ? search(toConsonantSkeleton(normalized), ['ConsonantSkeleton'], scored).catch(() => ({
                hits: [],
              }))
            : { hits: [] },
          search(processedQuery, TRANSLATIONS, scored),
        ]);
        const best = new Map();
        const add = (list, weight) =>
          list.forEach(hit => {
            // eslint-disable-next-line no-underscore-dangle
            const score = hit._rankingScore * weight;
            if (!best.has(hit.ID) || best.get(hit.ID).score < score)
              best.set(hit.ID, { ID: hit.ID, score });
          });
        add(roman.hits, romanWeight);
        add(skeleton.hits, 0.9);
        add(translations.hits, 1);
        return [...best.values()].sort((a, b) => b.score - a.score);
      };

      if (words.length === 1) {
        // No space: typed first letters come first (exact, then with every
        // vowel alike). Whole-word matches (romanized or English, ranked by
        // score) follow; for a long real word there are rarely first-letter
        // matches, so they rise to the top. The consonant skeleton is too
        // loose for a single word, so it's left out here.
        const [letters, wordHits] = await Promise.all([
          firstLetterTiers(words[0]),
          wordMatches({ skeleton: false, romanWeight: SINGLE_WORD_ROMAN_WEIGHT }),
        ]);
        hits = uniqueHits([letters, wordHits]);
      } else {
        hits = await wordMatches();
        // Nothing matched as words: try the first letter of each word.
        if (hits.length === 0) hits = await firstLetterTiers(words.map(w => w[0]).join(''));
      }
    }

    const verseArray = hits
      .slice(0, RESULT_LIMIT)
      .map(hit => hit.ID)
      .filter(id => id !== null && id !== undefined);

    const preppedResults = await lib.prepResults(req, verseArray, liveSearch);
    return preppedResults;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

exports.omniSearch = omniSearch;
