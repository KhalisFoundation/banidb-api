const { MeiliSearch } = require('meilisearch');
const lib = require('../lib');

const client = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_API_KEY,
});

const GURMUKHI_CHARS = 'aAeshkKgG|cCjJ\\tTfFxqQdDnpPbBmXrlvS^Zz&LV';
const RESULT_LIMIT = 20;

// Words starting with ੳ/ਅ/ੲ get their English first letter from the
// transliteration (ਉਤਰਸਿ → "u"), but people type them as any vowel. The index's
// FirstLetterEngLoose field treats every vowel as "a"; the query must match.
const looseFirstLetters = letters => letters.toLowerCase().replace(/[aeiou]/g, 'a');

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

    if (isGurmukhi) {
      if (query.split('').every(char => GURMUKHI_CHARS.includes(char))) {
        processedQuery = '';
        query.split('').forEach(q => {
          const code = q.charCodeAt(0);
          const padded = code.toString().padStart(3, '0');
          processedQuery += `${padded},`;
        });
        searchParams.attributesToSearchOn = ['FirstLetterChar'];
      } else {
        searchParams.attributesToSearchOn = ['FirstLetterStr', 'MainLetters', 'Gurmukhi'];
      }
    } else {
      searchParams.showRankingScore = true;
      searchParams.attributesToSearchOn = [
        'FirstLetterEng',
        'Translation_bdb',
        'Translation_ms',
        'Translation_ssk',
      ];
    }

    const results = await client.index('verses').search(processedQuery || '', searchParams);
    if (!isGurmukhi && results.hits.length < RESULT_LIMIT) {
      const words = (processedQuery || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      // One word is typed first letters; several words are romanized Gurbani,
      // so search the first letter of each word, but only when nothing matched.
      const firstLetters =
        words.length === 1 ? words[0] : results.hits.length === 0 && words.map(w => w[0]).join('');
      if (firstLetters) {
        const looseResults = await client.index('verses').search(looseFirstLetters(firstLetters), {
          ...searchParams,
          attributesToSearchOn: ['FirstLetterEngLoose'],
        });
        // Rank by score so a loose first-letter match beats a weak (typo)
        // translation match; the sort is stable, so ties keep exact hits first.
        const seen = new Set(results.hits.map(hit => hit.ID));
        results.hits = results.hits
          .concat(looseResults.hits.filter(hit => !seen.has(hit.ID)))
          // eslint-disable-next-line no-underscore-dangle
          .sort((a, b) => b._rankingScore - a._rankingScore)
          .slice(0, RESULT_LIMIT);
      }
    }
    const verseArray = results.hits
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
