import geturl from '../utils';

describe('angs endpoint', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('angs/917');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('ang info', () => {
    expect(json.count).toBe(38);
    expect(json.navigation.next).toBe(918);
    expect(json.navigation.previous).toBe(916);
    expect(json.source.pageNo).toBe(917);
    expect(json.source.english).toBe('Sri Guru Granth Sahib Ji');
    expect(json.source.sourceId).toBe('G');
  });

  test('pages info', () => {
    const { page } = json;
    expect(page.length).toBe(38);
    expect(page.length).toBe(38);
    expect(page[7].verseId).toBe(39135);
    expect(page[7].verseId).toBe(39135);
    expect(page[7].shabadId).toBe(333375);
    expect(page[7].lineNo).toBe(4);
  });

  test('verses verse', () => {
    const verseObj = json.page[7].verse;

    expect(verseObj).toBeTruthy();
    expect(verseObj.unicode).toBe('ਏ ਮਨ ਮੇਰਿਆ ਤੂ ਸਦਾ ਰਹੁ ਹਰਿ ਨਾਲੇ ॥');
    expect(verseObj.gurmukhi).toBe('ey mn myirAw qU sdw rhu hir nwly ]');
  });

  test('verses larivaar', () => {
    const larivaarObj = json.page[7].larivaar;

    expect(larivaarObj).toBeTruthy();
    expect(larivaarObj.unicode).toBe('ਏਮਨਮੇਰਿਆਤੂਸਦਾਰਹੁਹਰਿਨਾਲੇ॥');
    expect(larivaarObj.gurmukhi).toBe('eymnmyirAwqUsdwrhuhirnwly]');
  });

  test('verses transliteration', () => {
    const translitObj = json.page[7].transliteration;

    expect(translitObj).toBeTruthy();
    expect(translitObj.en).toBe('e man meriaa too sadhaa rahu har naale ||');
    expect(translitObj.english).toBe('e man meriaa too sadhaa rahu har naale ||');
  });

  test('verses translation', () => {
    const translationObj = json.page[7].translation;

    expect(translationObj).toBeTruthy();
    expect(translationObj.en.bdb).toBe('O my mind, remain always with the Lord.');

    expect(translationObj.pu.ss.gurmukhi).toBeTruthy();
    expect(translationObj.pu.ss.gurmukhi.length).toBeGreaterThan(1);

    expect(translationObj.pu.ss.unicode).toBeTruthy();
    expect(translationObj.pu.ss.unicode.length).toBeGreaterThan(1);

    expect(translationObj.pu.ft.gurmukhi).toBeTruthy();
    expect(translationObj.pu.ft.gurmukhi.length).toBeGreaterThan(1);

    expect(translationObj.pu.ft.unicode).toBeTruthy();
    expect(translationObj.pu.ft.unicode.length).toBeGreaterThan(1);

    expect(translationObj.es.sn).toBeTruthy();
    expect(translationObj.es.sn.length).toBeGreaterThan(1);
  });

  test('verses visraam', () => {
    const visraamObj = json.page[7].visraam;

    expect(visraamObj).toBeTruthy();
    expect(visraamObj.sttm[0].p).toBe(2);
    expect(visraamObj.sttm[0].t).toBe('v');

    expect(visraamObj.igurbani[0].p).toBe(2);
    expect(visraamObj.igurbani[0].t).toBe('v');

    expect(visraamObj.sttm2[0].p).toBe(2);
    expect(visraamObj.sttm2[0].t).toBe('v');
  });

  test('verses writer', () => {
    const writerObj = json.page[7].writer;

    expect(writerObj).toBeTruthy();
    expect(writerObj.writerId).toBe(3);
    expect(writerObj.gurmukhi).toBe('mÚ 3');
    expect(writerObj.english).toBe('Guru Amar Daas Ji');
  });

  test('verses raag', () => {
    const raagObj = json.page[7].raag;

    expect(raagObj).toBeTruthy();
    expect(raagObj.raagId).toBe(22);
    expect(raagObj.gurmukhi).toBe('rwgu rwmklI');
    expect(raagObj.unicode).toBe('ਰਾਗੁ ਰਾਮਕਲੀ');
    expect(raagObj.english).toBe('Raag Raamkalee');
    expect(raagObj.raagWithPage).toBe('Raamkalee (876-974)');
  });
});

describe('angs Dasam endpoint', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('angs/2/D');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('ang info', () => {
    expect(json.count).toBe(91);
    expect(json.navigation.next).toBe(3);
    expect(json.navigation.previous).toBe(1);
    expect(json.source.pageNo).toBe(2);
    expect(json.source.english).toBe('Dasam Bani');
    expect(json.source.sourceId).toBe('D');
  });

  test('verses verse', () => {
    const verseObj = json.page[0].verse;

    expect(verseObj).toBeTruthy();
    expect(verseObj.gurmukhi).toBe('nmsqM Aloky ]');
  });
});
