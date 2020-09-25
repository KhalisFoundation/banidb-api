import geturl from '../utils';

describe('shabads endpoint', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('shabads/1');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('shabadInfo.shabadId', () => {
    const { shabadInfo } = json;

    expect(shabadInfo.shabadId).toBe(1);
    expect(shabadInfo.source.sourceId).toBe('G');
    expect(shabadInfo.source.gurmukhi).toBe('sRI gurU gRMQ swihb jI');
    expect(shabadInfo.source.english).toBe('Sri Guru Granth Sahib Ji');
    expect(shabadInfo.source.pageNo).toBe(1);
    expect(shabadInfo.raag.raagId).toBe(1);
    expect(shabadInfo.raag.gurmukhi).toBe('jp');
    expect(shabadInfo.writer.writerId).toBe(1);
    expect(shabadInfo.writer.english).toBe('Guru Nanak Dev Ji');
  });

  test('navigagtion', () => {
    expect(json.navigation.next).toBe(2);
    expect(json.navigation.previous).toBeNull();
  });

  test('verses length', () => {
    const versesLength = json.verses.length;

    expect(versesLength).toBe(10);
    expect(json.count).toBe(versesLength);
  });

  test('verses verse', () => {
    const verseObj = json.verses[2].verse;

    expect(verseObj).toBeTruthy();
    expect(verseObj.unicode).toBe('ਆਦਿ ਸਚੁ ਜੁਗਾਦਿ ਸਚੁ ॥');
    expect(verseObj.gurmukhi).toBe('Awid scu jugwid scu ]');
  });

  test('verses larivaar', () => {
    const larivaarObj = json.verses[2].larivaar;

    expect(larivaarObj).toBeTruthy();
    expect(larivaarObj.unicode).toBe('ਆਦਿਸਚੁਜੁਗਾਦਿਸਚੁ॥');
    expect(larivaarObj.gurmukhi).toBe('Awidscujugwidscu]');
  });

  test('verses transliteration', () => {
    const translitObj = json.verses[2].transliteration;

    expect(translitObj).toBeTruthy();
    expect(translitObj.en).toBe('aadh sach jugaadh sach ||');
    expect(translitObj.english).toBe('aadh sach jugaadh sach ||');
  });

  test('verses translation', () => {
    const translationObj = json.verses[2].translation;

    expect(translationObj).toBeTruthy();
    expect(translationObj.en.bdb).toBe('True In The Primal Beginning. True Throughout The Ages.');
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
    const visraamObj = json.verses[2].visraam;

    expect(visraamObj).toBeTruthy();
    expect(visraamObj.sttm[0].p).toBe(1);
    expect(visraamObj.sttm[0].t).toBe('v');

    expect(visraamObj.igurbani[0].p).toBe(1);
    expect(visraamObj.igurbani[0].t).toBe('v');

    expect(visraamObj.sttm2[0].p).toBe(1);
    expect(visraamObj.sttm2[0].t).toBe('v');
  });
});

describe('shabads endpoint - dasam bani', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('shabads/7426');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('shabadInfo.shabadId', () => {
    const { shabadInfo } = json;

    expect(shabadInfo.shabadId).toBe(7426);
    expect(shabadInfo.shabadName).toBe(75111);
    expect(shabadInfo.source.sourceId).toBe('D');
    expect(shabadInfo.source.gurmukhi).toBe('dsm bwxI');
    expect(shabadInfo.source.english).toBe('Dasam Bani');
    expect(shabadInfo.source.pageNo).toBe(12);
    expect(shabadInfo.raag.raagId).toBe(49);
    expect(shabadInfo.writer.writerId).toBe(47);
    expect(shabadInfo.writer.english).toBe('Guru Gobind Singh Ji');
  });
});
