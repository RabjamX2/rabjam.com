// Live Incremental Tibetan Syllable Parser & Predictive State Machine

import {
  TIBETAN_BASE_CONSONANTS,
  TIBETAN_VOWELS,
  VALID_PREFIXES,
  VALID_SUFFIXES,
  VALID_POST_SUFFIXES,
  VALID_SUPERSCRIPTS,
  PERMISSIBLE_PREFIX_TARGETS,
  isValidPrefixForRoot,
  TSEK,
  SHAD
} from './tibetanParser.js';

// Subscript target mappings based on Tibetan Grammar Readme
export const SUBSCRIPT_TARGETS = {
  'ྱ': new Set(['ཀ', 'ཁ', 'ག', 'པ', 'ཕ', 'བ', 'མ']), // ya-ta
  'ྲ': new Set(['ཀ', 'ཁ', 'ག', 'ཏ', 'ཐ', 'ད', 'པ', 'ཕ', 'བ', 'མ', 'ཤ', 'ས', 'ཧ']), // ra-ta
  'ླ': new Set(['ཀ', 'ག', 'བ', 'ཟ', 'ར', 'ས']), // la-ta
  'ྭ': new Set(['ཀ', '<ctrl42>', 'ག', 'ཅ', 'ཉ', 'ཏ', 'ད', 'ཙ', 'ཚ', 'ཞ', 'ཟ', 'ར', 'ལ', 'ཤ', 'ས', 'ཧ', 'གྲ', 'དྲ', 'ཕྱ', 'རྒ', 'རྩ']) // wa-zur
};

// Superscript target mappings based on Tibetan Grammar Readme Section 1.2.3.1
export const SUPERSCRIPT_TARGETS = {
  'ར': new Set(['ཀ', 'ག', 'ང', 'ཇ', 'ཉ', 'ཏ', 'ད', 'ན', 'བ', 'མ', 'ཙ', 'ཛ']),
  'ལ': new Set(['ཀ', 'ག', 'ང', 'ཅ', 'ཇ', 'ཏ', 'ད', 'པ', 'བ', 'ཧ']),
  'ས': new Set(['ཀ', 'ག', 'ང', 'ཉ', 'ཏ', 'ད', 'ན', 'པ', 'བ', 'མ', 'ཙ'])
};

// Map subjoined characters (U+0F90 - U+0FBC) to standard subscript symbols or base characters
export function getBaseFromSubjoined(char) {
  if (!char) return '';
  const code = char.charCodeAt(0);
  if (code >= 0x0F90 && code <= 0x0FBC) {
    return String.fromCharCode(code - 0x0F90 + 0x0F40);
  }
  return char;
}

export function isSubjoined(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 0x0F90 && code <= 0x0FBC) || char === 'ྱ' || char === 'ྲ' || char === 'ླ' || char === 'ྭ';
}

/**
 * Creates a fresh draft syllable state
 */
export function createSyllableState() {
  return {
    chars: [],
    prefix: '',
    superscript: '',
    root: '',
    subscript: '',
    vowel: '',
    suffix: '',
    secondSuffix: '',
    particleVowel: '',
    inherentVowelSealed: false,
    isComplete: false,
    history: []
  };
}

/**
 * Returns a Set of all legal next character strings that can be typed given the current state.
 */
