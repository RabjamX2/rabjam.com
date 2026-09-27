// Tibetan Syllable Parser & Component Structural Breakdown Engine

export const TIBETAN_BASE_CONSONANTS = new Set([
  'ཀ', 'ཁ', 'ག', 'ང', 'ཅ', 'ཆ', 'ཇ', 'ཉ', 'ཏ', 'ཐ', 'ད', 'ན',
  'པ', 'ཕ', 'བ', 'མ', 'ཙ', 'ཚ', 'ཛ', 'ཝ', 'ཞ', 'ཟ', 'འ', 'ཡ',
  'ར', 'ལ', 'ཤ', 'ས', 'ཧ', 'ཨ',
  'ཊ', 'ཋ', 'ཌ', 'ཎ', 'ཥ', 'ཪ', 'ཫ', 'ཬ',
  'ཁ༹', 'ག༹', 'ཕ༹', 'བ༹',
  'གྷ', 'ཛྷ', 'ཌྷ', 'དྷ', 'བྷ',
  'ཀྵ', 'ྈྐ', 'ྈྑ', 'ྉྤ', 'ྉྥ'
]);

export const TIBETAN_VOWELS = new Set(['ི', 'ུ', 'ེ', 'ོ']);

export const VALID_PREFIXES = new Set(['ག', 'ད', 'བ', 'མ', 'འ']);
export const VALID_SUFFIXES = new Set(['ག', 'ང', 'ད', 'ན', 'བ', 'མ', 'འ', 'ར', 'ལ', 'ས']);
export const VALID_POST_SUFFIXES = new Set(['ད', 'ས']);

export const PERMISSIBLE_PREFIX_TARGETS = {
  'ག': new Set(['ཅ', 'ཉ', 'ཏ', 'ད', 'ན', 'ཙ', 'ཞ', 'ཟ', 'ཡ', 'ཤ', 'ས']),
  'ད': new Set(['ཀ', 'ག', 'ང', 'པ', 'བ', 'མ']),
  'བ': new Set(['ཀ', 'ག', 'ཅ', 'ཏ', 'ད', 'ཙ', 'ཞ', 'ཟ', 'ཤ', 'ས']),
  'མ': new Set(['ཁ', 'ག', 'ང', 'ཆ', 'ཇ', 'ཉ', 'ཐ', 'ད', 'ན', 'ཚ', 'ཛ']),
  'འ': new Set(['ཁ', 'ག', 'ཆ', 'ཇ', 'ཐ', 'ད', 'ཕ', 'བ', 'ཚ', 'ཛ'])
};

export function isValidPrefixForRoot(prefixChar, rootChar) {
  if (!prefixChar || !rootChar) return false;
  const targetSet = PERMISSIBLE_PREFIX_TARGETS[prefixChar];
  return targetSet ? targetSet.has(rootChar) : false;
}

export const GRAMMATICAL_SUBSCRIPTS_HEX = new Set([
  0x0FAD, // ྭ subjoined wa
  0x0FBA, // ྭ fixed-form wa
  0x0FB1, // ྱ subjoined ya
  0x0FBB, // ྱ fixed-form ya
  0x0FB2, // ྲ subjoined ra
  0x0FBC, // ྲ fixed-form ra
  0x0FB3  // ླ subjoined la
]);

export const TSEK = '་';
export const SHAD = '།';

/**
 * Checks if a character is Tibetan Script (U+0F00 to U+0FFF)
 */
export function isTibetanChar(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0x0F00 && code <= 0x0FFF;
}

/**
 * Splits Tibetan text into individual syllable tokens based on Tseks (་) and Shads (།)
 */
export function tokenizeTibetanText(text) {
  if (!text) return [];
  const tokens = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === TSEK || char === '༌' || char === SHAD || char === ' ' || char === '\n') {
      if (current) {
        tokens.push({ text: current, delimiter: char });
        current = '';
      } else {
        tokens.push({ text: '', delimiter: char });
      }
    } else {
      current += char;
    }
  }
  if (current) {
    tokens.push({ text: current, delimiter: '' });
  }

  return tokens;
}

/**
 * Converts a subjoined consonant (U+0F90 - U+0FBC) to its base consonant equivalent (U+0F40 - U+0F6C)
 */
function getBaseChar(char) {
  const code = char.charCodeAt(0);
  if (code >= 0x0F90 && code <= 0x0FBC) {
    return String.fromCharCode(code - 0x0F90 + 0x0F40);
  }
  return char;
}

export const VALID_SUPERSCRIPTS = new Set(['ར', 'ལ', 'ས']);

/**
 * Parses a Unicode consonant stack into its grammatical components: superscript, root, subscript
 */
