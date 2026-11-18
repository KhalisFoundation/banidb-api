import { MeiliSearch, type SearchParams } from 'meilisearch';
import { normalizePunjabiRoman, toConsonantSkeleton } from '../banidb/phonetic';

// Auto-detect search (searchtype 8) on the Meilisearch `verses` index that
// omni-controller builds. Returns verse IDs, best first.

const GURMUKHI_CHARS = 'aAeshkKgG|cCjJ\\tTfFxqQdDnpPbBmXrlvS^Zz&LV';
const RESULT_LIMIT = 20;
const TRANSLATIONS = ['Translation_bdb', 'Translation_ms', 'Translation_ssk'];
// For a single word, a translation that contains it should beat a romanized
// match, so romanized single-word scores are scaled just below translation ones.
const SINGLE_WORD_ROMAN_WEIGHT = 0.8;

interface Hit {
  ID: number;
  _rankingScore?: number;
}
interface Scored {
  ID: number;
  score: number;
}

const noHits = { hits: [] as Hit[] };

const uniqueHits = (hitLists: { ID: number }[][]) => {
  const seen = new Set<number>();
  return hitLists.flat().filter((hit) => !seen.has(hit.ID) && seen.add(hit.ID));
};

export class OmniSearch {
  private readonly client: MeiliSearch;

  constructor(config: { host: string; apiKey?: string }) {
    this.client = new MeiliSearch(config);
  }

  async search(
    query: string,
    isGurmukhi: number,
    sourceId: string | null,
    writer: number | null,
  ): Promise<number[]> {
    let processedQuery = query.trim().replaceAll('*', ',');

    const filters: string[] = [];
    if (sourceId) filters.push(`Source="${sourceId}"`);
    if (writer !== null) filters.push(`Writer=${writer}`);

    const searchParams: SearchParams = { limit: RESULT_LIMIT, attributesToRetrieve: ['ID'] };
    if (filters.length > 0) searchParams.filter = filters.join(' AND ');

    const search = async (q: string, attributesToSearchOn: string[], extra: SearchParams = {}) =>
      (await this.client
        .index('verses')
        .search(q, { ...searchParams, attributesToSearchOn, ...extra })) as unknown as {
        hits: Hit[];
      };

    let hits: { ID: number }[];
    const words = processedQuery.split(/\s+/).filter(Boolean);

    if (isGurmukhi) {
      if (query.split('').every((char) => GURMUKHI_CHARS.includes(char))) {
        // Gurmukhi first letters: each letter's zero-padded char code.
        processedQuery = '';
        query.split('').forEach((letter) => {
          processedQuery += `${letter.charCodeAt(0).toString().padStart(3, '0')},`;
        });
        ({ hits } = await search(processedQuery, ['FirstLetterChar']));
      } else {
        ({ hits } = await search(processedQuery, ['FirstLetterStr', 'MainLetters', 'Gurmukhi']));
      }
    } else {
      // Typed first letters: each letter is the first letter of a word, as
      // the transliteration spells it (ਉਤਰਸਿ → "u").
      const firstLetters = async (letters: string) =>
        (await search(letters, ['FirstLetterEng'])).hits;
      // Whole words, romanized Gurbani or English: search the normalised
      // romanization, its consonant skeleton and the translations, and rank
      // everything by how well each line matched.
      const wordMatches = async ({ skeleton: useSkeleton = true, romanWeight = 1 } = {}) => {
        const normalized = normalizePunjabiRoman(processedQuery);
        const scored = { showRankingScore: true };
        const [roman, skeleton, translations] = await Promise.all([
          normalized ? search(normalized, ['ManualPhonetic'], scored).catch(() => noHits) : noHits,
          normalized && useSkeleton
            ? search(toConsonantSkeleton(normalized), ['ConsonantSkeleton'], scored).catch(
                () => noHits,
              )
            : noHits,
          search(processedQuery, TRANSLATIONS, scored),
        ]);
        const best = new Map<number, Scored>();
        const add = (list: Hit[], weight: number) =>
          list.forEach((hit) => {
            const score = (hit._rankingScore ?? 0) * weight;
            const current = best.get(hit.ID);
            if (!current || current.score < score) best.set(hit.ID, { ID: hit.ID, score });
          });
        add(roman.hits, romanWeight);
        add(skeleton.hits, 0.9);
        add(translations.hits, 1);
        return [...best.values()].sort((a, b) => b.score - a.score);
      };

      if (words.length === 1) {
        // No space: typed first letters come first. Whole-word matches
        // (romanized or English, ranked by score) follow; for a long real word
        // there are rarely first-letter matches, so they rise to the top. The
        // consonant skeleton is too loose for a single word, so it's left out
        // here.
        const [letters, wordHits] = await Promise.all([
          firstLetters(words[0]),
          wordMatches({ skeleton: false, romanWeight: SINGLE_WORD_ROMAN_WEIGHT }),
        ]);
        hits = uniqueHits([letters, wordHits]);
      } else {
        hits = await wordMatches();
        // Nothing matched as words: try the first letter of each word.
        if (hits.length === 0) hits = await firstLetters(words.map((w) => w[0]).join(''));
      }
    }

    return hits
      .slice(0, RESULT_LIMIT)
      .map((hit) => hit.ID)
      .filter((id) => id !== null && id !== undefined);
  }
}
