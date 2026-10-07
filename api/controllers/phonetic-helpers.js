/* eslint-disable no-underscore-dangle */

/**
 * phonetic-helpers.js — Punjabi romanization search helpers
 *
 * Three-layer approach:
 *   Layer 1 — normalizePunjabiRoman():  colloquial ↔ academic bridging
 *   Layer 2 — toConsonantSkeleton():    vowel-stripped fallback for heavy variants
 *   Layer 3 — phraseScore():            Jaro-Winkler word similarity for re-ranking
 */

const natural = require('natural');

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — PUNJABI ROMANIZATION NORMALIZER
// ─────────────────────────────────────────────────────────────────────────────
const normalizePunjabiRoman = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()

    // ── 1. Strip non-alpha FIRST ──────────────────────────────────────────────
    // Transliterations contain ||, digits, parentheses — remove them before
    // any phonetic rules so they don't interfere with h-stripping or
    // vowel patterns.  E.g. "dha(n)n" → "dhann" → dedup → "dhan"
    .replace(/[^a-z\s]/g, '')

    // ── 2. H-stripping (BEFORE vowel collapse) ───────────────────────────────
    //
    // This MUST happen before vowel digraph collapse. 
    //
    // Academic transliteration uses 'h' as:
    //   a) aspirate marker:  kh, gh, th, dh, ph, bh, chh
    //   b) syllable separator: mahagee (h between vowels)
    //   c) vowel lengthener:  naahu → nau
    //
    // Strip h between two vowels (case b):
    .replace(/([aeiou])h([aeiou])/g, '$1$2')
    // Strip h after vowel before consonant or end (case c):
    .replace(/([aeiou])h(?=[^aeiou]|$)/g, '$1')

    // ── 3. Long / repeated vowels → short ────────────────────────────────────
    // After h-stripping, new doubles may appear: mahagee → maagee → here → magee
    .replace(/aa+/g, 'a')         // naam → nam,  maagee → magee
    .replace(/ee+/g, 'i')         // magee → magi, teerath → tirath
    .replace(/oo+/g, 'u')         // soorat → surat
    .replace(/ii+/g, 'i')         // lii → li
    .replace(/uu+/g, 'u')

    // ── 4. Vowel digraph collapse ─────────────────────────────────────────────
    // Map romanization variants to base vowels: a / i / u
    .replace(/ei/g, 'i')          // mein → min  (ਮੈਂ)
    .replace(/ai/g, 'i')          // main → min,  saTai → saTi
    .replace(/ae/g, 'i')          // saibha(n) → sibhan
    .replace(/ay/g, 'i')          // satay → sati
    .replace(/ey/g, 'i')          // tey → ti  (ਤੇ)
    .replace(/ao/g, 'u')
    .replace(/au/g, 'u')          // aukh → ukh  (ਔਖ),  tau → tu
    .replace(/aw/g, 'u')
    .replace(/oa/g, 'u')
    .replace(/oe/g, 'u')
    .replace(/ou/g, 'u')

    // ── 5. Collapse standalone o → u ──────────────────────────────────────────
    // In Gurmukhi romanization, ੋ (hora, "o") and ੁ/ੂ (aunkar/dulainkar, "u")
    // are distinct vowels, but colloquial writers interchange them freely.
    // E.g. "toh" → "to" after h-strip, but "tau" → "tu" after digraph collapse.
    // Without this rule they'd stay divergent.
    .replace(/o/g, 'u')

    // ── 6. Aspirate simplification ────────────────────────────────────────────
    // ph / bh are almost universally collapsed in colloquial writing.
    // kh / gh / th / dh are more distinctive — kept for now.
    .replace(/ph/g, 'p')          // phul → pul,  phir → pir
    .replace(/bh/g, 'b')          // bhavsagar → bavsagar

    // ── 7. Nasal normalization ────────────────────────────────────────────────
    // ਂ (bindi) romanized as m, n, ng, nh, ṃ — collapse to 'n'
    .replace(/ng(?=[^aeiou]|$)/g, 'n')  // sang → san
    .replace(/m(?=[^aeiou\s]|$)/g, 'n') // pre-consonant/terminal m → n
    .replace(/nh/g, 'n')

    // ── 8. Consonant variant normalization ───────────────────────────────────
    .replace(/w/g, 'v')           // waheguru → vaheguru
    .replace(/z/g, 's')
    .replace(/qu/g, 'k')
    .replace(/x/g, 'ks')

    // ── 9. Y normalization ────────────────────────────────────────────────────
    .replace(/y(?=[aeiou])/g, '') // yaar → ar
    .replace(/([aeiou])y/g, '$1i') // layi → laii

    // ── 10. Dedup repeated characters (catches doubles from all transforms) ──
    .replace(/([a-z])\1+/g, '$1')

    // ── 11. Final whitespace cleanup ──────────────────────────────────────────
    .replace(/\s+/g, ' ')
    .trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — CONSONANT SKELETON
