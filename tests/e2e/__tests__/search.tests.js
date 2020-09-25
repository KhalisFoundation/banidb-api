import geturl from '../utils';

describe('search endpoint', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('search/gmss');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('resultsInfo', () => {
    const { resultsInfo } = json;
    expect(resultsInfo.totalResults).toBe(5);
    expect(resultsInfo.pageResults).toBe(5);
    expect(resultsInfo.pages.page).toBe(1);
    expect(resultsInfo.pages.resultsPerPage).toBe(20);
    expect(resultsInfo.pages.totalPages).toBe(1);
  });

  test('verses', () => {
    const { verses } = json;

    expect(verses.length).toBe(5);

    expect(verses[0].verseId).toBe(18009);
    expect(verses[0].shabadId).toBe(1528);
    expect(verses[0].pageNo).toBe(394);
    expect(verses[0].lineNo).toBe(3);

    expect(verses[1].verseId).toBe(25223);
    expect(verses[1].shabadId).toBe(2184);
    expect(verses[1].pageNo).toBe(576);
    expect(verses[1].lineNo).toBe(18);

    expect(verses[2].verseId).toBe(56208);
    expect(verses[2].shabadId).toBe(4802);
    expect(verses[2].pageNo).toBe(1318);
    expect(verses[2].lineNo).toBe(4);

    expect(verses[3].verseId).toBe(202792);
    expect(verses[3].shabadId).toBe(40336);
    expect(verses[3].pageNo).toBe(14);
    expect(verses[3].lineNo).toBe(20);

    expect(verses[4].verseId).toBe(205198);
    expect(verses[4].shabadId).toBe(40639);
    expect(verses[4].pageNo).toBe(28);
    expect(verses[4].lineNo).toBe(10);
  });
});

describe('search endpoint - short', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('search/jh');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toEqual(200);
  });

  test('resultsInfo', () => {
    const { resultsInfo } = json;
    expect(resultsInfo.totalResults).toBe(467);
    expect(resultsInfo.pageResults).toBe(20);
    expect(resultsInfo.pages.page).toBe(1);
    expect(resultsInfo.pages.resultsPerPage).toBe(20);
    expect(resultsInfo.pages.totalPages).toBe(24);
    expect(resultsInfo.pages.nextPage).toMatch('?page=2');
  });

  test('verses', () => {
    const { verses } = json;

    expect(verses.length).toBe(20);

    expect(verses[0].verseId).toBe(74451);
    expect(verses[0].shabadId).toBe(7406);
    expect(verses[0].pageNo).toBe(4);
    expect(verses[0].lineNo).toBe(74451);
  });
});

describe('search endpoint - single', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('search/nnbqkhh');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toEqual(200);
  });

  test('resultsInfo', () => {
    const { resultsInfo } = json;
    expect(resultsInfo.totalResults).toBe(1);
    expect(resultsInfo.pageResults).toBe(1);
    expect(resultsInfo.pages.page).toBe(1);
    expect(resultsInfo.pages.totalPages).toBe(1);
  });

  test('verses', () => {
    const { verses } = json;

    expect(verses.length).toBe(1);

    expect(verses[0].verseId).toBe(22188);
    expect(verses[0].shabadId).toBe(1839);
    expect(verses[0].pageNo).toBe(496);
    expect(verses[0].lineNo).toBe(5);
  });

  test('verses verse', () => {
    const verseObj = json.verses[0].verse;

    expect(verseObj).toBeTruthy();
    expect(verseObj.unicode).toBe('ਨਿਮਖ ਨ ਬਿਸਰਉ ਤੁਮੑ ਕਉ ਹਰਿ ਹਰਿ ਸਦਾ ਭਜਹੁ ਜਗਦੀਸ ॥੧॥ ਰਹਾਉ ॥');
    expect(verseObj.gurmukhi).toBe('inmK n ibsrau qum@ kau hir hir sdw Bjhu jgdIs ]1] rhwau ]');
  });

  test('verses larivaar', () => {
    const larivaarObj = json.verses[0].larivaar;

    expect(larivaarObj).toBeTruthy();
    expect(larivaarObj.unicode).toBe('ਨਿਮਖਨਬਿਸਰਉਤੁਮੑਕਉਹਰਿਹਰਿਸਦਾਭਜਹੁਜਗਦੀਸ॥੧॥ਰਹਾਉ॥');
    expect(larivaarObj.gurmukhi).toBe('inmKnibsrauqum@kauhirhirsdwBjhujgdIs]1]rhwau]');
  });

  test('verses transliteration', () => {
    const translitObj = json.verses[0].transliteration;

    expect(translitObj).toBeTruthy();
    expect(translitObj.en).toBe(
      'nimakh na bisarau tum(h) kau har har sadhaa bhajahu jagadhees ||1|| rahaau ||',
    );
    expect(translitObj.english).toBe(
      'nimakh na bisarau tum(h) kau har har sadhaa bhajahu jagadhees ||1|| rahaau ||',
    );
  });

  test('verses translation', () => {
    const translationObj = json.verses[0].translation;

    expect(translationObj).toBeTruthy();
    expect(translationObj.en.bdb).toBe(
      'that you may never forget the Lord, Har, Har, even for an instant. May you ever vibrate upon the Lord of the Universe. ||1||Pause||',
    );
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
    const visraamObj = json.verses[0].visraam;

    expect(visraamObj).toBeTruthy();
    expect(visraamObj.sttm[0].p).toBe(6);
    expect(visraamObj.sttm[0].t).toBe('v');

    expect(visraamObj.igurbani[0].p).toBe(6);
    expect(visraamObj.igurbani[0].t).toBe('v');

    expect(visraamObj.sttm2[0].p).toBe(6);
    expect(visraamObj.sttm2[0].t).toBe('v');
  });

  test('verses writer', () => {
    const writerObj = json.verses[0].writer;

    expect(writerObj).toBeTruthy();
    expect(writerObj.writerId).toBe(5);
    expect(writerObj.gurmukhi).toBe('mÚ 5');
    expect(writerObj.english).toBe('Guru Arjan Dev Ji');
  });

  test('verses source', () => {
    const sourceObj = json.verses[0].source;

    expect(sourceObj).toBeTruthy();
    expect(sourceObj.sourceId).toBe('G');
    expect(sourceObj.gurmukhi).toBe('sRI gurU gRMQ swihb jI');
    expect(sourceObj.unicode).toBe('ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ');
    expect(sourceObj.english).toBe('Sri Guru Granth Sahib Ji');
    expect(sourceObj.pageNo).toBe(496);
  });

  test('verses raag', () => {
    const raagObj = json.verses[0].raag;

    expect(raagObj).toBeTruthy();
    expect(raagObj.raagId).toBe(9);
    expect(raagObj.gurmukhi).toBe('rwgu gUjrI');
    expect(raagObj.unicode).toBe('ਰਾਗੁ ਗੂਜਰੀ');
    expect(raagObj.english).toBe('Raag Gujri');
    expect(raagObj.raagWithPage).toBe('Gujri (489-526)');
  });
});

describe('search endpoint - random', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('random');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('shabadInfo', () => {
    expect(json.shabadInfo).toBeTruthy();
    expect(json.shabadInfo.shabadId).toBeGreaterThan(0);
  });
});

describe('search endpoint - operators', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('search/hj*r');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('shabadInfo', () => {
    expect(json.resultsInfo).toBeTruthy();
    expect(json.resultsInfo.totalResults).toBe(90);
  });
});