export function getLegalNextKeys(state) {
  const legalKeys = new Set();

  // Numbers and special punctuation are always valid
  const ALWAYS_ALLOWED_PUNCTUATION = ['༠','༡','༢','༣','༤','༥','༦','༧','༨','༩','༄༅།','༄','༅','༆','༇','༏','༐','༑','༔','༎'];
  ALWAYS_ALLOWED_PUNCTUATION.forEach(p => legalKeys.add(p));

  if (!state || state.isComplete) {
    legalKeys.add(TSEK);
    legalKeys.add(SHAD);
    legalKeys.add(' ');
    TIBETAN_BASE_CONSONANTS.forEach(c => legalKeys.add(c));
    return legalKeys;
  }

  // Tsek, Shad, and Space are always valid to end a non-empty syllable
  if (state.chars.length > 0) {
    legalKeys.add(TSEK);
    legalKeys.add(SHAD);
    legalKeys.add(' ');
  }

  // Case 0: Empty Syllable -> Any base consonant can be typed
  if (state.chars.length === 0) {
    TIBETAN_BASE_CONSONANTS.forEach(c => legalKeys.add(c));
    return legalKeys;
  }

  // Case 1: Syllable has Root, but no Vowel and no Suffix yet
  if (!state.vowel && !state.suffix) {
    const r = state.root;

    // 1.a Vowels allowed
    TIBETAN_VOWELS.forEach(v => legalKeys.add(v));

    // 1.b Subscripts allowed if root doesn't have one yet
    if (!state.subscript && r) {
      Object.entries(SUBSCRIPT_TARGETS).forEach(([sub, targets]) => {
        if (targets.has(r)) {
          legalKeys.add(sub);
          // Also add subjoined Unicode representations
          if (sub === 'ྱ') legalKeys.add('\u0FB1');
          if (sub === 'ྲ') legalKeys.add('\u0FB2');
          if (sub === 'ླ') legalKeys.add('\u0FB3');
          if (sub === 'ྭ') legalKeys.add('\u0FAD');
        }
      });
    }

    // 1.c If single char typed (C1), C1 could be Prefix
    if (state.chars.length === 1) {
      const c1 = state.chars[0];

      // Next consonant as Root for Prefix `c1`
      if (VALID_PREFIXES.has(c1)) {
        const targets = PERMISSIBLE_PREFIX_TARGETS[c1];
        if (targets) {
          targets.forEach(target => legalKeys.add(target));
        }
      }
    }

    // 1.d Superscript stacking: if root is a valid superscript letter, allow subjoined
    // consonants (from the Subscripts & Vowels layer) to form stacked syllables.
    // Superscripts are ONLY created via subjoined input — base consonants always become suffix.
    if (!state.superscript && !state.prefix && state.root && SUPERSCRIPT_TARGETS[state.root]) {
      SUPERSCRIPT_TARGETS[state.root].forEach(target => {
        // Add the SUBJOINED form (U+0F90 range) so only explicit stack-clicks trigger stacking
        const code = target.charCodeAt(0);
        if (code >= 0x0F40 && code <= 0x0F6C) {
          legalKeys.add(String.fromCharCode(code - 0x0F40 + 0x0F90));
        }
      });
    }

    // 1.d Suffixes allowed
    VALID_SUFFIXES.forEach(s => legalKeys.add(s));

    return legalKeys;
  }

  // Case 2: Syllable has Vowel, but no Suffix yet
  if (state.vowel && !state.suffix) {
    VALID_SUFFIXES.forEach(s => legalKeys.add(s));
    return legalKeys;
  }

  // Case 3: Syllable has Suffix, but no 2nd Suffix yet
  if (state.suffix && !state.secondSuffix) {
    const s1 = state.suffix;

    // 2nd Postfix `ས`
    if (new Set(['ག', 'ང', 'བ', 'མ']).has(s1)) {
      legalKeys.add('ས');
    }

    // 2nd Postfix `ད` (archaic da-drag)
    if (new Set(['ན', 'ར', 'ལ']).has(s1)) {
      legalKeys.add('ད');
    }

    // Particle Vowels `ི` / `ོ` if suffix is `འ`
    if (s1 === 'འ' && !state.particleVowel) {
      legalKeys.add('ི');
      legalKeys.add('ོ');
    }

    return legalKeys;
  }

  return legalKeys;
}

export function canAcceptChar(state, inputChar) {
  if (!inputChar) return false;
  const legalKeys = getLegalNextKeys(state);
  return legalKeys.has(inputChar);
}

/**
 * Pushes a character into the state machine, advancing component slots.
 */
