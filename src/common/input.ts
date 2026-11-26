// Checks on values from the URL, as the old API made them.

// 123, or 123,456,… or 123+456+…
const LIST_OF_NUMBERS = /^(([0-9]+)([,+](?=[0-9]))?)+$/;

// 123, 123+456, 123-130, <100, >1400, or a mix (see angToQuery)
const RANGE_OF_NUMBERS = /^[<>]?(([0-9]+)([+-](?=[0-9]))?)+$/;

// A MariaDB date or date and time, as the old API accepted it.
const DATETIME =
  /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9])(?:( [0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?(.[0-9]{1,6})?$/;

export const isListOfNumbers = (value: unknown): value is string =>
  typeof value === 'string' && LIST_OF_NUMBERS.test(value);

export const isRangeOfNumbers = (value: unknown): value is string =>
  typeof value === 'string' && RANGE_OF_NUMBERS.test(value);

// The value if it's a date the database can compare with, else null. Beyond
// the old pattern, the date must exist (no month 13 or 31 February): MariaDB
// quietly compared those, MySQL fails the query.
export function parseDateTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = DATETIME.exec(value);
  if (!match) return null;
  const [, year, month, day, hours = '0'] = match;
  const days = new Date(Date.UTC(2000, +month, 0)).getUTCDate(); // in that month of a leap year
  const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const fullYear = year.length === 4 ? +year : 2000 + +year;
  const valid =
    +month >= 1 &&
    +month <= 12 &&
    +day >= 1 &&
    +day <= days &&
    !(+month === 2 && +day === 29 && !leap(fullYear)) &&
    Number(hours) <= 23;
  return valid ? value : null;
}

// parseInt(value, 10), as the old API read numbers from the URL (NaN included).
export const int = (value: unknown) => Number.parseInt(String(value), 10);

// A query parameter as a string; arrays and objects (`?a[]=1`) count as absent.
export const str = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;
