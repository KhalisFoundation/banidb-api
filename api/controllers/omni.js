const { MeiliSearch } = require('meilisearch');
const natural = require('natural');

const lib = require('../lib');

const metaphone = new natural.DoubleMetaphone();

const client = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_API_KEY,
});

const GURMUKHI_CHARS = 'aAeshkKgG|cCjJ\\tTfFxqQdDnpPbBmXrlvS^Zz&LV';

const preprocessGurbaniRoman = (text) =>
  text
    .toLowerCase()
    .trim()

    // ── Vowel normalization ──────────────────────────────
    // Long/doubled vowels → short
    .replace(/aa+/g, 'a') // naam → nam, saas → sas
    .replace(/ee+/g, 'i') // teerath → tirath
    .replace(/oo+/g, 'u') // soorat → surat
    .replace(/ii+/g, 'i')
    .replace(/uu+/g, 'u')

    // Schwa variations
    .replace(/ae/g, 'e') // vaegaa → vega
    .replace(/ai/g, 'e') // main → men
    .replace(/ao/g, 'o')
    .replace(/au/g, 'o') // aukh → okh

    // ── Consonant normalization ──────────────────────────
    // Retroflex/dental collapse (rr, tt, dd, nn, ll → single)
    .replace(/([tdrnl])\1+/g, '$1') // thakurr→thakur, maangee→mangi etc.

    // Hard aspirates: kh, gh, ch, jh, th, dh, ph, bh
    // Keep as-is — they carry meaning in Punjabi
    // BUT collapse doubled versions
    .replace(/([kgcjtdpb])h\1h/g, '$1h') // tthh → th

    // Nasalization marks often written as ng/n/m interchangeably
    .replace(/ng(?=[^aeiou])/g, 'n') // sang → san (before consonant)
    .replace(/(?<=[aeiou])m(?=[^aeiou])/g, 'n') // optional: treat trailing m/n as same

    // w / v interchangeable in Punjabi transliteration
    .replace(/w/g, 'v')

    // Common spelling variants
    .replace(/qu/g, 'k')
    .replace(/x/g, 'ks')

    // ── Strip punctuation/extra spaces ──────────────────
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const convertToPhonetic = (text) => {
  const primary = [];
  const secondary = [];

  preprocessGurbaniRoman(text)
    .split(' ')
    .forEach((word) => {
      const [p1, p2] = metaphone.process(word);

      if (p1) primary.push(p1);
      if (p2) secondary.push(p2);
    });

  return {
    PhoneticPrimary: primary.join(' '),
    PhoneticSecondary: secondary.join(' '),
  };
};

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
      if (query.split('').every((char) => GURMUKHI_CHARS.includes(char))) {
        processedQuery = '';
        query.split('').forEach((q) => {
          const code = q.charCodeAt(0);
          const padded = code.toString().padStart(3, '0');
          processedQuery += `${padded},`;
        });
        searchParams.attributesToSearchOn = ['FirstLetterChar'];
      } else {
        searchParams.attributesToSearchOn = [
          'FirstLetterStr',
          'MainLetters',
          'Gurmukhi',
          'GurmukhiUnicode',
        ];
      }
    } else if (processedQuery.includes(' ')) {
      searchParams.attributesToSearchOn = [
        'Translation_bdb',
        'Translation_ms',
        'Translation_ssk',
        'Transliteration',
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
      const { PhoneticPrimary } = convertToPhonetic(processedQuery);
      const primaryParams = {
        limit: 20,
        attributesToRetrieve: ['ID', 'RankingScore'],
        attributesToSearchOn: ['PhoneticPrimary', 'PhoneticSecondary'],
        showRankingScore: true,
        matchingStrategy: 'all',
      };
      const resultsPhonetic = await client.index('verses').search(PhoneticPrimary, primaryParams);

      const words = (processedQuery || '').trim().split(/\s+/).filter(Boolean);
      const firstLetters = words.map((w) => w[0]).join('');
      const firstLettersParams = {
        limit: 20,
        attributesToRetrieve: ['ID', 'RankingScore'],
        attributesToSearchOn: ['FirstLetterEng'],
        showRankingScore: true,
        matchingStrategy: 'all',
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

    const verseArray = results.map((hit) => hit.ID).filter((id) => id !== null && id !== undefined);

    const preppedResults = await lib.prepResults(req, verseArray, liveSearch);
    return preppedResults;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

exports.omniSearch = omniSearch;
