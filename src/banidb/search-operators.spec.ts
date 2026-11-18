import cases from './__fixtures__/search-operators.json';
import * as ops from './search-operators';

type Fn = (...args: string[]) => unknown;

describe('search operators', () => {
  // What api/lib/searchOperators.js returned for each input, recorded before
  // the port (angToQuery's unused `least` and `most` left out).
  it.each(cases.map((c) => [`${c.fn}(${c.args.join(', ')})`, c] as const))(
    '%s as before',
    (_, { fn, args, out }) => {
      expect((ops[fn as keyof typeof ops] as Fn)(...args)).toEqual(out);
    },
  );

  // A query of nothing but + or - crashed the old API (null.forEach); now it
  // just matches nothing in particular.
  it.each([
    ['firstLetterStartToQuery', ['+', '+,z'], 'v.FirstLetterStr LIKE ?'],
    ['firstLetterAnywhereToQuery', ['-', '-,z'], 'v.FirstLetterStr LIKE ?'],
    ['fullWordRomanizedToQuery', ['+'], 'v.FirstLetterEng LIKE ?'],
    ['fullWordGurmukhiToQuery', ['-'], 'v.Gurmukhi LIKE BINARY ?'],
    [
      'fullWordEnglishToQuery',
      ['+'],
      "json_extract(v.Translations, '$.en.bdb') LIKE ? COLLATE utf8mb4_general_ci",
    ],
    ['mainLettersToQuery', ['+'], 'v.MainLetters LIKE BINARY ?'],
  ])('%s of only an operator gives one condition', (fn, args, condition) => {
    const part = (ops[fn as keyof typeof ops] as Fn)(...args) as ops.QueryPart;
    expect(part.condition).toBe(condition);
    expect(part.parameters).toHaveLength(1);
  });

  it('describes an Ang range of only < or > with an empty OR (the caller treats it as no Ang)', () => {
    expect(ops.angToQuery('<5').q).toBe('v.PageNo < ? AND ()');
  });
});
