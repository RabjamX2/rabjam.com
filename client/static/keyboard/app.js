// Tibetan Grammar Keyboard & Component Inspector Controller

import {
  createSyllableState,
  pushChar,
  popChar,
  getLegalNextKeys,
  canAcceptChar
} from './liveTibetanParser.js';

import { syllableToWylie } from './wylieConverter.js';
import { parseTibetanSyllable } from './tibetanParser.js';

// Global Application State
let committedText = '';
let syllableState = createSyllableState();
let currentLayout = 'consonants';
let soundEnabled = true;

// Web Audio API Sound Synthesizer
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
}

function playKeySound(type = 'click') {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'click') {
    // Crisp click tone for valid keypress
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.start(now);
    osc.stop(now + 0.04);
  } else if (type === 'error') {
    // Low thud/buzz tone for blocked keypress
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

// Helper to convert base consonant to Unicode subjoined character (0x0F90 - 0x0FBC)
function getSubjoinedChar(char) {
  if (!char) return '';
  const code = char.charCodeAt(0);
  if (code >= 0x0F40 && code <= 0x0F6C) {
    return String.fromCharCode(code - 0x0F40 + 0x0F90);
  }
  return char;
}

/**
 * Builds the proper combined Unicode string for a draft syllable state
 */
function buildDisplayString(state) {
  if (!state || state.chars.length === 0) return '';
  
  let str = '';
  if (state.prefix) str += state.prefix;
  
  if (state.superscript && state.root) {
    str += state.superscript + getSubjoinedChar(state.root);
  } else if (state.root) {
    str += state.root;
  }
  
  if (state.subscript) str += state.subscript;
  if (state.vowel) str += state.vowel;
  if (state.suffix) str += state.suffix;
  if (state.secondSuffix) str += state.secondSuffix;
  if (state.particleVowel) str += state.particleVowel;

  // Append any trailing delimiters
  const lastChar = state.chars[state.chars.length - 1];
  if (lastChar === '་' || lastChar === '།' || lastChar === ' ') {
    str += lastChar;
  }

  return str || state.chars.join('');
}

// On-Screen Keyboard Layout Definitions
const LAYOUT_CONSONANTS = [
  ['ཀ', 'ཁ', 'ག', 'ང', 'ཅ', 'ཆ', 'ཇ', 'ཉ'],
  ['ཏ', 'ཐ', 'ད', 'ན', 'པ', 'ཕ', 'བ', 'མ'],
  ['ཙ', 'ཚ', 'ཛ', 'ཝ', 'ཞ', 'ཟ', 'འ', 'ཡ'],
  ['ར', 'ལ', 'ཤ', 'ས', 'ཧ', 'ཨ', '⌫']
];

let isShiftActive = false;

// QWERTY Physical Keyboard Layout Arrangement (Exact Physical QWERTY Positions)
const LAYOUT_QWERTY_ROWS = [
  // Top Row (QWERTYUIOP)
  [
    { key: 'q', norm: '', shift: '' },
    { key: 'w', norm: 'ཝ', shift: 'ྭ' },
    { key: 'e', norm: 'ེ', shift: '' },
    { key: 'r', norm: 'ར', shift: 'ྲ' },
    { key: 't', norm: 'ཏ', shift: 'ཐ' },
    { key: 'y', norm: 'ཡ', shift: 'ྱ' },
    { key: 'u', norm: 'ུ', shift: '' },
    { key: 'i', norm: 'ི', shift: '' },
    { key: 'o', norm: 'ོ', shift: '' },
    { key: 'p', norm: 'པ', shift: 'ཕ' }
  ],
  // Middle / Home Row (ASDFGHJKL;')
  [
    { key: 'a', norm: 'ཨ', shift: '' },
    { key: 's', norm: 'ས', shift: 'ཤ' },
    { key: 'd', norm: 'ད', shift: 'ྡ' },
    { key: 'f', norm: 'ཛ', shift: 'ྫ' },
    { key: 'g', norm: 'ག', shift: 'ྒ' },
    { key: 'h', norm: 'ཧ', shift: 'ྷ' },
    { key: 'j', norm: 'ཇ', shift: 'ྗ' },
    { key: 'k', norm: 'ཀ', shift: 'ཁ' },
    { key: 'l', norm: 'ལ', shift: 'ླ' },
    { key: '\'', norm: 'འ', shift: '' } // Two keys right of 'l'!
  ],
  // Bottom Row (ZXCVBNM)
  [
    { key: 'shift', isShift: true },
    { key: 'z', norm: 'ཟ', shift: 'ཞ' },
    { key: 'x', norm: 'ཙ', shift: 'ཚ' },
    { key: 'c', norm: 'ཅ', shift: 'ཆ' },
    { key: 'v', norm: 'འ', shift: '' },
    { key: 'b', norm: 'བ', shift: 'ྦ' },
    { key: 'n', norm: 'ན', shift: 'ཉ' },
    { key: 'm', norm: 'མ', shift: 'ང' },
    { key: 'delete', isDelete: true }
  ]
];

// Sambhota Standard Tibetan Keyboard Layout Arrangement
const LAYOUT_SAMBHOTA_ROWS = [
  // Top Row (Tibetan Digits / Numbers)
  [
    { key: 'q', norm: '༡', shift: '1' },
    { key: 'w', norm: '༢', shift: '2' },
    { key: 'e', norm: '༣', shift: '3' },
    { key: 'r', norm: '༤', shift: '4' },
    { key: 't', norm: '༥', shift: '5' },
    { key: 'y', norm: '༦', shift: '6' },
    { key: 'u', norm: '༧', shift: '7' },
    { key: 'i', norm: '༨', shift: '8' },
    { key: 'o', norm: '༩', shift: '9' },
    { key: 'p', norm: '༠', shift: '0' }
  ],
  // Middle / Home Row
  [
    { key: 'a', norm: 'འ', shift: 'ཨ' },
    { key: 's', norm: 'ི', shift: 'ྀ' },
    { key: 'd', norm: 'ུ', shift: 'ཱ' },
    { key: 'f', norm: 'ེ', shift: 'ཻ' },
    { key: 'g', norm: 'ོ', shift: 'ཌྷ' },
    { key: 'h', norm: 'ཧ', shift: 'ཿ' },
    { key: 'j', norm: 'ཇ', shift: 'ྙ' },
    { key: 'k', norm: 'ཀ', shift: 'ཁ' },
    { key: 'l', norm: 'ལ', shift: 'ླ' },
    { key: '\'', norm: '་', shift: '།' }
  ],
  // Bottom Row
  [
    { key: 'shift', isShift: true },
    { key: 'z', norm: 'ཟ', shift: 'ཞ' },
    { key: 'x', norm: 'ཤ', shift: 'ཥ' },
    { key: 'c', norm: 'ཅ', shift: 'ཆ' },
    { key: 'v', norm: 'བ', shift: 'ཕ' },
    { key: 'b', norm: 'བ', shift: 'ྦ' },
    { key: 'n', norm: 'ན', shift: 'ཎ' },
    { key: 'm', norm: 'མ', shift: 'ང' },
    { key: 'delete', isDelete: true }
  ]
];

const LAYOUT_SUBSCRIPTS_VOWELS = [
  // Vowels & Grammatical Subscripts (ya, ra, la, wa)
  ['ི', 'ུ', 'ེ', 'ོ', 'ྱ', 'ྲ', 'ླ', 'ྭ'],
  // Subjoined consonants for superscript stacking (e.g. ར + ྦ = རྦ)
  ['ྐ', 'ྒ', 'ྔ', 'ྕ', 'ྗ', 'ྙ', 'ྟ', 'ྡ'],
  ['ྣ', 'ྤ', 'ྦ', 'ྨ', 'ྩ', 'ྫ', 'ྐྵ', '⌫'],
];

const LAYOUT_PUNCTUATION = [
  ['་', '།', '༎', '༏', '༐', '༑', '༔'],
  ['༠', '༡', '༢', '༣', '༤', '༥', '༦', '༧', '༨', '༩'],
  ['༄༅།', '༄', '༅', '༆', '༇', '⌫']
];

// Official Apple macOS / iOS Tibetan QWERTY Keyboard Layout Arrangement
const LAYOUT_MAC_QWERTY_ROWS = [
  // Top Row (QWERTYUIOP)
  [
    { key: 'q', norm: 'ྭ', shift: 'ྱ' },
    { key: 'w', norm: 'ཉ', shift: 'ཝ' },
    { key: 'e', norm: 'ེ', shift: 'ཻ' },
    { key: 'r', norm: 'ར', shift: 'ྲ' },
    { key: 't', norm: 'ཏ', shift: 'ཐ' },
    { key: 'y', norm: 'ཡ', shift: 'ྱ' },
    { key: 'u', norm: 'ུ', shift: 'ྃ' },
    { key: 'i', norm: 'ི', shift: 'ྀ' },
    { key: 'o', norm: 'ོ', shift: 'ཽ' },
    { key: 'p', norm: 'པ', shift: 'ཕ' }
  ],
  // Middle / Home Row (ASDFGHJKL;')
  [
    { key: 'a', norm: 'འ', shift: 'ཨ' },
    { key: 's', norm: 'ས', shift: 'ཤ' },
    { key: 'd', norm: 'ད', shift: 'ཌ' },
    { key: 'f', norm: 'ང', shift: 'ཁ' },
    { key: 'g', norm: 'ག', shift: 'ཊ' },
    { key: 'h', norm: 'ཧ', shift: 'ཿ' },
    { key: 'j', norm: 'ཇ', shift: 'ཪ' },
    { key: 'k', norm: 'ཀ', shift: 'ཁ' },
    { key: 'l', norm: 'ལ', shift: 'ླ' },
    { key: '\'', norm: '་', shift: '།' }
  ],
  // Bottom Row (ZXCVBNM)
  [
    { key: 'shift', isShift: true },
    { key: 'z', norm: 'ཟ', shift: 'ཞ' },
    { key: 'x', norm: 'ཛ', shift: 'ཥ' },
    { key: 'c', norm: 'ཅ', shift: 'ཆ' },
    { key: 'v', norm: 'ཙ', shift: 'ཚ' },
    { key: 'b', norm: 'བ', shift: 'ྦ' },
    { key: 'n', norm: 'ན', shift: 'ཎ' },
    { key: 'm', norm: 'མ', shift: 'ཾ' },
    { key: 'delete', isDelete: true }
  ]
];

let hardwareInputMode = localStorage.getItem('tibetan_input_mode') || 'explicit';
let currentPreset = localStorage.getItem('tibetan_keyboard_preset') || 'ewts';
let keyboardArrangement = currentPreset === 'alphabetical' ? 'alphabetical' : (currentPreset === 'sambhota' ? 'sambhota' : (currentPreset === 'mac-qwerty' ? 'mac-qwerty' : 'qwerty'));
let subjoinQueued = false;

// Wylie physical key mapping (latin key -> Tibetan character)
const WYLIE_KEY_MAP = {
  'k': 'ཀ', 'K': 'ཁ', 'g': 'ག', 'ng': 'ང', 'NG': 'ང',
  'c': 'ཅ', 'C': 'ཆ', 'j': 'ཇ', 'ny': 'ཉ', 'NY': 'ཉ',
  't': 'ཏ', 'T': 'ཐ', 'd': 'ད', 'n': 'ན', 'N': 'ཉ',
  'p': 'པ', 'P': 'ཕ', 'b': 'བ', 'm': 'མ', 'M': 'ང',
  'f': 'ཛ', 'F': 'ཛ', 'x': 'ཙ', 'X': 'ཚ',
  'ts': 'ཙ', 'TS': 'ཚ', 'dz': 'ཛ', 'DZ': 'ཛ', 'w': 'ཝ', 'W': 'ཝ',
  'z': 'ཟ', 'Z': 'ཞ', '\'': 'འ', 'v': 'འ', 'V': 'འ', 'y': 'ཡ', 'Y': 'ཡ',
  'r': 'ར', 'R': 'ར', 'l': 'ལ', 'L': 'ལ', 'sh': 'ཤ', 'SH': 'ཤ', 's': 'ས', 'S': 'ཤ',
  'h': 'ཧ', 'H': 'ཧ', 'a': 'ཨ', 'A': 'ཨ',
  'i': 'ི', 'u': 'ུ', 'e': 'ེ', 'o': 'ོ'
};

// Wylie Uppercase / Shift subjoined consonant mapping
const WYLIE_SUBJOINED_MAP = {
  'K': 'ྐ', 'G': 'ྒ', 'NG': 'ྔ',
  'C': 'ྕ', 'J': 'ྗ', 'NY': 'ྙ',
  'T': 'ྟ', 'D': 'ྡ', 'N': 'ྣ',
  'P': 'ྤ', 'B': 'ྦ', 'M': 'ྨ',
  'F': 'ྫ', 'X': 'ྩ',
  'TS': 'ྩ', 'DZ': 'ྫ',
  'W': 'ྭ', 'Y': 'ྱ', 'R': 'ྲ', 'L': 'ླ',
  'SH': 'ྵ', 'S': 'ྯ', 'H': 'ྷ'
};

// Tibetan character -> English QWERTY key sublabel mapping
const TIBETAN_TO_WYLIE_KEY = {
  'ཀ': 'k', 'ཁ': 'K', 'ག': 'g', 'ང': 'ng',
  'ཅ': 'c', 'ཆ': 'C', 'ཇ': 'j', 'ཉ': 'ny',
  'ཏ': 't', 'ཐ': 'T', 'ད': 'd', 'ན': 'n',
  'པ': 'p', 'ཕ': 'P', 'ྈ': 'P', 'བ': 'b', 'མ': 'm',
  'ཙ': 'x', 'ཚ': 'X', 'ཛ': 'f', 'ཝ': 'w',
  'ཞ': 'Z', 'ཟ': 'z', 'འ': '\'', 'ཡ': 'y',
  'ར': 'r', 'ལ': 'l', 'ཤ': 'sh', 'ས': 's',
  'ཧ': 'h', 'ཨ': 'a',
  'ི': 'i', 'ུ': 'u', 'ེ': 'e', 'ོ': 'o',
  'ྱ': 'y', 'ྲ': 'r', 'ླ': 'l', 'ྭ': 'w',
  'ྐ': 'K', 'ྒ': 'G', 'ྔ': 'NG', 'ྕ': 'C',
  'ྗ': 'J', 'ྙ': 'NY', 'ྟ': 'T', 'ྡ': 'D',
  'ྣ': 'N', 'ྤ': 'P', 'ྦ': 'B', 'ྨ': 'M',
  'ྩ': 'TS', 'ྫ': 'DZ'
};

// DOM Elements
const textDisplay = document.getElementById('text-display');
const committedTextEl = document.getElementById('committed-text');
const activeSyllableTextEl = document.getElementById('active-syllable-text');
const wylieTextEl = document.getElementById('wylie-text');
const grammarStatusEl = document.getElementById('grammar-status');
const keyboardContainer = document.getElementById('keyboard-container');

// Slot Elements
const slotElements = {
  prefix: document.getElementById('val-prefix'),
  superscript: document.getElementById('val-superscript'),
  root: document.getElementById('val-root'),
  subscript: document.getElementById('val-subscript'),
  vowel: document.getElementById('val-vowel'),
  suffix: document.getElementById('val-suffix'),
  secondSuffix: document.getElementById('val-secondSuffix'),
  particleVowel: document.getElementById('val-particleVowel')
};

// Slot Card Container Elements
const slotCards = {
  prefix: document.getElementById('slot-prefix'),
  superscript: document.getElementById('slot-superscript'),
  root: document.getElementById('slot-root'),
  subscript: document.getElementById('slot-subscript'),
  vowel: document.getElementById('slot-vowel'),
  suffix: document.getElementById('slot-suffix'),
  secondSuffix: document.getElementById('slot-2nd-suffix'),
  particleVowel: document.getElementById('slot-particle')
};

/**
 * Main render function updating Editor, Inspector, and Keyboard
 */
function renderApp() {
  // 1. Update Textarea
  const currentActiveString = buildDisplayString(syllableState);
  committedTextEl.textContent = committedText;
  activeSyllableTextEl.textContent = currentActiveString;

  // Auto scroll textarea to bottom
  textDisplay.scrollTop = textDisplay.scrollHeight;

  // 2. Update Wylie Transliteration
  let fullWylie = '';
  if (committedText) {
    const syllables = committedText.split(/(?<=[་།\s])/);
    fullWylie += syllables.map(s => {
      if (!s) return '';
      const parsed = parseTibetanSyllable(s.trim());
      return parsed ? syllableToWylie(parsed) : s;
    }).join(' ');
  }
  if (currentActiveString) {
    fullWylie += (fullWylie ? ' ' : '') + syllableToWylie(syllableState);
  }
  wylieTextEl.textContent = fullWylie || '...';

  // 3. Update Component Inspector Slots
  const slots = ['prefix', 'superscript', 'root', 'subscript', 'vowel', 'suffix', 'secondSuffix', 'particleVowel'];
  slots.forEach(slot => {
    const val = syllableState[slot] || '-';
    slotElements[slot].textContent = val;
    if (val !== '-') {
      slotCards[slot].classList.add('has-value');
    } else {
      slotCards[slot].classList.remove('has-value');
    }
  });

  // 4. Update Keyboard Key States (Active vs Grayed-out Disabled)
  renderKeyboard();
}

/**
 * Returns active physical key mapping (latin key -> Tibetan character) for current preset
 */
function getActiveKeyMap() {
  if (currentPreset === 'sambhota' || currentPreset === 'mac-qwerty') {
    const rows = (currentPreset === 'mac-qwerty') ? LAYOUT_MAC_QWERTY_ROWS : LAYOUT_SAMBHOTA_ROWS;
    const map = {};
    rows.forEach(row => {
      row.forEach(item => {
        if (item.key && item.norm) {
          map[item.key] = item.norm;
        }
        if (item.key && item.shift) {
          map[item.key.toUpperCase()] = item.shift;
        }
      });
    });
    return map;
  }
  return WYLIE_KEY_MAP;
}

/**
 * Returns active subjoined character mapping for current preset
 */
function getActiveSubjoinedMap() {
  if (currentPreset === 'sambhota' || currentPreset === 'mac-qwerty') {
    const rows = (currentPreset === 'mac-qwerty') ? LAYOUT_MAC_QWERTY_ROWS : LAYOUT_SAMBHOTA_ROWS;
    const map = {};
    rows.forEach(row => {
      row.forEach(item => {
        if (item.key && item.shift && item.shift.charCodeAt(0) >= 0x0F90 && item.shift.charCodeAt(0) <= 0x0FBC) {
          map[item.key.toUpperCase()] = item.shift;
        }
      });
    });
    return map;
  }
  return WYLIE_SUBJOINED_MAP;
}

/**
 * Renders the active layout keyboard with dynamic key state styling
 */
function renderKeyboard() {
  keyboardContainer.innerHTML = '';

  const isStructuredLayout = (currentLayout === 'consonants') && (keyboardArrangement === 'qwerty' || keyboardArrangement === 'sambhota' || keyboardArrangement === 'mac-qwerty');
  let activeStructuredRows = LAYOUT_QWERTY_ROWS;
  if (keyboardArrangement === 'sambhota') {
    activeStructuredRows = LAYOUT_SAMBHOTA_ROWS;
  } else if (keyboardArrangement === 'mac-qwerty') {
    activeStructuredRows = LAYOUT_MAC_QWERTY_ROWS;
  }

  if (isStructuredLayout) {
    // Render Physical Structured Layout Rows (QWERTY or Sambhota)
    activeStructuredRows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';

      row.forEach(item => {
        const keyBtn = document.createElement('button');
        keyBtn.className = 'key';

        if (item.isShift) {
          keyBtn.className = 'key key-wide key-shift' + (isShiftActive ? ' active' : '');
          keyBtn.innerHTML = '⇧ Shift';
          keyBtn.onclick = () => {
            isShiftActive = !isShiftActive;
            renderKeyboard();
          };
        } else if (item.isDelete) {
          keyBtn.classList.add('key-wide', 'key-allowed');
          keyBtn.innerHTML = '⌫ Delete';
          keyBtn.onclick = () => handleBackspace();
        } else if (currentPreset === 'mac-qwerty' && (item.key === 'q' || item.key === 'Q')) {
          keyBtn.className = 'key key-shift' + (subjoinQueued ? ' active' : '');
          keyBtn.innerHTML = `ྭ<span class="key-shift-corner">ྱ</span><span class="key-sublabel">q</span>`;
          keyBtn.onclick = () => {
            playKeySound('click');
            subjoinQueued = !subjoinQueued;
            renderKeyboard();
          };
        } else {
          let keyChar = (isShiftActive && item.shift) ? item.shift : item.norm;
          let cornerChar = (!isShiftActive && item.shift) ? item.shift : '';

          if (currentPreset === 'mac-qwerty' && subjoinQueued && keyChar) {
            const sub = getSubjoinedChar(keyChar);
            if (sub !== keyChar) {
              keyChar = sub;
            }
          }

          if (!keyChar) {
            keyBtn.classList.add('key-disabled');
            keyBtn.disabled = true;
          } else {
            keyBtn.innerHTML = `${keyChar}${cornerChar ? `<span class="key-shift-corner">${cornerChar}</span>` : ''}<span class="key-sublabel">${item.key}</span>`;

            const isAllowed = canAcceptChar(syllableState, keyChar);
            if (isAllowed) {
              keyBtn.classList.add('key-allowed');
              keyBtn.onclick = () => {
                subjoinQueued = false;
                handleInputChar(keyChar, keyBtn);
              };
            } else {
              keyBtn.classList.add('key-disabled');
              keyBtn.disabled = true;
              keyBtn.onclick = () => {
                subjoinQueued = false;
                triggerKeyError(keyBtn);
              };
            }
          }
        }

        rowEl.appendChild(keyBtn);
      });

      keyboardContainer.appendChild(rowEl);
    });
  } else {
    // Render Traditional Grid Layout Rows
    let layoutRows = LAYOUT_CONSONANTS;
    if (currentLayout === 'subscripts-vowels') {
      layoutRows = LAYOUT_SUBSCRIPTS_VOWELS;
    } else if (currentLayout === 'punctuation') {
      layoutRows = LAYOUT_PUNCTUATION;
    }

    layoutRows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';

      row.forEach(keyChar => {
        const keyBtn = document.createElement('button');
        keyBtn.className = 'key';

        if (keyChar === '⌫') {
          keyBtn.classList.add('key-wide', 'key-allowed');
          keyBtn.innerHTML = '⌫ Delete';
          keyBtn.onclick = () => handleBackspace();
        } else {
          const sublabel = TIBETAN_TO_WYLIE_KEY[keyChar] || '';
          keyBtn.innerHTML = `${keyChar}${sublabel ? `<span class="key-sublabel">${sublabel}</span>` : ''}`;

          const isAllowed = canAcceptChar(syllableState, keyChar);
          if (isAllowed) {
            keyBtn.classList.add('key-allowed');
            keyBtn.onclick = () => handleInputChar(keyChar, keyBtn);
          } else {
            keyBtn.classList.add('key-disabled');
            keyBtn.disabled = true;
            keyBtn.onclick = () => triggerKeyError(keyBtn);
          }
        }

        rowEl.appendChild(keyBtn);
      });

      keyboardContainer.appendChild(rowEl);
    });
  }

  // Add Bottom Row with Tsek, Space, Shad
  const bottomRow = document.createElement('div');
  bottomRow.className = 'keyboard-row';
  bottomRow.style.marginTop = '0.4rem';

  // Tsek button
  const tsekBtn = document.createElement('button');
  tsekBtn.className = 'key key-primary';
  tsekBtn.innerHTML = '་ <span class="key-sublabel">Tsek</span>';
  tsekBtn.onclick = () => handleInputChar('་', tsekBtn);
  bottomRow.appendChild(tsekBtn);

  // Space / Auto-Tsek Button
  const spaceBtn = document.createElement('button');
  spaceBtn.className = 'key key-space key-allowed';
  spaceBtn.innerHTML = 'Space ( ་ )';
  spaceBtn.onclick = () => handleInputChar('་', spaceBtn);
  bottomRow.appendChild(spaceBtn);

  // Shad button
  const shadBtn = document.createElement('button');
  shadBtn.className = 'key key-allowed';
  shadBtn.innerHTML = '། <span class="key-sublabel">Shad</span>';
  shadBtn.onclick = () => handleInputChar('།', shadBtn);
  bottomRow.appendChild(shadBtn);

  keyboardContainer.appendChild(bottomRow);
}

