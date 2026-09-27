// Tibetan Syllable & Document Grammar Rule Validation Engine
// Enforces rules from TIBETAN_GRAMMAR_README.md and tibetanParser.js

import {
  TIBETAN_BASE_CONSONANTS,
  TIBETAN_VOWELS,
  VALID_PREFIXES,
  VALID_SUFFIXES,
  VALID_POST_SUFFIXES,
  VALID_SUPERSCRIPTS,
  PERMISSIBLE_PREFIX_TARGETS,
  isValidPrefixForRoot,
  parseTibetanSyllable,
  isTibetanChar,
  TSEK,
  SHAD
} from './tibetanParser.js';

// Subscript target mappings from Tibetan Grammar Readme Section 1.2.2.1
export const SUBSCRIPT_TARGETS = {
  'ྱ': new Set(['ཀ', 'ཁ', 'ག', 'པ', 'ཕ', 'བ', 'མ', 'རྐ', 'རྒ', 'རྨ', 'སྐ', 'སྒ', 'སྤ', 'སྦ', 'སྨ']),
  'ྲ': new Set(['ཀ', 'ཁ', 'ག', 'ཏ', 'ཐ', 'ད', 'པ', 'ཕ', 'བ', 'མ', 'ཤ', 'ས', 'ཧ', 'སྐ', 'སྒ', 'སྤ', 'སྦ', 'སྨ', 'སྣ']),
  'ླ': new Set(['ཀ', 'ག', 'བ', 'ཟ', 'ར', 'ས']),
  'ྭ': new Set(['ཀ', 'ཁ', 'ག', 'ཅ', 'ཉ', 'ཏ', 'ད', 'ཙ', 'ཚ', 'ཞ', 'ཟ', 'ར', 'ལ', 'ཤ', 'ས', 'ཧ', 'གྲ', 'དྲ', 'ཕྱ', 'རྒ', 'རྩ'])
};

// Superscript target mappings from Tibetan Grammar Readme Section 1.2.3.1
export const SUPERSCRIPT_TARGETS = {
  'ར': new Set(['ཀ', 'ག', 'ང', 'ཇ', 'ཉ', 'ཏ', 'ད', 'ན', 'བ', 'མ', 'ཙ', 'ཛ']),
  'ལ': new Set(['ཀ', 'ག', 'ང་', 'ཅ', 'ཇ', 'ཏ', 'ད', 'པ', 'བ', 'ཧ']),
  'ས': new Set(['ཀ', 'ག', 'ང', 'ཉ', 'ཏ', 'ད', 'ན', 'པ', 'བ', 'མ', 'ཙ'])
};

// Valid second postfix hosts from Tibetan Grammar Readme Section 1.2.6.1
export const SECOND_SUFFIX_HOSTS = {
  'ས་': new Set(['ག་', 'ང་', 'བ་', 'མ་', 'ག', 'ང', 'བ', 'མ']),
  'ད་': new Set(['ན་', 'ར་', 'ལ་', 'ན', 'ར', 'ལ']) // Archaic da-drag
};

/**
 * Validates a single Tibetan syllable string against traditional Tibetan grammar rules.
 * Returns an object: { raw, isValid, parsed, errors: [{ ruleId, category, title, section, message, suggestion }] }
 */