function parseStack(stackChars) {
  if (!stackChars || stackChars.length === 0) {
    return { superscript: '', root: '', subscript: '' };
  }
  if (stackChars.length === 1) {
    return { superscript: '', root: stackChars[0], subscript: '' };
  }

  const C = stackChars[0];
  const S1 = stackChars[1];
  const s1Code = S1.charCodeAt(0);

  if (GRAMMATICAL_SUBSCRIPTS_HEX.has(s1Code)) {
    // S1 is a grammatical subscript (ya-ta, ra-ta, la-ta, wa-zur)
    // Thus C is the root, and S1 is the subscript.
    const subscript = stackChars.slice(1).join('');
    return { superscript: '', root: C, subscript };
  } else if (VALID_SUPERSCRIPTS.has(C)) {
    // S1 is NOT a grammatical subscript, but C is a valid superscribed letter (ra, la, sa).
    const root = getBaseChar(S1);
    const subscript = stackChars.slice(2).join('');
    return { superscript: C, root, subscript };
  } else {
    // C is NOT a valid superscript (e.g. Sanskrit stack like k+Sha, t+na, or extended cluster).
    const subscript = stackChars.slice(1).join('');
    return { superscript: '', root: C, subscript };
  }
}

/**
 * Parses a single Tibetan syllable into structural components according to traditional Tibetan grammar:
 * { root, prefix, superscript, subscript, vowel, suffix, secondSuffix, raw }
 */