/**
 * Handles character input from virtual or physical keyboard
 */
function handleInputChar(char, btnElement = null) {
  const success = pushChar(syllableState, char);

  if (success) {
    playKeySound('click');
    grammarStatusEl.textContent = 'Grammar Valid';
    grammarStatusEl.className = 'grammar-status-badge';

    // If syllable was completed (Tsek/Shad typed), commit active string to committedText
    if (syllableState.isComplete) {
      committedText += buildDisplayString(syllableState);
      syllableState = createSyllableState();
    }

    renderApp();
  } else {
    triggerKeyError(btnElement);
  }
}

/**
 * Handles backspace / delete logic
 */
function handleBackspace() {
  playKeySound('click');

  if (syllableState.chars.length > 0) {
    popChar(syllableState);
  } else if (committedText.length > 0) {
    // Backspace into committed text: pop last character from committedText
    const chars = Array.from(committedText);
    chars.pop();
    committedText = chars.join('');

    // If committed text ends with a incomplete draft, pull back last syllable
    const lastTsekIdx = Math.max(committedText.lastIndexOf('་'), committedText.lastIndexOf('།'));
    if (lastTsekIdx !== -1 && lastTsekIdx < committedText.length - 1) {
      const draft = committedText.slice(lastTsekIdx + 1);
      committedText = committedText.slice(0, lastTsekIdx + 1);
      syllableState = createSyllableState();
      for (const c of draft) {
        pushChar(syllableState, c);
      }
    }
  }

  grammarStatusEl.textContent = 'Grammar Valid';
  grammarStatusEl.className = 'grammar-status-badge';
  renderApp();
}