export function validateTibetanSyllable(syllableStr) {
  if (!syllableStr || syllableStr.trim() === '') {
    return { raw: syllableStr, isValid: true, parsed: null, errors: [] };
  }

  const raw = syllableStr.trim();
  const errors = [];

  // Check if string contains Tibetan characters
  const chars = Array.from(raw);
  const tibetanChars = chars.filter(c => isTibetanChar(c));

  if (tibetanChars.length === 0) {
    return { raw, isValid: true, parsed: null, errors: [] };
  }

  // 1. Check for duplicate or illegal vowel combinations
  const vowelsInSyllable = chars.filter(c => TIBETAN_VOWELS.has(c));
  if (vowelsInSyllable.length > 1) {
    // Exception: Particle suffix like འི་ or འོ་ attached
    const isParticle = chars.includes('འ') && (chars.includes('ི') || chars.includes('ོ'));
    if (!isParticle) {
      errors.push({
        ruleId: 'vowels-multiple',
        category: 'vowel',
        title: 'Multiple Vowels on Single Syllable',
        section: 'Section 1.2.1',
        message: `Syllable "${raw}" contains multiple vowel signs (${vowelsInSyllable.join(', ')}). A standard Tibetan syllable can have at most one primary vowel sign.`,
        suggestion: 'Keep only a single vowel sign per syllable stack.'
      });
    }
  }

  // Parse syllable structure using parser engine
  const parsed = parseTibetanSyllable(raw);

  if (!parsed || !parsed.root) {
    // Syllable structure cannot be resolved into a root letter
    errors.push({
      ruleId: 'structure-unresolvable',
      category: 'structure',
      title: 'Unresolvable Syllable Structure',
      section: 'Section 2 (Finding the Root Letter)',
      message: `The character sequence "${raw}" does not form a recognizable Tibetan syllable structure according to root-finding grammar rules.`,
      suggestion: 'Check character order, consonant stacking, or missing Tseks.'
    });
    return { raw, isValid: false, parsed: null, errors };
  }

  // 2. Prefix Validation (སྔོན་འཇུག་ - Rule 4)
  if (parsed.prefix) {
    if (!VALID_PREFIXES.has(parsed.prefix)) {
      errors.push({
        ruleId: 'prefix-invalid-letter',
        category: 'prefix',
        title: 'Invalid Prefix Letter',
        section: 'Section 1.2.4.1',
        message: `Letter "${parsed.prefix}" is not one of the 5 allowed prefix letters (ག་ ད་ བ་ མ་ འ་).`,
        suggestion: 'Prefix letters must strictly be one of: ག་, ད་, བ་, མ་, or འ་.'
      });
    } else if (parsed.root) {
      const allowedTargets = PERMISSIBLE_PREFIX_TARGETS[parsed.prefix];
      if (allowedTargets && !allowedTargets.has(parsed.root)) {
        errors.push({
          ruleId: 'prefix-target-mismatch',
          category: 'prefix',
          title: 'Impermissible Prefix for Root',
          section: 'Section 1.2.4.1',
          message: `Prefix "${parsed.prefix}" (སྔོན་འཇུག་) cannot precede root letter "${parsed.root}" (མིང་གཞི་). Permissible targets for prefix "${parsed.prefix}" are: ${Array.from(allowedTargets).join(', ')}.`,
          suggestion: `Ensure prefix "${parsed.prefix}" is only paired with its allowed root letters.`
        });
      }
    }
  }

  // Check if leading consonant is an invalid prefix attempt (e.g. གཔ)
  if (!parsed.prefix && chars.length >= 2) {
    const firstChar = chars[0];
    if (VALID_PREFIXES.has(firstChar) && chars.length === 2 && !TIBETAN_VOWELS.has(chars[1])) {
      const secondChar = chars[1];
      const code1 = secondChar.charCodeAt(0);
      const isSubjoinedChar = (code1 >= 0x0F90 && code1 <= 0x0FBC) || secondChar === 'ྱ' || secondChar === 'ྲ' || secondChar === 'ླ' || secondChar === 'ྭ';
      
      if (!isSubjoinedChar) {
        const targetSet = PERMISSIBLE_PREFIX_TARGETS[firstChar];
        if (targetSet && !targetSet.has(secondChar) && !VALID_SUFFIXES.has(secondChar)) {
          errors.push({
            ruleId: 'prefix-illegal-combination',
            category: 'prefix',
            title: 'Illegal Prefix Combination',
            section: 'Section 1.2.4.1',
            message: `Leading letter "${firstChar}" cannot function as a prefix before "${secondChar}", nor is "${secondChar}" a valid postfix letter.`,
            suggestion: `Change prefix or verify root letter.`
          });
        }
      }
    }
  }

  // 3. Superscript Validation (མགོ་ཡིག་ - Rule 3)
  if (parsed.superscript) {
    if (!VALID_SUPERSCRIPTS.has(parsed.superscript)) {
      errors.push({
        ruleId: 'superscript-invalid-letter',
        category: 'superscript',
        title: 'Invalid Superscript Letter',
        section: 'Section 1.2.3.1',
        message: `Letter "${parsed.superscript}" is not a valid superscribed letter (མགོ་ཡིག་). Only ར་, ལ་, and ས་ are valid superscripts.`,
        suggestion: 'Superscripts can only be ར་, ལ་, or ས་.'
      });
    } else if (parsed.root) {
      const allowedTargets = SUPERSCRIPT_TARGETS[parsed.superscript];
      if (allowedTargets && !allowedTargets.has(parsed.root)) {
        errors.push({
          ruleId: 'superscript-target-mismatch',
          category: 'superscript',
          title: 'Impermissible Superscript for Root',
          section: 'Section 1.2.3.1',
          message: `Superscript "${parsed.superscript}" (མགོ་ཡིག་) cannot be placed over root letter "${parsed.root}" (མིང་གཞི་). Allowed base consonants for ${parsed.superscript}-head are: ${Array.from(allowedTargets).join(', ')}.`,
          suggestion: `Check superscript combination rules for ${parsed.superscript}-head.`
        });
      }
    }
  }

  // 4. Subscript Validation (འདོགས་ཡིག་ - Rule 2)
  if (parsed.subscript) {
    const subChar = parsed.subscript.charAt(0);
    const allowedTargets = SUBSCRIPT_TARGETS[subChar] || SUBSCRIPT_TARGETS[parsed.subscript];
    const rootOrStack = (parsed.superscript ? parsed.superscript + parsed.root : parsed.root);

    if (allowedTargets && !allowedTargets.has(parsed.root) && !allowedTargets.has(rootOrStack)) {
      errors.push({
        ruleId: 'subscript-target-mismatch',
        category: 'subscript',
        title: 'Impermissible Subscript for Root',
        section: 'Section 1.2.2.1',
        message: `Subscript "${parsed.subscript}" (འདོགས་ཡིག་) cannot be subjoined under root "${parsed.root}". Allowed root letters for ${parsed.subscript} are: ${Array.from(allowedTargets).join(', ')}.`,
        suggestion: `Verify valid subscript combinations for ${parsed.subscript}.`
      });
    }
  }

  // 5. Postfix / Suffix Validation (རྗེས་འཇུག་ - Rule 5)
  if (parsed.suffix) {
    if (!VALID_SUFFIXES.has(parsed.suffix)) {
      errors.push({
        ruleId: 'suffix-invalid-letter',
        category: 'suffix',
        title: 'Invalid Postfix (1st Suffix) Letter',
        section: 'Section 1.2.5.1',
        message: `Letter "${parsed.suffix}" is in postfix position, but is not one of the 10 valid postfix letters (རྗེས་འཇུག་: ག་ ང་ ད་ ན་ བ་ མ་ འ་ ར་ ལ་ ས་).`,
        suggestion: 'Only ག་, ང་, ད་, ན་, བ་, མ་, འ་, ར་, ལ་, ས་ can serve as 1st postfix.'
      });
    }
  }

  // 6. Second Postfix Validation (ཡང་འཇུག་ - Rule 6)
  if (parsed.secondSuffix && !parsed.fusedParticle) {
    // Check if suffix 'འ' + secondSuffix ('ང་'/'མ་') is a valid Syllable Fusion (contracted particle: འང་ or འམ་)
    const isParticleFusion = parsed.suffix === 'འ' && (parsed.secondSuffix === 'ང་' || parsed.secondSuffix === 'ང' || parsed.secondSuffix === 'མ་' || parsed.secondSuffix === 'མ');

    if (!isParticleFusion) {
      if (!VALID_POST_SUFFIXES.has(parsed.secondSuffix)) {
        errors.push({
          ruleId: 'second-suffix-invalid-letter',
          category: 'secondSuffix',
          title: 'Invalid 2nd Postfix Letter',
          section: 'Section 1.2.6.1',
          message: `Letter "${parsed.secondSuffix}" is in 2nd postfix position, but only ས་ and ད་ (da-drag) are legal 2nd postfix letters (ཡང་འཇུག་).`,
          suggestion: '2nd postfix can only be ས་ or ད་.'
        });
      } else if (parsed.suffix) {
        const allowedHosts = SECOND_SUFFIX_HOSTS[parsed.secondSuffix];
        if (allowedHosts && !allowedHosts.has(parsed.suffix)) {
          errors.push({
            ruleId: 'second-suffix-host-mismatch',
            category: 'secondSuffix',
            title: 'Illegal 2nd Postfix Placement',
            section: 'Section 1.2.6.1',
            message: `2nd Postfix "${parsed.secondSuffix}" cannot follow 1st postfix "${parsed.suffix}". Postfix ས་ can only follow ག་, ང་, བ་, མ་; postfix ད་ can only follow ན་, ར་, ལ་.`,
            suggestion: `Ensure 2nd postfix "${parsed.secondSuffix}" follows a permissible 1st postfix.`
          });
        }
      }
    }
  }

  return {
    raw,
    isValid: errors.length === 0,
    parsed,
    errors
  };
}

