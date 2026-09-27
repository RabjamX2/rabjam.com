// Wylie Transliteration Converter for Tibetan Script

export const WYLIE_CONSONANTS = {
  'ཀ': 'k', 'ཁ': 'kh', 'ག': 'g', 'ང': 'ng',
  'ཅ': 'c', 'ཆ': 'ch', 'ཇ': 'j', 'ཉ': 'ny',
  'ཏ': 't', 'ཐ': 'th', 'ད': 'd', 'ན': 'n',
  'པ': 'p', 'ཕ': 'ph', 'བ': 'b', 'མ': 'm',
  'ཙ': 'ts', 'ཚ': 'tsh', 'ཛ': 'dz', 'ཝ': 'w',
  'ཞ': 'zh', 'ཟ': 'z', 'འ': "'", 'ཡ': 'y',
  'ར': 'r', 'ལ': 'l', 'ཤ': 'sh', 'ས': 's',
  'ཧ': 'h', 'ཨ': 'a',
  'ཊ': 'T', 'ཋ': 'Th', 'ཌ': 'D', 'ཎ': 'N', 'ཥ': 'Sh',
  'ཁ༹': 'kh', 'ག༹': 'g', 'ཕ༹': 'ph', 'བ༹': 'b',
  'གྷ': 'g+h', 'ཛྷ': 'dz+h', 'ཌྷ': 'D+h', 'དྷ': 'd+h', 'བྷ': 'b+h',
  'ཀྵ': 'k+Sh'
};

export const WYLIE_VOWELS = {
  'ི': 'i', 'ུ': 'u', 'ེ': 'e', 'ོ': 'o'
};

export const WYLIE_SUBSCRIPTS = {
  'ྱ': 'y', 'ྲ': 'r', 'ླ': 'l', 'ྭ': 'w'
};

/**
 * Converts a parsed syllable state object into Wylie transliteration
 */
export function syllableToWylie(state) {
  if (!state) return '';
  if (state.chars && state.chars.length === 0) return '';

  let wylie = '';

  // 1. Prefix
  if (state.prefix) {
    wylie += WYLIE_CONSONANTS[state.prefix] || state.prefix;
    // Add dot '.' between prefix ག་ and root ཡ་ (g.ya) to distinguish from གྱ (gya)
    if (state.prefix === 'ག' && state.root === 'ཡ') {
      wylie += '.';
    }
  }

  // 2. Superscript
  if (state.superscript) {
    wylie += WYLIE_CONSONANTS[state.superscript] || state.superscript;
  }

  // 3. Root
  if (state.root) {
    wylie += WYLIE_CONSONANTS[state.root] || state.root;
  }

  // 4. Subscript
  if (state.subscript) {
    wylie += WYLIE_SUBSCRIPTS[state.subscript] || WYLIE_CONSONANTS[state.subscript] || state.subscript;
  }

  // 5. Main Vowel (defaults to 'a' if no explicit vowel sign)
  if (state.vowel) {
    wylie += WYLIE_VOWELS[state.vowel] || state.vowel;
  } else if (state.root && state.root !== 'འ') {
    wylie += 'a';
  } else if (state.root === 'འ' && !state.prefix && !state.superscript && !state.subscript) {
    wylie += 'a';
  }

  // 6. Suffix
  if (state.suffix) {
    wylie += WYLIE_CONSONANTS[state.suffix] || state.suffix;
  }

  // 7. Second Suffix
  if (state.secondSuffix) {
    wylie += WYLIE_CONSONANTS[state.secondSuffix] || state.secondSuffix;
  }

  // 8. Particle Vowel (for འི་ -> 'i, འོ་ -> 'o)
  if (state.particleVowel) {
    wylie += WYLIE_VOWELS[state.particleVowel] || state.particleVowel;
  }

  return wylie;
}
