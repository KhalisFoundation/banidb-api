const { MeiliSearch } = require('meilisearch');
const lib = require('../lib');

const client = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_API_KEY,
});

const GURMUKHI_CHARS = 'aAeshkKgG|cCjJ\\tTfFxqQdDnpPbBmXrlvS^Zz&LV';

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
      limit: 20,
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
      searchParams.attributesToSearchOn = [
        'FirstLetterEng',
        'Translation_bdb',
        'Translation_ms',
        'Translation_ssk',
      ];
    }

    let results = await client.index('verses').search(processedQuery || '', searchParams);
    if (!isGurmukhi && results.estimatedTotalHits === 0) {
      const words = (processedQuery || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const firstLetters = words.map(w => w[0]).join('');
      if (firstLetters) {
        const fallbackParams = {
          limit: 20,
          attributesToRetrieve: ['ID'],
          attributesToSearchOn: ['FirstLetterEng'],
        };
        results = await client.index('verses').search(firstLetters, fallbackParams);
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
