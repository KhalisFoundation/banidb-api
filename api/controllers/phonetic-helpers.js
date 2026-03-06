/* eslint-disable no-underscore-dangle */
const natural = require('natural');

const metaphone = new natural.DoubleMetaphone();

const preprocessGurbaniRoman = (text) =>
  text
    .toLowerCase()
    .trim()

    // ── Vowel normalization ──────────────────────────────
    // Long/doubled vowels → short
    .replace(/aa+/g, 'a') // naam → nam, saas → sas
    .replace(/ee+/g, 'i') // teerath → tirath
    .replace(/oo+/g, 'u') // soorat → surat
    .replace(/ii+/g, 'i')
    .replace(/uu+/g, 'u')

    // Schwa variations
    .replace(/ae/g, 'e') // vaegaa → vega
    .replace(/ai/g, 'e') // main → men
    .replace(/ao/g, 'o')
    .replace(/au/g, 'o') // aukh → okh

    // ── Consonant normalization ──────────────────────────
    // Retroflex/dental collapse (rr, tt, dd, nn, ll → single)
    .replace(/([tdrnl])\1+/g, '$1') // thakurr→thakur, maangee→mangi etc.

    // Hard aspirates: kh, gh, ch, jh, th, dh, ph, bh
    // Keep as-is — they carry meaning in Punjabi
    // BUT collapse doubled versions
    .replace(/([kgcjtdpb])h\1h/g, '$1h') // tthh → th

    // Nasalization marks often written as ng/n/m interchangeably
    .replace(/ng(?=[^aeiou])/g, 'n') // sang → san (before consonant)
    .replace(/(?<=[aeiou])m(?=[^aeiou])/g, 'n') // optional: treat trailing m/n as same

    // w / v interchangeable in Punjabi transliteration
    .replace(/w/g, 'v')

    // Common spelling variants
    .replace(/qu/g, 'k')
    .replace(/x/g, 'ks')

    // ── Strip punctuation/extra spaces ──────────────────
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const convertToPhonetic = (text) => {
  const primary = [];
  const secondary = [];

  preprocessGurbaniRoman(text)
    .split(' ')
    .forEach((word) => {
      const [p1, p2] = metaphone.process(word);

      if (p1) primary.push(p1);
      if (p2) secondary.push(p2);
    });

  return {
    PhoneticPrimary: primary.join(' '),
    PhoneticSecondary: secondary.join(' '),
  };
};

const phoneticBoost = (
  query,
  db,
  { streakWeight = 0.5, streakCap = 4, gapThreshold = 2, gapPenaltyFactor = 0.4 } = {},
) => {
  // ── Step 1: Greedy alignment ──────────────────────────────────
  const { matchedDbIndices } = query.split('').reduce(
    (acc, qChar) => {
      const matchIndex = db.indexOf(qChar, acc.dbPos);
      if (matchIndex === -1) return acc;
      return {
        dbPos: matchIndex + 1,
        matchedDbIndices: [...acc.matchedDbIndices, matchIndex],
      };
    },
    { dbPos: 0, matchedDbIndices: [] },
  );

  if (matchedDbIndices.length === 0) return 0.0;

  // ── Step 2: Score the alignment ───────────────────────────────
  const { rawScore } = matchedDbIndices.reduce(
    (acc, di, i) => {
      const baseScore = acc.rawScore + 1.0;

      if (i === 0) return { rawScore: baseScore, streak: 0 };

      const gap = di - matchedDbIndices[i - 1] - 1;

      if (gap === 0) {
        const newStreak = Math.min(acc.streak + 1, streakCap);
        return { rawScore: baseScore + streakWeight * newStreak, streak: newStreak };
      }

      if (gap <= gapThreshold) {
        return { rawScore: baseScore, streak: 0 };
      }

      const penalty = gapPenaltyFactor * Math.log(1 + gap - gapThreshold);
      return { rawScore: baseScore - penalty, streak: 0 };
    },
    { rawScore: 0.0, streak: 0 },
  );

  // ── Step 3: Compute ratios ────────────────────────────────────
  const matchedCount = matchedDbIndices.length;
  const normalizedRaw = rawScore / matchedCount;
  const globalCoverage = matchedCount / db.length;
  const queryUtilization = matchedCount / query.length;

  // ── Final boost ───────────────────────────────────────────────
  return normalizedRaw * globalCoverage * queryUtilization;
};

const searchRank = (phoneticQuery, results) => {
  const [manualResults, phoneticResults, firstLettersResults] = results;

  const combinedResults = new Map();

  manualResults.hits.forEach((result) => {
    if (!combinedResults.has(result.ID)) {
      combinedResults.set(result.ID, result);
    }
  });

  phoneticResults.hits.forEach((result) => {
    const boost = phoneticBoost(phoneticQuery.replace(' ', ''), result.Phonetic);
    if (!combinedResults.has(result.ID)) {
      combinedResults.set(result.ID, {
        ...result,
        _rankingScore: result._rankingScore + boost,
      });
    } else {
      const existingResult = combinedResults.get(result.ID);
      combinedResults.set(result.ID, {
        ...result,
        _rankingScore: existingResult._rankingScore + result._rankingScore + boost,
      });
    }
  });

  firstLettersResults.hits.forEach((result) => {
    if (!combinedResults.has(result.ID)) {
      combinedResults.set(result.ID, result);
    } else {
      const existingResult = combinedResults.get(result.ID);
      combinedResults.set(result.ID, {
        ...result,
        _rankingScore: existingResult._rankingScore + result._rankingScore,
      });
    }
  });

  return Array.from(combinedResults.values()).sort((a, b) => b._rankingScore - a._rankingScore);
};

module.exports = {
  preprocessGurbaniRoman,
  convertToPhonetic,
  phoneticBoost,
  searchRank,
};
