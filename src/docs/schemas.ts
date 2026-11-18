import type {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// Response shapes for the OpenAPI document. Plain schema objects, not classes:
// the controllers return what the mappers build from database rows.

type Schema = SchemaObject | ReferenceObject;

export const ref = (name: string): ReferenceObject => ({ $ref: `#/components/schemas/${name}` });

const string: SchemaObject = { type: 'string' };
const integer: SchemaObject = { type: 'integer' };
const orNull = (schema: SchemaObject): SchemaObject => ({ ...schema, nullable: true });
const arrayOf = (items: Schema): SchemaObject => ({ type: 'array', items });
const mapOf = (values: Schema): SchemaObject => ({ type: 'object', additionalProperties: values });
const dateTime: SchemaObject = { type: 'string', example: '2024-01-31 18:30:00' };
const json: SchemaObject = { description: 'Any JSON value (null when empty).' };

// Every property is always present, except those named in `optional`.
const object = (properties: Record<string, Schema>, optional: string[] = []): SchemaObject => {
  const required = Object.keys(properties).filter((key) => !optional.includes(key));
  // OpenAPI 3.0 doesn't allow an empty `required`.
  return { type: 'object', properties, ...(required.length ? { required } : {}) };
};
const each = (names: string[], schema: Schema) =>
  Object.fromEntries(names.map((name) => [name, schema]));

const transliterationKeys = ['english', 'hindi', 'en', 'hi', 'ipa', 'ur'];
const gurmukhiAndUnicode = object({ gurmukhi: orNull(string), unicode: orNull(string) }, [
  'gurmukhi',
  'unicode',
]);

const verseProperties: Record<string, Schema> = {
  verseId: integer,
  shabadId: orNull(integer),
  verse: { ...gurmukhiAndUnicode, description: 'The line, in Gurmukhi (ASCII) and Unicode.' },
  larivaar: { ...gurmukhiAndUnicode, description: 'The line without spaces.' },
  translation: object({
    en: { ...mapOf(orNull(string)), description: 'By source: bdb, ms, ssk.' },
    pu: {
      ...mapOf(gurmukhiAndUnicode),
      description: 'By source: ss, ft, bdb, ms, … (and the Bhai Gurdas Vaaran: bvs, bvs_p).',
    },
    es: mapOf(orNull(string)),
    hi: mapOf(orNull(string)),
  }),
  transliteration: ref('Transliterations'),
  pageNo: orNull(integer),
  lineNo: orNull(integer),
  updated: orNull(dateTime),
  visraam: orNull({
    ...mapOf(arrayOf({ type: 'object' })),
    description: 'Pauses by source: `p` is the word they follow, `t` their kind.',
  }),
  writer: ref('Writer'),
  source: ref('Source'),
  raag: ref('Raag'),
};
// Live search leaves out everything after the translations; only search
// results and Angs carry writer, source and raag; bani lines have no shabadId.
const VERSE_OPTIONAL = [
  'shabadId',
  ...['transliteration', 'pageNo', 'lineNo', 'updated', 'visraam'],
  ...['writer', 'source', 'raag'],
];

export const schemas: Record<string, SchemaObject> = {
  Info: object({
    name: string,
    version: { type: 'string', example: '3.0.0' },
    documentation: string,
    'terms-of-service': string,
    'data-license': string,
    endpoint: { type: 'string', description: 'Which instance answered.' },
  }),
  Health: object({ ok: { type: 'boolean', enum: [true] } }),
  Error: object({
    error: { type: 'boolean', enum: [true] },
    data: object({ error: { type: 'string', description: 'What went wrong.' } }),
  }),

  Source: object({
    sourceId: orNull({ type: 'string', example: 'G' }),
    gurmukhi: orNull(string),
    unicode: orNull(string),
    english: orNull(string),
    pageNo: orNull(integer),
  }),
  Raag: object({
    raagId: orNull(integer),
    gurmukhi: orNull(string),
    unicode: orNull(string),
    english: orNull(string),
    raagWithPage: orNull(string),
  }),
  Writer: object({
    writerId: orNull(integer),
    gurmukhi: orNull(string),
    unicode: orNull(string),
    english: orNull(string),
  }),
  Transliterations: object(each(transliterationKeys, orNull(string)), transliterationKeys),
  Verse: object(verseProperties, VERSE_OPTIONAL),
  AmritKeertanVerse: {
    ...object(verseProperties, [...VERSE_OPTIONAL, 'verseId']),
    description: 'A line, as elsewhere but without its `verseId`.',
  },
  Navigation: object({
    previous: { ...orNull(integer), description: 'The one before, if any.' },
    next: { ...orNull(integer), description: 'The one after, if any.' },
  }),
  Shabad: object({
    shabadInfo: object({
      shabadId: integer,
      shabadName: { ...orNull(integer), description: 'The verse that names the shabad.' },
      pageNo: orNull(integer),
      source: ref('Source'),
      raag: ref('Raag'),
      writer: ref('Writer'),
    }),
    count: integer,
    navigation: { ...ref('Navigation'), description: 'Shabad IDs.' },
    verses: arrayOf(ref('Verse')),
  }),
  Shabads: object({
    shabadIds: arrayOf(integer),
    shabads: arrayOf(ref('Shabad')),
  }),
  ShabadOrShabads: { anyOf: [ref('Shabad'), ref('Shabads')] },
  Ang: object({
    source: ref('Source'),
    count: integer,
    navigation: ref('Navigation'),
    page: { ...arrayOf(ref('Verse')), description: 'The lines, each with writer and raag.' },
  }),
  Angs: object({ pageNos: arrayOf(integer), pages: arrayOf(ref('Ang')) }),
  AngOrAngs: { anyOf: [ref('Ang'), ref('Angs')] },
  SearchResults: object({
    resultsInfo: object({
      totalResults: integer,
      pageResults: integer,
      pages: object(
        {
          page: integer,
          resultsPerPage: integer,
          totalPages: integer,
          nextPage: {
            type: 'string',
            description: 'This request with the next `page`, when there is one.',
          },
        },
        ['nextPage'],
      ),
    }),
    verses: arrayOf(ref('Verse')),
  }),
  Hukamnama: object(
    {
      isLatest: { type: 'boolean', enum: [true], description: 'Only on the latest.' },
      date: object({ gregorian: object({ month: integer, date: integer, year: integer }) }),
      shabadIds: arrayOf(integer),
      shabads: { anyOf: [arrayOf(ref('Shabad')), { type: 'object', maxProperties: 0 }] },
    },
    ['isLatest'],
  ),
  RandomShabad: {
    anyOf: [ref('Shabad'), { type: 'object', maxProperties: 0 }],
    description: '`{}` when the shabad picked is unpublished.',
  },

  BaniSummary: object(
    {
      ID: integer,
      token: string,
      gurmukhi: string,
      gurmukhiUni: string,
      transliteration: { ...orNull(string), description: 'English.' },
      transliterations: ref('Transliterations'),
      updated: dateTime,
    },
    ['transliteration'],
  ),
  Bani: object({
    baniInfo: object(
      {
        baniID: integer,
        gurmukhi: orNull(string),
        unicode: orNull(string),
        ...each(transliterationKeys, orNull(string)),
        source: ref('Source'),
        raag: ref('Raag'),
        writer: ref('Writer'),
      },
      transliterationKeys,
    ),
    verses: arrayOf(
      object(
        {
          header: { ...integer, description: '1 for a heading line.' },
          mangalPosition: orNull({ type: 'string', enum: ['current', 'above', null] }),
          ...each(['existsSGPC', 'existsMedium', 'existsTaksal', 'existsBuddhaDal'], {
            ...orNull(integer),
            description: 'Whether the line is in that version (left out with `length`).',
          }),
          paragraph: integer,
          verse: ref('Verse'),
        },
        ['existsSGPC', 'existsMedium', 'existsTaksal', 'existsBuddhaDal'],
      ),
    ),
  }),

  AmritKeertanHeader: {
    ...object({
      HeaderID: integer,
      Gurmukhi: orNull(string),
      GurmukhiUni: orNull(string),
      Translations: json,
      Transliterations: json,
      Updated: dateTime,
    }),
    description: 'A section of the pothi.',
  },
  AmritKeertanHeaders: object({ headers: arrayOf(ref('AmritKeertanHeader')) }),
  AmritKeertanIndexLine: {
    ...object({
      IndexID: integer,
      HeaderID: integer,
      ShabadID: integer,
      PageNo: { ...orNull(integer), description: 'Page in the Amrit Keertan pothi.' },
      Gurmukhi: orNull(string),
      GurmukhiUni: orNull(string),
      Translations: json,
      Transliterations: json,
      Ang: { ...orNull(integer), description: 'Ang in its source.' },
      SourceID: orNull(string),
    }),
    additionalProperties: true,
    description:
      "A shabad's first line, as the tables hold it (Visraam, writer, raag and source columns too).",
  },
  AmritKeertanIndex: object(
    {
      header: arrayOf(ref('AmritKeertanHeader')),
      index: arrayOf(ref('AmritKeertanIndexLine')),
    },
    ['header'],
  ),
  AmritKeertanShabad: object({
    header: arrayOf(ref('AmritKeertanHeader')),
    verses: arrayOf(ref('AmritKeertanVerse')),
  }),

  KoshWord: object({ id: integer, word: orNull(string), wordUni: orNull(string) }),
  KoshEntry: object({
    id: integer,
    word: orNull(string),
    wordUni: orNull(string),
    definition: orNull(string),
    definitionUni: orNull(string),
  }),

  Rehats: object({
    count: integer,
    maryadas: arrayOf(object({ rehatID: integer, rehatName: string, alphabet: string })),
  }),
  RehatChapterList: object({
    count: integer,
    rehatID: orNull(integer),
    chapters: arrayOf(object({ chapterID: integer, chapterName: string, alphabet: string })),
  }),
  RehatChapters: object({
    count: integer,
    rehatID: orNull(integer),
    chapters: arrayOf(
      object({
        chapterID: integer,
        chapterName: string,
        chapterContent: orNull({ type: 'string', description: 'HTML.' }),
        alphabet: string,
      }),
    ),
  }),
  RehatSearch: object({
    count: integer,
    rows: arrayOf(
      object({
        chapterID: integer,
        chapterName: string,
        chapterContent: orNull(string),
        rehatID: integer,
        rehatName: string,
      }),
    ),
  }),

  Writers: object({
    rows: arrayOf(
      object({
        WriterID: integer,
        WriterEnglish: orNull(string),
        WriterGurmukhi: orNull(string),
        WriterUnicode: orNull(string),
      }),
    ),
  }),
  Raags: object({
    rows: arrayOf({
      ...object({
        RaagID: integer,
        RaagGurmukhi: orNull(string),
        RaagUnicode: orNull(string),
        RaagEnglish: orNull(string),
        RaagWithPage: orNull(string),
        SourceInfo: json,
        Sargun: json,
        WritersGuru: json,
        WritersBhagat: json,
        Writers: json,
      }),
      additionalProperties: true,
      description: "The raag's row (overview, time, season, … as text), its JSON columns parsed.",
    }),
  }),
  Sources: object({
    rows: arrayOf(
      object({
        UniqueID: integer,
        SourceID: { type: 'string', example: 'G' },
        SourceGurmukhi: orNull(string),
        SourceUnicode: orNull(string),
        SourceEnglish: orNull(string),
      }),
    ),
  }),

  GraphQLRequest: object(
    {
      query: { type: 'string', example: '{ shabad(id: 1) { count verses { verseId } } }' },
      variables: { type: 'object', nullable: true },
      operationName: orNull(string),
    },
    ['variables', 'operationName'],
  ),
  GraphQLResponse: object(
    {
      data: { type: 'object', nullable: true },
      errors: arrayOf(
        object(
          {
            message: string,
            locations: arrayOf(object({ line: integer, column: integer })),
            path: arrayOf({ oneOf: [string, integer] }),
          },
          ['locations', 'path'],
        ),
      ),
    },
    ['data', 'errors'],
  ),
};
