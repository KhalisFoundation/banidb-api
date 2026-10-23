/**
 * Punjabi romanization normalisation for omni search.
 *
 * omni-controller builds the index's ManualPhonetic and ConsonantSkeleton
 * fields with these same two functions (its phonetic-helpers.js). Queries only
 * match when both sides normalise the same way, so keep the two copies identical.
 */

const normalizePunjabiRoman = text => {
  if (!text) return '';
  return (
    text
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
      .replace(/aa+/g, 'a') // naam → nam,  maagee → magee
      .replace(/ee+/g, 'i') // magee → magi, teerath → tirath
      .replace(/oo+/g, 'u') // soorat → surat
      .replace(/ii+/g, 'i') // lii → li
      .replace(/uu+/g, 'u')

      // ── 4. Vowel digraph collapse ─────────────────────────────────────────────
      // Map romanization variants to base vowels: a / i / u
      .replace(/ei/g, 'i') // mein → min  (ਮੈਂ)
      .replace(/ai/g, 'i') // main → min,  saTai → saTi
      .replace(/ae/g, 'i') // saibha(n) → sibhan
      .replace(/ay/g, 'i') // satay → sati
      .replace(/ey/g, 'i') // tey → ti  (ਤੇ)
      .replace(/ao/g, 'u')
      .replace(/au/g, 'u') // aukh → ukh  (ਔਖ),  tau → tu
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
      .replace(/ph/g, 'p') // phul → pul,  phir → pir
      .replace(/bh/g, 'b') // bhavsagar → bavsagar

      // ── 7. Nasal normalization ────────────────────────────────────────────────
      // ਂ (bindi) romanized as m, n, ng, nh, ṃ — collapse to 'n'
      .replace(/ng(?=[^aeiou]|$)/g, 'n') // sang → san
      .replace(/m(?=[^aeiou\s]|$)/g, 'n') // pre-consonant/terminal m → n
      .replace(/nh/g, 'n')

      // ── 8. Consonant variant normalization ───────────────────────────────────
      .replace(/w/g, 'v') // waheguru → vaheguru
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
      .trim()
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — CONSONANT SKELETON
// ─────────────────────────────────────────────────────────────────────────────
const toConsonantSkeleton = normalizedText =>
  normalizedText
    .split(' ')
    .map(word => {
      const stripped = word.replace(/[aeiou]/g, '');
      return stripped || word[0] || '';
    })
    .join(' ');

module.exports = { normalizePunjabiRoman, toConsonantSkeleton };