/**
 * Checks if a string contains at least one Tibetan consonant.
 */
export function containsTibetanConsonant(str) {
  if (!str) return false;
  for (const c of str) {
    const code = c.charCodeAt(0);
    if ((code >= 0x0F40 && code <= 0x0F6C) || code === 0x0F88 || code === 0x0F89) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a string consists entirely of Tibetan or ASCII digits.
 */
export function isDigitSequence(str) {
  if (!str || str.trim() === '') return false;
  for (const c of str.trim()) {
    const code = c.charCodeAt(0);
    const isTibDigit = (code >= 0x0F20 && code <= 0x0F33);
    const isAsciiDigit = (code >= 0x30 && code <= 0x39);
    if (!isTibDigit && !isAsciiDigit) return false;
  }
  return true;
}

/**
 * Checks if a character is a Tibetan punctuation mark or special symbol.
 */
export function isPunctuationOrSymbol(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  // Tibetan punctuation, head marks, shads, brackets, symbols (0x0F00-0x0F1F, 0x0F34-0x0F3F, 0x0FBE-0x0FBF)
  if ((code >= 0x0F00 && code <= 0x0F1F) || (code >= 0x0F34 && code <= 0x0F3F) || (code >= 0x0FBE && code <= 0x0FBF)) {
    return true;
  }
  // Standard ASCII punctuation
  if ((code >= 0x20 && code <= 0x2F) || (code >= 0x3A && code <= 0x40) || (code >= 0x5B && code <= 0x60) || (code >= 0x7B && code <= 0x7E)) {
    return true;
  }
  return false;
}

/**
 * Validates a full Tibetan text document line by line.
 * Tokenizes syllables and yields diagnostic metrics and detailed error items.
 */
export function validateTibetanDocument(documentText) {
  if (!documentText) {
    return {
      totalSyllables: 0,
      validSyllables: 0,
      invalidSyllables: 0,
      accuracyRate: '100%',
      tokens: [],
      errorSummary: {
        prefix: 0,
        superscript: 0,
        subscript: 0,
        vowel: 0,
        suffix: 0,
        secondSuffix: 0,
        structure: 0
      }
    };
  }

  const lines = documentText.split(/\r?\n/);
  const allTokens = [];
  let totalSyllables = 0;
  let validSyllables = 0;
  let invalidSyllables = 0;

  const errorSummary = {
    prefix: 0,
    superscript: 0,
    subscript: 0,
    vowel: 0,
    suffix: 0,
    secondSuffix: 0,
    structure: 0
  };

  lines.forEach((lineText, lineIdx) => {
    let charOffset = 0;
    let currentSyllable = '';
    
    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];

      // If character is Tsek (་), Shad (།), space, tab, or punctuation mark
      if (char === TSEK || char === '༌' || char === SHAD || char === ' ' || char === '\t' || isPunctuationOrSymbol(char)) {
        if (currentSyllable) {
          processToken(currentSyllable, char === TSEK || char === '༌' || char === SHAD ? char : '', lineIdx + 1, charOffset - currentSyllable.length);
          currentSyllable = '';
        }
        
        if (char !== TSEK && char !== '༌') {
          // Push punctuation mark or space as a non-syllable valid token
          allTokens.push({
            text: char,
            delimiter: '',
            line: lineIdx + 1,
            charOffset,
            isTibetan: false,
            isPunctuation: true,
            isValid: true,
            errors: []
          });
        }
      } else if (isDigitSequence(char)) {
        if (currentSyllable && !isDigitSequence(currentSyllable)) {
          processToken(currentSyllable, '', lineIdx + 1, charOffset - currentSyllable.length);
          currentSyllable = '';
        }
        currentSyllable += char;
      } else {
        if (currentSyllable && isDigitSequence(currentSyllable)) {
          processToken(currentSyllable, '', lineIdx + 1, charOffset - currentSyllable.length);
          currentSyllable = '';
        }
        currentSyllable += char;
      }
      charOffset++;
    }

    if (currentSyllable) {
      processToken(currentSyllable, '', lineIdx + 1, charOffset - currentSyllable.length);
    }
  });

  function processToken(tokenText, delimiter, lineNum, colOffset) {
    if (!tokenText) return;

    const isNum = isDigitSequence(tokenText);
    const hasConsonant = containsTibetanConsonant(tokenText);

    // Numbers and pure punctuation are valid non-syllables
    if (isNum || !hasConsonant) {
      allTokens.push({
        text: tokenText,
        delimiter,
        line: lineNum,
        charOffset: colOffset,
        isTibetan: false,
        isNumber: isNum,
        isPunctuation: !isNum,
        isValid: true,
        errors: []
      });
      return;
    }

    // Standard Tibetan syllable containing consonants
    totalSyllables++;
    const validationResult = validateTibetanSyllable(tokenText);

    if (validationResult.isValid) {
      validSyllables++;
    } else {
      invalidSyllables++;
      validationResult.errors.forEach(err => {
        if (errorSummary[err.category] !== undefined) {
          errorSummary[err.category]++;
        }
      });
    }

    allTokens.push({
      text: tokenText,
      delimiter,
      line: lineNum,
      charOffset: colOffset,
      isTibetan: true,
      isValid: validationResult.isValid,
      parsed: validationResult.parsed,
      errors: validationResult.errors
    });
  }

  const accuracy = totalSyllables > 0 ? ((validSyllables / totalSyllables) * 100).toFixed(1) + '%' : '100%';

  return {
    totalSyllables,
    validSyllables,
    invalidSyllables,
    accuracyRate: accuracy,
    tokens: allTokens,
    errorSummary
  };
}
