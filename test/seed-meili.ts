// Fills Meilisearch's `verses` index from the test database the way
// omni-controller does in production (its prepareDocument and index
// settings), for auto-detect search (searchtype 8). Jest runs it before the
// e2e tests; `npx ts-node test/seed-meili.ts` runs it on its own.
import { createConnection } from 'mariadb';
import { MeiliSearch } from 'meilisearch';
import { normalizePunjabiRoman, toConsonantSkeleton } from '../src/banidb/phonetic';
import './e2e-env';

type Row = Record<string, any>;

const charCodesToChars = (codes: string | null) =>
  (codes ?? '')
    .replace(/^,|,$/g, '')
    .split(',')
    .filter(Boolean)
    .map((code) => String.fromCharCode(Number.parseInt(code, 10)))
    .join('');

function document(verse: Row) {
  const transliteration: string = verse.Transliterations
    ? (JSON.parse(verse.Transliterations)?.en ?? '')
    : '';
  const translations = verse.Translations ? JSON.parse(verse.Translations) : {};
  const normalized = transliteration ? normalizePunjabiRoman(transliteration) : '';
  const skeleton = transliteration ? toConsonantSkeleton(normalized) : '';
  return {
    ID: verse.ID,
    Gurmukhi: verse.Gurmukhi,
    GurmukhiUnicode: verse.GurmukhiUni,
    Translation_bdb: translations.en?.bdb || '',
    Translation_ms: translations.en?.ms || '',
    Translation_ssk: translations.en?.ssk || '',
    FirstLetterStr: charCodesToChars(verse.FirstLetterStr),
    FirstLetterChar: verse.FirstLetterStr,
    MainLetters: verse.MainLetters,
    FirstLetterEng: verse.FirstLetterEng,
    Source: verse.SourceID,
    Writer: verse.WriterID,
    ShabadID: verse.ShabadID,
    Transliteration: transliteration,
    ManualPhonetic: normalized,
    ConsonantSkeleton: skeleton,
    PhoneticPrimary: normalized,
    PhoneticSecondary: skeleton,
    Phonetic: normalized.replace(/\s+/g, ''),
  };
}

export default async function seedMeili() {
  const env = process.env;
  const conn = await createConnection({
    host: env.BDB_HOST,
    port: Number(env.BDB_PORT),
    user: env.BDB_USER,
    password: env.BDB_PASSWORD,
    database: env.BDB_DATABASE,
    allowPublicKeyRetrieval: true,
    bigIntAsNumber: true,
  });
  const verses: Row[] = await conn.query(`
      SELECT v.ID, v.Gurmukhi, v.GurmukhiUni, v.Translations, v.FirstLetterStr, v.MainLetters,
             v.FirstLetterEng, MIN(s.ShabadID) AS ShabadID, v.Transliterations, v.SourceID, v.WriterID
      FROM Verse v LEFT JOIN Shabad s ON v.ID = s.VerseID GROUP BY v.ID ORDER BY v.ID`);
  await conn.end();

  const client = new MeiliSearch({ host: env.MEILI_HOST!, apiKey: env.MEILI_API_KEY });
  await client.deleteIndexIfExists('verses');
  const index = client.index('verses');
  await client.createIndex('verses', { primaryKey: 'ID' }).waitTask();
  await index
    .updateSettings({
      searchableAttributes: [
        ...['Transliteration', 'ManualPhonetic', 'ConsonantSkeleton', 'Phonetic'],
        ...['FirstLetterStr', 'FirstLetterChar', 'FirstLetterEng', 'MainLetters'],
        ...['Translation_bdb', 'Translation_ms', 'Translation_ssk', 'Gurmukhi', 'GurmukhiUnicode'],
        ...['PhoneticPrimary', 'PhoneticSecondary'],
      ],
      filterableAttributes: ['Source', 'Writer', 'ID', 'FirstLetterStr'],
      rankingRules: ['words', 'typo', 'proximity', 'attributeRank', 'wordPosition', 'exactness'],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: { oneTypo: 3, twoTypos: 5 },
        disableOnAttributes: ['FirstLetterEng', 'ConsonantSkeleton', 'FirstLetterChar'],
      },
      pagination: { maxTotalHits: 1000 },
    })
    .waitTask();
  await index.addDocuments(verses.map(document)).waitTask();
}

if (require.main === module) void seedMeili();
