import { normalizePunjabiRoman, toConsonantSkeleton } from './phonetic';

// The examples in the rules' comments; omni-controller indexes with the same
// functions, so a change here must be made there too.
describe('normalizePunjabiRoman', () => {
  it.each([
    ['naam', 'nan'],
    ['waheguru', 'viguru'],
    ['mein', 'min'],
    ['tau', 'tu'],
    ['phir', 'pir'],
    ['bhavsagar', 'bavsagar'],
    ['dha(n)n', 'dhan'],
    ['Sat Naam ||', 'sat nam'],
    ['', ''],
  ])('%s → %s', (input, output) => {
    expect(normalizePunjabiRoman(input)).toBe(output);
  });
});

describe('toConsonantSkeleton', () => {
  it('drops the vowels of each word, keeping a word that is only vowels', () => {
    expect(toConsonantSkeleton('sat nan a')).toBe('st nn a');
  });
});
