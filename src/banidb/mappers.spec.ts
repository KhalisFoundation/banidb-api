import recorded from './__fixtures__/mappers.json';
import {
  getRaagExtended,
  getShabadInfo,
  getWriter,
  prepAKIndex,
  prepBanis,
  prepVerse,
} from './mappers';

// `recorded` holds sample rows and what api/lib/getJSON.js made of them.
const { base, range, noWriter } = recorded;
const copy = <T>(value: T): T => structuredClone(value);
// Same JSON text: same values and key order.
const same = (value: unknown, expected: unknown) =>
  expect(JSON.stringify(value)).toBe(JSON.stringify(expected));

describe('BaniDB mappers, as before', () => {
  it('maps a verse', () => same(prepVerse(copy(base)), recorded.prepVerse));
  it('adds writer, source and raag for search results', () =>
    same(prepVerse(copy(base), true, 0), recorded.prepVerseMeta));
  it('keeps only the line and translations for live search', () =>
    same(prepVerse(copy(base), true, 1), recorded.prepVerseLive));
  it('merges a range of lines into one', () =>
    same(prepVerse(copy(range)), recorded.prepVerseRange));
  it('keeps a missing visraam null and a broken one empty', () => {
    same(prepVerse({ ...copy(base), Visraam: null }), recorded.prepVerseNullVisraam);
    same(prepVerse({ ...copy(base), Visraam: '{x' }), recorded.prepVerseBadVisraam);
  });
  it('takes the writer from another line of the shabad', () => {
    same(getShabadInfo(copy(noWriter), [copy(noWriter), copy(base)]), recorded.shabadInfo);
    same(getWriter(copy(noWriter), [copy(noWriter)]), recorded.writerNone);
  });
  it('maps a bani in the list', () =>
    same(
      prepBanis({
        ID: 2,
        token: 'japji',
        gurmukhi: 'jpujI',
        gurmukhiUni: 'ਜਪੁਜੀ',
        transliterations: base.Transliterations,
        updated: '2020-01-01 00:00:00',
      }),
      recorded.prepBanis,
    ));
  it("parses a raag's JSON columns", () =>
    same(
      getRaagExtended({
        RaagID: 1,
        SourceInfo: '[{"SourceID":"G"}]',
        Sargun: 'null',
        WritersGuru: '[1]',
        WritersBhagat: null,
        Writers: '[]',
      }),
      recorded.raag,
    ));
});

// The old API answered 500 for the whole response when one of these was broken.
describe('BaniDB mappers, broken rows', () => {
  it('maps a verse whose translations and transliterations are missing or not JSON', () => {
    const verse = prepVerse({ ...copy(base), Translations: null, Transliterations: '{oops' });
    expect(verse.translation).toEqual({ en: {}, pu: {}, es: {}, hi: {} });
    expect(verse.transliteration).toEqual({});
  });

  it('maps a raag whose JSON columns are broken or missing', () => {
    const raag = getRaagExtended({ RaagID: 2, SourceInfo: '', Sargun: '{x' });
    expect(raag).toMatchObject({ SourceInfo: null, Sargun: null, Writers: null });
  });

  it('maps an Amrit Keertan row with broken JSON', () => {
    expect(
      prepAKIndex({ IndexID: 1, Translations: 'NULL', Transliterations: '{"en":"a"}' }),
    ).toEqual({
      IndexID: 1,
      Translations: null,
      Transliterations: { en: 'a' },
    });
  });
});
