const { MeiliSearch } = require('meilisearch');
const natural = require('natural');

const lib = require('../lib');

const metaphone = new natural.Metaphone();

const client = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_API_KEY,
});

const GURMUKHI_CHARS = 'aAeshkKgG|cCjJ\\tTfFxqQdDnpPbBmXrlvS^Zz&LV';

const omniSearch = async (req, query, isGurmukhi, SourceID, writer, liveSearch) => {
  try {
    let processedQuery = query.trim().replaceAll('*', ',');
    let results = [];

    const activeFilters = [];
    if (SourceID !== 'a') {
      activeFilters.push(`Source=${SourceID}`);
    }
    if (writer !== null) {
      activeFilters.push(`Writer=${writer}`);
    }

    const searchParams = {
      limit: 20,
      attributesToRetrieve: ['ID', 'RankingScore'],
      showRankingScore: true,
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
    } else if (processedQuery.includes(' ')) {
      searchParams.attributesToSearchOn = [
        'Phonetic',
        'Translation_bdb',
        'Translation_ms',
        'Translation_ssk',
      ];
    } else {
      searchParams.attributesToSearchOn = [
        'FirstLetterEng',
        'Translation_bdb',
        'Translation_ms',
        'Translation_ssk',
      ];
    }

    const resultsSimple = await client.index('verses').search(processedQuery || '', searchParams);

    if (!isGurmukhi && processedQuery.includes(' ')) {
      const phoneticQuery = metaphone.process(processedQuery);
      const phoneticParams = {
        limit: 20,
        attributesToRetrieve: ['ID', 'RankingScore'],
        attributesToSearchOn: ['Phonetic', 'Transliteration'],
        showRankingScore: true,
      };
      const resultsPhonetic = await client.index('verses').search(phoneticQuery, phoneticParams);

      const words = (processedQuery || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const firstLetters = words.map(w => w[0]).join('');
      const firstLettersParams = {
        limit: 20,
        attributesToRetrieve: ['ID', 'RankingScore'],
        attributesToSearchOn: ['FirstLetterEng'],
        showRankingScore: true,
      };
      const resultsFirstLetters = await client
        .index('verses')
        .search(firstLetters, firstLettersParams);

      results = [...resultsSimple.hits, ...resultsPhonetic.hits, ...resultsFirstLetters.hits].sort(
        // eslint-disable-next-line no-underscore-dangle
        (a, b) => (b._rankingScore || 0) - (a._rankingScore || 0),
      );
    } else {
      results = resultsSimple.hits;
    }

    const verseArray = results.map(hit => hit.ID).filter(id => id !== null && id !== undefined);

    const preppedResults = await lib.prepResults(req, verseArray, liveSearch);
    return preppedResults;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

exports.omniSearch = omniSearch;
