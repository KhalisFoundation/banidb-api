import { isListOfNumbers, isRangeOfNumbers, parseDateTime, str } from './input';

describe('isListOfNumbers', () => {
  it.each(['1', '123', '1,2,3', '1+2+3', '1,2+3'])('accepts %s', (value) => {
    expect(isListOfNumbers(value)).toBe(true);
  });
  it.each(['', 'abc', '1,', ',1', '1,,2', '1-2', '-1', '1.5', ' 1', 1, null, ['1']])(
    'rejects %p',
    (value) => {
      expect(isListOfNumbers(value)).toBe(false);
    },
  );
});

describe('isRangeOfNumbers', () => {
  it.each(['1', '1-3', '1+5+9', '<5', '>1400', '<1000+105+900-905'])('accepts %s', (value) => {
    expect(isRangeOfNumbers(value)).toBe(true);
  });
  it.each(['', 'abc', '1-', '5+', '1--3', '<>5', 1, undefined])('rejects %p', (value) => {
    expect(isRangeOfNumbers(value)).toBe(false);
  });
});

describe('parseDateTime', () => {
  it.each([
    '2024-01-01',
    '2024-02-29',
    '2024-02-29 23:59:59',
    '2024-01-01 00:00:00.123456',
    '99-01-01',
  ])('accepts %s as it is', (value) => {
    expect(parseDateTime(value)).toBe(value);
  });

  it.each([
    undefined,
    ['2024-01-01'],
    '',
    'garbage',
    '2023-02-29',
    '2024-02-30',
    '2024-13-01',
    '2024-00-10',
    '2024-01-00',
    '2024-01-32',
    '2024-01-01 24:00:00',
    '2024-01-01T10:20:30',
    `2024-01-01'; DROP TABLE Verse; --`,
  ])('rejects %p', (value) => {
    expect(parseDateTime(value)).toBeNull();
  });
});

describe('str', () => {
  it('passes strings and drops arrays and objects', () => {
    expect(str('G')).toBe('G');
    expect(str(['G'])).toBeUndefined();
    expect(str({ a: 'b' })).toBeUndefined();
  });
});
