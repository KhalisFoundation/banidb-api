const { MeiliSearch } = require('meilisearch');

const lib = require('../lib');
const { preprocessGurbaniRoman, convertToPhonetic, searchRank } = require('./phonetic-helpers');

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
      const isStrictGurmukhi = query.split('').every((char) => GURMUKHI_CHARS.includes(char));
      if (isStrictGurmukhi) {
        processedQuery = query
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
    } else {
      const isSingleWord = !processedQuery.includes(' ');
      const translationAttrs = ['Translation_bdb', 'Translation_ms', 'Translation_ssk'];

      if (isSingleWord) {
        searchParams.attributesToSearchOn = ['FirstLetterEng', ...translationAttrs];
      } else {
        searchParams.attributesToSearchOn = [...translationAttrs];
        searchParams.attributesToRetrieve = ['ID', 'RankingScore'];
      }
    }

    const resultsSimple = await client.index('verses').search(processedQuery || '', searchParams);

    if (!isGurmukhi && processedQuery.includes(' ')) {
      const { PhoneticPrimary } = convertToPhonetic(processedQuery);
      const processedPhonetic = preprocessGurbaniRoman(processedQuery);
      const words = (processedQuery || '').trim().split(/\s+/).filter(Boolean);
      const firstLetters = words.map((w) => w[0]).join('');

      const manualParams = {
        limit: 40,
        attributesToRetrieve: ['ID', 'RankingScore', 'ManualPhonetic'],
        attributesToSearchOn: ['ManualPhonetic', 'Transliteration'],
        showRankingScore: true,
        matchingStrategy: 'all',
      };

      const phonticParams = {
        limit: 40,
        attributesToRetrieve: ['ID', 'RankingScore', 'Phonetic'],
        attributesToSearchOn: ['Phonetic'],
        showRankingScore: true,
        matchingStrategy: 'frequency',
      };

      const firstLettersParams = {
        limit: 10,
        attributesToRetrieve: ['ID', 'RankingScore', 'FirstLetterEng'],
        attributesToSearchOn: ['FirstLetterEng'],
        showRankingScore: true,
        matchingStrategy: 'all',
      };

      const multipleSearches = await client.multiSearch({
        queries: [
          {
            q: processedPhonetic,
            indexUid: 'verses',
            ...manualParams,
            showRankingScoreDetails: true,
          },
          {
            q: PhoneticPrimary.replaceAll(' ', ''),
            indexUid: 'verses',
            ...phonticParams,
            showRankingScoreDetails: true,
          },
          {
            q: firstLetters,
            indexUid: 'verses',
            ...firstLettersParams,
            showRankingScoreDetails: true,
          },
        ],
      });

      results = searchRank(PhoneticPrimary, multipleSearches.results);
    } else {
      results = resultsSimple.hits;
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