export function pushChar(state, inputChar, isStrict = true) {
  if (isStrict && !canAcceptChar(state, inputChar)) {
    return false;
  }

  // Save snapshot for backspace undo
  const snapshot = JSON.parse(JSON.stringify({
    chars: state.chars,
    prefix: state.prefix,
    superscript: state.superscript,
    root: state.root,
    subscript: state.subscript,
    vowel: state.vowel,
    suffix: state.suffix,
    secondSuffix: state.secondSuffix,
    particleVowel: state.particleVowel,
    inherentVowelSealed: state.inherentVowelSealed,
    isComplete: state.isComplete
  }));
  state.history.push(snapshot);

  // Restart syllable if currently complete and a base consonant is typed
  if (state.isComplete) {
    if (TIBETAN_BASE_CONSONANTS.has(inputChar) || !isStrict) {
      state.chars = [inputChar];
      state.prefix = '';
      state.superscript = '';
      state.root = inputChar;
      state.subscript = '';
      state.vowel = '';
      state.suffix = '';
      state.secondSuffix = '';
      state.particleVowel = '';
      state.inherentVowelSealed = false;
      state.isComplete = false;
      return true;
    }
  }

  // 1. Handle delimiters (Tsek, Shad, Space)
  if (inputChar === TSEK || inputChar === '༌' || inputChar === SHAD || inputChar === ' ') {
    state.isComplete = true;
    state.chars.push(inputChar);
    return true;
  }

  state.chars.push(inputChar);

  // 2. Subjoined consonant (e.g. ྒ 0x0F92) or explicit subscript (ྱ, ྲ, ླ, ྭ)
  if (isSubjoined(inputChar)) {
    const subSymbol = inputChar === '\u0FB1' ? 'ྱ' :
                      inputChar === '\u0FB2' ? 'ྲ' :
                      inputChar === '\u0FB3' ? 'ླ' :
                      inputChar === '\u0FAD' ? 'ྭ' : inputChar;

    if (subSymbol === 'ྱ' || subSymbol === 'ྲ' || subSymbol === 'ླ' || subSymbol === 'ྭ') {
      if (state.root && SUBSCRIPT_TARGETS[subSymbol] && SUBSCRIPT_TARGETS[subSymbol].has(state.root)) {
        state.subscript = subSymbol;
        return true;
      } else if (!isStrict) {
        state.subscript = subSymbol;
        return true;
      }
    } else {
      // Subjoined consonant (e.g. ྒ under superscript ས)
      const baseRoot = getBaseFromSubjoined(inputChar);
      if (state.root && SUPERSCRIPT_TARGETS[state.root] && SUPERSCRIPT_TARGETS[state.root].has(baseRoot)) {
        state.superscript = state.root;
        state.root = baseRoot;
        return true;
      } else if (!isStrict) {
        if (!state.superscript && state.root) {
          state.superscript = state.root;
          state.root = baseRoot;
        } else {
          state.subscript = inputChar;
        }
        return true;
      }
    }

    if (isStrict) {
      // Invalid subscript/superscript target
      state.chars.pop();
      state.history.pop();
      return false;
    }
    return true;
  }

  // 3. Vowels
  if (TIBETAN_VOWELS.has(inputChar)) {
    if (state.suffix === 'འ') {
      state.particleVowel = inputChar;
    } else {
      state.vowel = inputChar;
    }
    return true;
  }

  // 4. Consonants
  if (TIBETAN_BASE_CONSONANTS.has(inputChar)) {
    // Case 4.a: First character typed
    if (state.chars.length === 1) {
      state.root = inputChar;
      return true;
    }

    // Case 4.b: Second consonant typed when no vowel or subscript yet.
    // NOTE: Superscript stacking is NOT handled here — it requires explicit subjoined input.
    // A base consonant after a root is ALWAYS a suffix or prefix reassignment.
    if (state.root && !state.vowel && !state.subscript && !state.suffix && !state.superscript) {
      const prevChar = state.chars[state.chars.length - 2];

      // Check if prevChar is a Prefix for inputChar (e.g., བ + ད)
      if (VALID_PREFIXES.has(prevChar) && isValidPrefixForRoot(prevChar, inputChar)) {
        state.prefix = prevChar;
        state.root = inputChar;
        return true;
      }

      // Otherwise prevChar is Root, inputChar is Suffix (e.g., ར + བ = རབ, not རྦ)
      state.suffix = inputChar;
      return true;
    }

    // Case 4.b-super: Superscript already set — consonant must be suffix, not re-examined
    if (state.root && state.superscript && !state.vowel && !state.subscript && !state.suffix) {
      state.suffix = inputChar;
      return true;
    }

    // Case 4.c: Consonant typed after Prefix + Root (e.g. བ + སྒྲ -> བ)
    if (state.root && !state.suffix) {
      state.suffix = inputChar;
      return true;
    }

    // Case 4.d: Consonant typed after Suffix -> Second Suffix
    if (state.suffix && !state.secondSuffix) {
      state.secondSuffix = inputChar;
      return true;
    }
  }

  return true;
}

/**
 * Reverts the state by 1 keystroke using history.
 */
export function popChar(state) {
  if (!state || state.history.length === 0) {
    const fresh = createSyllableState();
    Object.assign(state, fresh);
    return false;
  }

  const prev = state.history.pop();
  state.chars = prev.chars;
  state.prefix = prev.prefix;
  state.superscript = prev.superscript;
  state.root = prev.root;
  state.subscript = prev.subscript;
  state.vowel = prev.vowel;
  state.suffix = prev.suffix;
  state.secondSuffix = prev.secondSuffix;
  state.particleVowel = prev.particleVowel;
  state.inherentVowelSealed = prev.inherentVowelSealed || false;
  state.isComplete = prev.isComplete;
  return true;
}