/**
 * Triggers visual shake animation and audio error tone for invalid keypress
 */
function triggerKeyError(btnElement = null) {
  playKeySound('error');

  grammarStatusEl.textContent = 'Invalid Combination!';
  grammarStatusEl.className = 'grammar-status-badge status-blocked';

  if (btnElement) {
    btnElement.classList.add('shake-error');
    setTimeout(() => btnElement.classList.remove('shake-error'), 400);
  } else {
    textDisplay.classList.add('shake-error');
    setTimeout(() => textDisplay.classList.remove('shake-error'), 400);
  }

  setTimeout(() => {
    grammarStatusEl.textContent = 'Grammar Valid';
    grammarStatusEl.className = 'grammar-status-badge';
  }, 1500);
}

/**
 * Event Listeners & Hardware Keyboard Binding
 */
function initEventListeners() {
  // Sound Toggle Button
  document.getElementById('btn-sound-toggle').onclick = () => {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-status').textContent = soundEnabled ? 'ON' : 'OFF';
    document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
  };

  // Clear Button
  document.getElementById('btn-clear').onclick = () => {
    playKeySound('click');
    committedText = '';
    syllableState = createSyllableState();
    renderApp();
  };

  // Copy Button
  document.getElementById('btn-copy').onclick = () => {
    playKeySound('click');
    const fullText = committedText + syllableState.chars.join('');
    navigator.clipboard.writeText(fullText);
    const copyBtn = document.getElementById('btn-copy');
    copyBtn.innerHTML = '✅ Copied!';
    setTimeout(() => copyBtn.innerHTML = '📋 Copy', 1500);
  };

  // Sample Sentence Chips
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.onclick = () => {
      playKeySound('click');
      const sample = chip.getAttribute('data-sample');
      committedText = '';
      syllableState = createSyllableState();

      // Parse sample text and populate syllableState
      const parsed = parseTibetanSyllable(sample.trim());
      if (parsed) {
        syllableState.prefix = parsed.prefix || '';
        syllableState.superscript = parsed.superscript || '';
        syllableState.root = parsed.root || '';
        syllableState.subscript = parsed.subscript || '';
        syllableState.vowel = parsed.vowel || '';
        syllableState.suffix = parsed.suffix || '';
        syllableState.secondSuffix = parsed.secondSuffix || '';
        syllableState.particleVowel = parsed.particleVowel || '';
        syllableState.chars = Array.from(sample);
      } else {
        for (const char of sample) {
          pushChar(syllableState, char);
        }
      }
      renderApp();
    };
  });

  // Keyboard Layout Tab Switching
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.onclick = () => {
      playKeySound('click');
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentLayout = tab.getAttribute('data-layout');
      renderKeyboard();
    };
  });

  // Keyboard View Switcher (QWERTY Form vs Alphabetical Grid)
  const btnQwerty = document.getElementById('btn-view-qwerty');
  const btnAlphabetical = document.getElementById('btn-view-alphabetical');

  function updateViewButtons() {
    if (btnQwerty && btnAlphabetical) {
      if (keyboardArrangement === 'qwerty' || keyboardArrangement === 'sambhota' || keyboardArrangement === 'mac-qwerty') {
        btnQwerty.classList.add('active');
        btnAlphabetical.classList.remove('active');
      } else {
        btnAlphabetical.classList.add('active');
        btnQwerty.classList.remove('active');
      }
    }
    const presetSelectEl = document.getElementById('keyboard-preset-select');
    if (presetSelectEl) {
      presetSelectEl.value = currentPreset;
    }
  }
  updateViewButtons();

  if (btnQwerty) {
    btnQwerty.onclick = () => {
      playKeySound('click');
      currentPreset = 'ewts';
      keyboardArrangement = 'qwerty';
      localStorage.setItem('tibetan_keyboard_preset', 'ewts');
      localStorage.setItem('tibetan_keyboard_arrangement', 'qwerty');
      updateViewButtons();
      renderKeyboard();
    };
  }

  if (btnAlphabetical) {
    btnAlphabetical.onclick = () => {
      playKeySound('click');
      currentPreset = 'alphabetical';
      keyboardArrangement = 'alphabetical';
      localStorage.setItem('tibetan_keyboard_preset', 'alphabetical');
      localStorage.setItem('tibetan_keyboard_arrangement', 'alphabetical');
      updateViewButtons();
      renderKeyboard();
    };
  }

  function updateModeDropdown() {
    const modeSelectEl = document.getElementById('input-mode-select');
    if (modeSelectEl) {
      if (currentPreset === 'mac-qwerty') {
        modeSelectEl.value = 'explicit';
        modeSelectEl.disabled = true;
        modeSelectEl.title = 'Apple layout uses native explicit subjoin keys (q = ྭ, Q = ྱ, Shift+R = ྲ)';
      } else if (currentPreset === 'sambhota') {
        modeSelectEl.value = 'explicit';
        modeSelectEl.disabled = true;
        modeSelectEl.title = 'Sambhota layout uses native explicit subjoin key positions';
      } else {
        modeSelectEl.disabled = false;
        modeSelectEl.value = hardwareInputMode;
        modeSelectEl.title = 'Switch Hardware Keyboard Stacking Behavior';
      }
    }
  }

  // Keyboard Layout Preset Select Dropdown
  const presetSelectEl = document.getElementById('keyboard-preset-select');
  if (presetSelectEl) {
    presetSelectEl.value = currentPreset;
    presetSelectEl.onchange = (e) => {
      currentPreset = e.target.value;
      localStorage.setItem('tibetan_keyboard_preset', currentPreset);
      if (currentPreset === 'alphabetical') {
        keyboardArrangement = 'alphabetical';
      } else if (currentPreset === 'sambhota') {
        keyboardArrangement = 'sambhota';
      } else if (currentPreset === 'mac-qwerty') {
        keyboardArrangement = 'mac-qwerty';
      } else {
        keyboardArrangement = 'qwerty';
      }
      localStorage.setItem('tibetan_keyboard_arrangement', keyboardArrangement);
      updateViewButtons();
      updateModeDropdown();
      renderKeyboard();
    };
  }

  // Hardware Input Mode Select Dropdown
  const modeSelectEl = document.getElementById('input-mode-select');
  if (modeSelectEl) {
    updateModeDropdown();
    modeSelectEl.onchange = (e) => {
      if (currentPreset === 'ewts') {
        hardwareInputMode = e.target.value;
        localStorage.setItem('tibetan_input_mode', hardwareInputMode);
      }
    };
  }

  // Hardware Physical Keyboard Interceptor
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
      if (!isShiftActive) {
        isShiftActive = true;
        renderKeyboard();
      }
      return;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      handleInputChar('་');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputChar('།');
      return;
    }

    // Direct Tibetan Character input (e.g. if user has Tibetan OS keyboard layout active)
    if (e.key.length === 1 && e.key.charCodeAt(0) >= 0x0F00 && e.key.charCodeAt(0) <= 0x0FFF) {
      e.preventDefault();
      handleInputChar(e.key);
      return;
    }

    // Wylie inherent vowel 'a' handling:
    // 1. If at start of empty syllable -> input base consonant ཨ (A-chen)
    // 2. If a root consonant is already active -> 'a' seals inherent vowel, preventing subjoining
    const activeKeyMap = getActiveKeyMap();
    const activeSubjoinedMap = getActiveSubjoinedMap();

    // Wylie inherent vowel 'a' handling (for EWTS/Wylie preset):
    if (currentPreset === 'ewts' && (e.key === 'a' || e.key === 'A')) {
      if (syllableState.chars.length === 0 || syllableState.isComplete) {
        e.preventDefault();
        handleInputChar('ཨ');
        return;
      } else if (syllableState.root && !syllableState.vowel && !syllableState.suffix) {
        e.preventDefault();
        playKeySound('click');
        syllableState.inherentVowelSealed = true;
        grammarStatusEl.textContent = 'Grammar Valid';
        grammarStatusEl.className = 'grammar-status-badge';
        renderApp();
        return;
      }
    }

    // --- Mac QWERTY Preset q Subjoin Queue Interceptor ---
    if (currentPreset === 'mac-qwerty') {
      if (e.key === 'q' || e.key === 'Q') {
        if (syllableState.root && !syllableState.vowel && !syllableState.suffix) {
          e.preventDefault();
          playKeySound('click');
          subjoinQueued = !subjoinQueued;
          renderKeyboard();
          return;
        }
      }

      if (subjoinQueued && !e.shiftKey && activeKeyMap[e.key]) {
        subjoinQueued = false;
        const normChar = activeKeyMap[e.key];
        const subChar = getSubjoinedChar(normChar);
        if (canAcceptChar(syllableState, subChar)) {
          e.preventDefault();
          handleInputChar(subChar);
          return;
        } else {
          e.preventDefault();
          triggerKeyError();
          renderKeyboard();
          return;
        }
      }
    }

    // --- Mode 1: Explicit Subjoin Mode (Shift / Special keys input subjoined consonants) ---
    if ((hardwareInputMode === 'explicit' || currentPreset === 'mac-qwerty') && e.shiftKey) {
      const upperKey = e.key.toUpperCase();
      const subChar = activeSubjoinedMap[upperKey] || (activeKeyMap[e.key.toLowerCase()] ? getSubjoinedChar(activeKeyMap[e.key.toLowerCase()]) : null);
      if (subChar && canAcceptChar(syllableState, subChar)) {
        e.preventDefault();
        handleInputChar(subChar);
        return;
      }
    }

    // --- Mode 2: EWTS Auto-Stack Mode (Only active when preset is EWTS / Wylie) ---
    if (currentPreset === 'ewts' && hardwareInputMode === 'ewts' && !e.shiftKey && activeKeyMap[e.key]) {
      const baseChar = activeKeyMap[e.key];
      if (syllableState.root && !syllableState.inherentVowelSealed && !syllableState.vowel && !syllableState.subscript && !syllableState.suffix && !syllableState.superscript) {
        const subChar = getSubjoinedChar(baseChar);
        if (subChar !== baseChar && canAcceptChar(syllableState, subChar)) {
          e.preventDefault();
          handleInputChar(subChar);
          return;
        }
      }
    }

    // --- Default Mapping for Active Preset ---
    if (activeKeyMap[e.key]) {
      e.preventDefault();
      handleInputChar(activeKeyMap[e.key]);
      return;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
      if (isShiftActive) {
        isShiftActive = false;
        renderKeyboard();
      }
    }
  });
}

// Initialize Application on Load
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderApp();
});