// ─────────────────────────────────────────────────────────────────────────────
const toConsonantSkeleton = (normalizedText) =>
  normalizedText
    .split(' ')
    .map((word) => {
      const stripped = word.replace(/[aeiou]/g, '');
      return stripped || word[0] || '';
    })
    .join(' ');

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3 — PHRASE-LEVEL JARO-WINKLER RE-RANKING
// ─────────────────────────────────────────────────────────────────────────────
const jaroWinkler = (s1, s2) =>
  natural.JaroWinklerDistance(s1, s2, { ignoreCase: true });

/**
 * Score how well `queryNorm` (normalized user query) matches `docNorm`
 * (normalized stored ManualPhonetic field).
 *
 * Returns 0.0 – 1.0
 */
const phraseScore = (queryNorm, docNorm) => {
  if (!queryNorm || !docNorm) return 0;

  const qWords = queryNorm.split(' ').filter(Boolean);
  const dWords = docNorm.split(' ').filter(Boolean);

  if (qWords.length === 0 || dWords.length === 0) return 0;

  let totalSim = 0;
  let matchedCount = 0;
  const usedDocIndices = new Set();

  for (const qWord of qWords) {
    let bestSim = 0;
    let bestIdx = -1;

    for (let i = 0; i < dWords.length; i++) {
      if (usedDocIndices.has(i)) continue;
      const sim = jaroWinkler(qWord, dWords[i]);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    // FIX: Lowered threshold from 0.72 to 0.65
    // Old threshold rejected valid matches on short words:
    //   JW("to","tu") = 0.70 → was rejected, causing coverage to tank
    // Short normalized Punjabi words (2-3 chars) naturally produce
    // lower JW scores even for genuine matches.
    if (bestSim >= 0.65) {
      totalSim += bestSim;
      matchedCount++;
      if (bestIdx >= 0) usedDocIndices.add(bestIdx);
    }
  }

  if (matchedCount === 0) return 0;

  const avgSim = totalSim / matchedCount;
  const coverage = matchedCount / qWords.length;

  return avgSim * coverage;
};

// ─────────────────────────────────────────────────────────────────────────────
// INDEX-TIME FIELD GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
const generatePhoneticFields = (transliteration) => {
  if (!transliteration) {
    return {
      ManualPhonetic: '',
      ConsonantSkeleton: '',
      PhoneticPrimary: '',
      PhoneticSecondary: '',
      Phonetic: '',
    };
  }

  const normalized = normalizePunjabiRoman(transliteration);
  const skeleton = toConsonantSkeleton(normalized);

  return {
    ManualPhonetic: normalized,
    ConsonantSkeleton: skeleton,
    PhoneticPrimary: normalized,
    PhoneticSecondary: skeleton,
    Phonetic: normalized.replace(/\s+/g, ''),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH RESULT MERGING & RE-RANKING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string}   userQuery     Raw user query (un-normalized)
 * @param {object[]} meiliResults  Array of Meili result sets from multiSearch
 *   Expects: [manualResults, skeletonResults, firstLetterResults]
 * @returns {object[]} Merged and re-ranked hit array
 */
const searchRank = (userQuery, meiliResults) => {
  const [manualResults, skeletonResults, firstLetterResults] = meiliResults;

  const userNorm = normalizePunjabiRoman(userQuery);

  const combinedResults = new Map();

  const upsert = (result, baseScore) => {
    const docNorm = result.ManualPhonetic || '';
    const sim = phraseScore(userNorm, docNorm);

    // sim=1.0 → 3× boost,  sim=0.5 → 2× boost,  sim=0 → 1× (no change)
    const boosted = baseScore * (1 + sim * 2);

    if (!combinedResults.has(result.ID)) {
      combinedResults.set(result.ID, {
        ...result,
        _rankingScore: boosted,
        _simScore: sim,
      });
    } else {
      const existing = combinedResults.get(result.ID);
      combinedResults.set(result.ID, {
        ...existing,
        _rankingScore: existing._rankingScore + boosted,
        _simScore: Math.max(existing._simScore, sim),
      });
    }
  };

  // Search 1: Normalized romanization (highest weight)
  if (manualResults?.hits) {
    manualResults.hits.forEach((r) => upsert(r, r._rankingScore));
  }

  // Search 2: Consonant skeleton (slight downweight)
  if (skeletonResults?.hits) {
    skeletonResults.hits.forEach((r) => upsert(r, r._rankingScore * 0.7));
  }

  // Search 3: FirstLetterEng fallback
  // These results don't have ManualPhonetic, so JW sim will be 0 and
  // boosted = baseScore * 1.  That's fine — they're a low-priority fallback.
  if (firstLetterResults?.hits) {
    firstLetterResults.hits.forEach((r) => upsert(r, r._rankingScore * 0.4));
  }

  return Array.from(combinedResults.values()).sort(
    (a, b) => b._rankingScore - a._rankingScore,
  );
};

module.exports = {
  normalizePunjabiRoman,
  toConsonantSkeleton,
  generatePhoneticFields,
  phraseScore,
  searchRank,
  // Backward-compatible aliases
  preprocessGurbaniRoman: normalizePunjabiRoman,
  convertToPhonetic: generatePhoneticFields,
};