export function parseTibetanSyllable(syllableStr) {
  if (!syllableStr) return null;

  const chars = Array.from(syllableStr);
  const stacks = [];
  const stackVowels = [];
  let currentStack = [];
  let currentVowel = '';

  // Group characters into consonant stacks and identify attached vowels
  for (const c of chars) {
    const code = c.charCodeAt(0);
    // Include ྈ (0x0F88) and ྉ (0x0F89) as bases
    if ((code >= 0x0F40 && code <= 0x0F6C) || code === 0x0F88 || code === 0x0F89) {
      if (currentStack.length > 0) {
        stacks.push(currentStack);
        stackVowels.push(currentVowel);
        currentVowel = '';
      }
      currentStack = [c];
    } else if ((code >= 0x0F90 && code <= 0x0FBC) || code === 0x0F39) { // Subjoined Consonant or Tsa Phru (0x0F39)
      if (currentStack.length > 0) {
        currentStack.push(c);
      } else {
        // Malformed sequence starting with a subjoined character, treat as base
        currentStack = [c];
      }
    } else if (TIBETAN_VOWELS.has(c)) {
      currentVowel = c;
    }
  }

  if (currentStack.length > 0) {
    stacks.push(currentStack);
    stackVowels.push(currentVowel);
  }

  // Exception for Fused Particles (Dropping the Tsek): འང་ ('ang), འམ་ ('am), འོ་ ('o), འི་ ('i)
  let fusedParticle = '';
  let particleStackCount = 0;

  if (stacks.length > 1) {
    const lastIdx = stacks.length - 1;
    const lastRoot = parseStack(stacks[lastIdx]).root;
    const prevRoot = parseStack(stacks[lastIdx - 1]).root;

    if (prevRoot === 'འ' && (lastRoot === 'ང་' || lastRoot === 'མ་' || lastRoot === 'ང' || lastRoot === 'མ')) {
      fusedParticle = 'འ' + lastRoot; // e.g. འང་ or འམ་
      particleStackCount = 2;
    } else if (lastRoot === 'འ' && (stackVowels[lastIdx] === 'ི' || stackVowels[lastIdx] === 'ོ')) {
      fusedParticle = 'འ' + stackVowels[lastIdx]; // e.g. འི་ or འོ་
      particleStackCount = 1;
    } else if (syllableStr.endsWith('འང་') || syllableStr.endsWith('འང')) {
      fusedParticle = 'འང་';
      particleStackCount = 2;
    } else if (syllableStr.endsWith('འམ་') || syllableStr.endsWith('འམ')) {
      fusedParticle = 'འམ་';
      particleStackCount = 2;
    } else if (syllableStr.endsWith('འོ་') || syllableStr.endsWith('འོ')) {
      fusedParticle = 'འོ་';
      particleStackCount = 1;
    } else if (syllableStr.endsWith('འི་') || syllableStr.endsWith('འི')) {
      fusedParticle = 'འི་';
      particleStackCount = 1;
    }
  }

  const isParticleSuffix = particleStackCount > 0;
  const effectiveStacks = isParticleSuffix ? stacks.slice(0, -particleStackCount) : stacks;
  const effectiveVowels = isParticleSuffix ? stackVowels.slice(0, -particleStackCount) : stackVowels;

  let vowelStackIdx = -1;
  for (let i = 0; i < effectiveVowels.length; i++) {
    if (effectiveVowels[i]) {
      vowelStackIdx = i;
      break;
    }
  }

  let rootStackIdx = -1;

  // Known Rule 8.c root-first ambiguous words
  const FIRST_IS_ROOT_EXCEPTIONS = new Set(['བགས་', 'མངས་']);

  if (vowelStackIdx !== -1) {
    // 1. Explicit Vowel Sign Anchor Rule -> The stack with the vowel sign IS the ROOT stack!
    rootStackIdx = vowelStackIdx;
  } else if (FIRST_IS_ROOT_EXCEPTIONS.has(syllableStr)) {
    rootStackIdx = 0;
  } else {
    // 2. Determine root stack among effective stacks
    const n = effectiveStacks.length;

    // A stack with superscripts or subjoined consonants is ALWAYS the root stack
    let stackedIdx = -1;
    for (let i = 0; i < n; i++) {
      if (effectiveStacks[i].length > 1) {
        stackedIdx = i;
        break;
      }
    }

    if (stackedIdx !== -1) {
      rootStackIdx = stackedIdx;
    } else if (n === 1) {
      rootStackIdx = 0;
    } else if (n === 2) {
      // 2 stacks: Prefix+Root OR Root+Suffix
      const s0Root = parseStack(effectiveStacks[0]).root;
      const s1Root = parseStack(effectiveStacks[1]).root;
      if (isValidPrefixForRoot(s0Root, s1Root) && (!VALID_SUFFIXES.has(s1Root) || effectiveStacks[1].length > 1)) {
        rootStackIdx = 1;
      } else {
        rootStackIdx = 0;
      }
    } else if (n === 3) {
      const s0Root = parseStack(effectiveStacks[0]).root;
      const s1Root = parseStack(effectiveStacks[1]).root;
      if (isValidPrefixForRoot(s0Root, s1Root)) {
        rootStackIdx = 1;
      } else {
        rootStackIdx = 0;
      }
    } else if (n >= 4) {
      rootStackIdx = 1;
    }
  }

  const rootParsed = rootStackIdx !== -1 ? parseStack(stacks[rootStackIdx]) : { superscript: '', root: '', subscript: '' };

  let finalRoot = rootParsed.root;
  let finalSubscript = rootParsed.subscript;
  let finalSuperscript = rootParsed.superscript;

  const stackChars = rootStackIdx !== -1 ? stacks[rootStackIdx].join('') : '';

  // Known extended clusters
  const extendedMap = {
    'ཁ༹': 'ཁ༹', 'ག༹': 'ག༹', 'ཕ༹': 'ཕ༹', 'བ༹': 'བ༹',
    'གྷ': 'གྷ', 'ཛྷ': 'ཛྷ', 'ཌྷ': 'ཌྷ', 'དྷ': 'དྷ', 'བྷ': 'བྷ',
    'ཀྵ': 'ཀྵ',
    'ྈྐ': 'ྈྐ', 'ྈྑ': 'ྈྑ',
    'ྉྤ': 'ྉྤ', 'ྉྥ': 'ྉྥ'
  };

  // If the entire stack is an extended character, it is the root!
  if (extendedMap[stackChars]) {
    finalRoot = stackChars;
    finalSubscript = '';
    finalSuperscript = '';
  } else if (rootParsed.root && extendedMap[rootParsed.root + rootParsed.subscript]) {
    finalRoot = rootParsed.root + rootParsed.subscript;
    finalSubscript = '';
    finalSuperscript = '';
  }

  // Extract prefix - MUST be valid for finalRoot according to Tibetan grammar
  let prefix = '';
  if (rootStackIdx > 0) {
    const pRoot = parseStack(stacks[rootStackIdx - 1]).root;
    if (VALID_PREFIXES.has(pRoot) && isValidPrefixForRoot(pRoot, finalRoot)) {
      prefix = pRoot;
    }
  }

  let suffix = '';
  if (!isParticleSuffix && rootStackIdx + 1 < stacks.length) {
    suffix = parseStack(stacks[rootStackIdx + 1]).root;
  }

  let secondSuffix = '';
  if (!isParticleSuffix && rootStackIdx + 2 < stacks.length) {
    secondSuffix = parseStack(stacks[rootStackIdx + 2]).root;
  }

  const vowel = rootStackIdx !== -1 ? (stackVowels[rootStackIdx] || '') : '';
  const particleVowel = isParticleSuffix ? (stackVowels[stacks.length - 1] || '') : '';

  return {
    raw: syllableStr,
    rawStack: stackChars,
    prefix,
    superscript: finalSuperscript,
    root: finalRoot,
    subscript: finalSubscript,
    vowel,
    particleVowel,
    fusedParticle,
    suffix,
    secondSuffix
  };
}
