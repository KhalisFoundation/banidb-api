import geturl from '../utils';

describe('bani endpoint', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('banis/3');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('baniInfo', () => {
    const { baniInfo } = json;

    expect(baniInfo.baniID).toBe(3);
    expect(baniInfo.gurmukhi).toBe('Sbd hzwry');
    expect(baniInfo.unicode).toBe('ਸ਼ਬਦ ਹਜ਼ਾਰੇ');
    expect(baniInfo.english).toBe('shabadh hazaare');
    expect(baniInfo.en).toBe('shabadh hazaare');
  });

  test('verses verse', () => {
    const verseObj = json.verses[3].verse;

    expect(verseObj).toBeTruthy();
    expect(json.verses[3].paragraph).toBe(3);
    expect(verseObj.verseId).toBe(400);
    expect(verseObj.pageNo).toBe(96);
    expect(verseObj.lineNo).toBe(15);
  });

  test('verses larivaar', () => {
    const larivaarObj = json.verses[3].verse.larivaar;

    expect(larivaarObj).toBeTruthy();
    expect(larivaarObj.unicode).toBe('ਬਿਲਪਕਰੇਚਾਤ੍ਰਿਕਕੀਨਿਆਈ॥');
    expect(larivaarObj.gurmukhi).toBe('iblpkrycwiqRkkIinAweI]');
  });

  test('verses transliteration', () => {
    const translitObj = json.verses[3].verse.transliteration;

    expect(translitObj).toBeTruthy();
    expect(translitObj.en).toBe('bilap kare chaatirak kee niaaiee ||');
    expect(translitObj.english).toBe('bilap kare chaatirak kee niaaiee ||');
  });

  test('verses translation', () => {
    const translationObj = json.verses[3].verse.translation;

    expect(translationObj).toBeTruthy();
    expect(translationObj.en.bdb).toBe('It cries out like the thirsty song-bird.');

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
    const visraamObj = json.verses[3].verse.visraam;

    expect(visraamObj).toBeTruthy();
    expect(visraamObj.sttm[0].p).toBe(1);
    expect(visraamObj.sttm[0].t).toBe('v');

    expect(visraamObj.igurbani[0].p).toBe(1);
    expect(visraamObj.igurbani[0].t).toBe('v');

    expect(visraamObj.sttm2[0].p).toBe(1);
    expect(visraamObj.sttm2[0].t).toBe('v');
  });
});
