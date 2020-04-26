import geturl from '../utils';

describe('kosh endpoint -', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('kosh/m');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('results', () => {
    expect(json.length).toBeGreaterThan(1);
    expect(json[0].id).toBe(54132);
    expect(json[0].word).toBe('m');
    expect(json[0].wordUni).toBe('ਮ');
  });
});

describe('kosh words endpoint -', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('kosh/word/qaupir');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('results', () => {
    expect(json.length).toBe(1);

    expect(json[0].id).toBe(32097);

    expect(json[0].word).toBe('qaupir');
    expect(json[0].wordUni).toBe('ਤਉਪਰਿ');

    expect(json[0].definition).toBeTruthy();
    expect(json[0].definition.length).toBeGreaterThan(1);

    expect(json[0].definitionUni).toBeTruthy();
    expect(json[0].definitionUni.length).toBeGreaterThan(1);
  });
});
