import geturl from '../utils';

describe('rehats endpoint', () => {
  let status;
  let json;

  beforeAll(async () => {
    const results = await geturl('rehats/4');
    [status, json] = [results.status, results.json];
  });

  test('status', () => {
    expect(status).toBe(200);
  });

  test('rehats info', () => {
    const { chapters } = json;

    expect(json.count).toBe(2);
    expect(json.rehatID).toBe(4);

    expect(chapters[0].chapterID).toBe(38);
    expect(chapters[0].chapterName).toBe('A Few Controversial Points');
    expect(chapters[0].alphabet).toBe('english');

    expect(chapters[1].chapterID).toBe(39);
    expect(chapters[1].chapterName).toBe('Epilogue');
    expect(chapters[1].alphabet).toBe('english');
  });
});
