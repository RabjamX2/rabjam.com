// Tibetan Document Rule Checker Controller

import { validateTibetanDocument, validateTibetanSyllable } from './tibetanValidator.js';

// DOM Elements
const docInput = document.getElementById('doc-input');
const docReader = document.getElementById('document-reader');
const errorTableBody = document.getElementById('error-table-body');
const filterCategorySelect = document.getElementById('filter-category');
const searchErrorsInput = document.getElementById('search-errors');
const statusBadge = document.getElementById('checker-status-badge');

// Stats Elements
const badgeTotal = document.getElementById('badge-total-syllables');
const badgeValid = document.getElementById('badge-valid-syllables');
const badgeInvalid = document.getElementById('badge-invalid-syllables');
const badgeAccuracy = document.getElementById('badge-accuracy');

const valStatTotal = document.getElementById('val-stat-total');
const valStatValid = document.getElementById('val-stat-valid');
const valStatInvalid = document.getElementById('val-stat-invalid');
const valStatAccuracy = document.getElementById('val-stat-accuracy');

// Category Pills
const catPills = {
  prefix: document.getElementById('cat-prefix'),
  superscript: document.getElementById('cat-superscript'),
  subscript: document.getElementById('cat-subscript'),
  vowel: document.getElementById('cat-vowel'),
  suffix: document.getElementById('cat-suffix'),
  secondSuffix: document.getElementById('cat-secondSuffix')
};

// Application State
let currentAnalysis = null;

// Sample Text Definitions
const SAMPLE_ERRORS_TEXT = `༄༅། །བཀྲ་ཤིས་བདེ་ལེགས་ཕུན་སུམ་ཚོགས། 
འདི་ནི་བོད་ཡིག་གི་སུམ་ཅུ་པའི་རྩ་བའི་སྒྲ་སྦྱོར་བརྟག་དཔྱད་ཀྱི་དཔེ་ཚིག་ཡིན། 
དཔེར་ན། བསྒྲུབས་དང་བཀྲ་ཤིས་བདེ་ལེགས། མདོའི་དགེ་འདུན་གྱིས་བསྟན་པའོ།།`;

const SAMPLE_VALID_TEXT = `༄༅། །བཀྲ་ཤིས་བདེ་ལེགས་ཕུན་སུམ་ཚོགས། 
བྱང་ཆུབ་སེམས་དཔའི་སྤྱོད་པ་ལ་འཇུག་པ། 
དགེ་འདུན་གྱིས་བསྒྲུབས་པའི་བསྟན་པའོ།།`;

/**
 * Runs validation on document text and updates UI
 */
function analyzeDocument() {
  const text = docInput.value;
  currentAnalysis = validateTibetanDocument(text);
  renderMetrics();
  renderReaderView();
  renderErrorTable();
}

/**
 * Renders stats dashboard metrics
 */
function renderMetrics() {
  if (!currentAnalysis) return;

  const { totalSyllables, validSyllables, invalidSyllables, accuracyRate, errorSummary } = currentAnalysis;

  // Header badges
  badgeTotal.textContent = `Syllables: ${totalSyllables}`;
  badgeValid.textContent = `Valid: ${validSyllables}`;
  badgeInvalid.textContent = `Errors: ${invalidSyllables}`;
  badgeAccuracy.textContent = `Accuracy: ${accuracyRate}`;

  // Metric Cards
  valStatTotal.textContent = totalSyllables;
  valStatValid.textContent = validSyllables;
  valStatInvalid.textContent = invalidSyllables;
  valStatAccuracy.textContent = `${accuracyRate} Accuracy`;

  // Status Badge
  if (totalSyllables === 0) {
    statusBadge.textContent = 'Ready for Analysis';
    statusBadge.className = 'grammar-status-badge';
  } else if (invalidSyllables === 0) {
    statusBadge.textContent = '✅ 100% Grammar Valid';
    statusBadge.className = 'grammar-status-badge';
  } else {
    statusBadge.textContent = `⚠️ ${invalidSyllables} Rule Violation${invalidSyllables > 1 ? 's' : ''}`;
    statusBadge.className = 'grammar-status-badge status-blocked';
  }

  // Category Pills
  Object.keys(catPills).forEach(cat => {
    const count = errorSummary[cat] || 0;
    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (catPills[cat]) {
      catPills[cat].textContent = `${label}: ${count}`;
      if (count > 0) {
        catPills[cat].classList.add('has-errors');
      } else {
        catPills[cat].classList.remove('has-errors');
      }
    }
  });
}

/**
 * Renders interactive document reader with color-coded token badges
 */
function renderReaderView() {
  if (!currentAnalysis || currentAnalysis.tokens.length === 0) {
    docReader.innerHTML = `<div class="empty-reader-notice">Paste a document above or click a preset sample to view highlighted syllable breakdown and rule diagnostics.</div>`;
    return;
  }

  docReader.innerHTML = '';
  let currentLine = 1;
  let lineWrapper = document.createElement('div');
  lineWrapper.className = 'reader-line';

  const lineNumSpan = document.createElement('span');
  lineNumSpan.className = 'line-number';
  lineNumSpan.textContent = '1';
  lineWrapper.appendChild(lineNumSpan);

  currentAnalysis.tokens.forEach((token, idx) => {
    if (token.line > currentLine) {
      docReader.appendChild(lineWrapper);
      currentLine = token.line;
      lineWrapper = document.createElement('div');
      lineWrapper.className = 'reader-line';
      const numSpan = document.createElement('span');
      numSpan.className = 'line-number';
      numSpan.textContent = String(currentLine);
      lineWrapper.appendChild(numSpan);
    }

    if (!token.isTibetan) {
      const textSpan = document.createElement('span');
      textSpan.className = 'token-non-tibetan';
      textSpan.textContent = (token.text || '') + (token.delimiter || '');
      lineWrapper.appendChild(textSpan);
    } else {
      const syllableSpan = document.createElement('span');
      syllableSpan.className = 'syllable-token' + (token.isValid ? ' token-valid' : ' token-invalid');
      syllableSpan.setAttribute('data-token-idx', idx);

      syllableSpan.innerHTML = `${token.text}<span class="token-delimiter">${token.delimiter || ''}</span>`;

      if (!token.isValid) {
        const errorMsg = token.errors.map(e => `${e.title}: ${e.message}`).join('\n');
        syllableSpan.title = errorMsg;

        syllableSpan.onclick = () => {
          document.querySelectorAll('.token-invalid').forEach(el => el.classList.remove('active-error-highlight'));
          syllableSpan.classList.add('active-error-highlight');
          highlightTableRow(idx);
        };
      }

      lineWrapper.appendChild(syllableSpan);
    }
  });

  docReader.appendChild(lineWrapper);
}

/**
 * Highlights corresponding error row in Diagnostic Log Table
 */
function highlightTableRow(tokenIdx) {
  const row = document.querySelector(`tr[data-token-idx="${tokenIdx}"]`);
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('table-row-highlight');
    setTimeout(() => row.classList.remove('table-row-highlight'), 2000);
  }
}

/**
 * Renders diagnostic error log table
 */
function renderErrorTable() {
  if (!currentAnalysis) return;

  const selectedCategory = filterCategorySelect.value;
  const searchQuery = searchErrorsInput.value.toLowerCase().trim();

  errorTableBody.innerHTML = '';

  const invalidTokens = currentAnalysis.tokens.filter(t => t.isTibetan && !t.isValid);

  if (invalidTokens.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="6" class="no-errors-cell">✨ Great job! No grammar rule violations detected in this document.</td>`;
    errorTableBody.appendChild(emptyRow);
    return;
  }

  let rowCount = 0;

  currentAnalysis.tokens.forEach((token, tokenIdx) => {
    if (!token.isTibetan || token.isValid) return;

    token.errors.forEach(err => {
      // Filter by category
      if (selectedCategory !== 'all' && err.category !== selectedCategory) {
        return;
      }

      // Filter by search query
      if (searchQuery) {
        const searchText = `${token.line} ${token.text} ${err.category} ${err.title} ${err.section} ${err.message}`.toLowerCase();
        if (!searchText.includes(searchQuery)) return;
      }

      rowCount++;
      const tr = document.createElement('tr');
      tr.setAttribute('data-token-idx', tokenIdx);

      const categoryBadgeClass = `cat-badge cat-${err.category}`;

      tr.innerHTML = `
        <td class="col-line">L${token.line}</td>
        <td class="col-syllable"><span class="tibetan-syllable-display">${token.text}</span></td>
        <td class="col-category"><span class="${categoryBadgeClass}">${err.category}</span></td>
        <td class="col-section"><span class="section-tag">${err.section}</span></td>
        <td class="col-message">
          <strong>${err.title}</strong>
          <p>${err.message}</p>
        </td>
        <td class="col-suggestion">${err.suggestion || '-'}</td>
      `;

      errorTableBody.appendChild(tr);
    });
  });

  if (rowCount === 0) {
    const noMatchRow = document.createElement('tr');
    noMatchRow.innerHTML = `<td colspan="6" class="no-errors-cell">No errors matched your active filter or search criteria.</td>`;
    errorTableBody.appendChild(noMatchRow);
  }
}

/**
 * Copies diagnostic summary report to clipboard
 */
function copyDiagnosticReport() {
  if (!currentAnalysis || currentAnalysis.totalSyllables === 0) return;

  let report = `=== TIBETAN GRAMMAR RULE DIAGNOSTIC REPORT ===\n`;
  report += `Total Syllables: ${currentAnalysis.totalSyllables}\n`;
  report += `Valid Syllables: ${currentAnalysis.validSyllables}\n`;
  report += `Rule Violations: ${currentAnalysis.invalidSyllables}\n`;
  report += `Accuracy Rate: ${currentAnalysis.accuracyRate}\n\n`;

  report += `--- DETAILED VIOLATION LOG ---\n`;
  let errNum = 1;
  currentAnalysis.tokens.forEach(token => {
    if (!token.isValid) {
      token.errors.forEach(err => {
        report += `#${errNum} Line ${token.line} | Syllable: "${token.text}"\n`;
        report += `    Rule: ${err.title} (${err.section})\n`;
        report += `    Details: ${err.message}\n`;
        report += `    Suggestion: ${err.suggestion}\n\n`;
        errNum++;
      });
    }
  });

  navigator.clipboard.writeText(report);
  const copyBtn = document.getElementById('btn-copy-report');
  copyBtn.innerHTML = '✅ Copied Report!';
  setTimeout(() => copyBtn.innerHTML = '📋 Copy Report', 1500);
}

/**
 * Exports full report as JSON file download
 */
function exportJsonReport() {
  if (!currentAnalysis) return;

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentAnalysis, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `tibetan_grammar_report_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Event Listeners Initialization
 */
function initEventListeners() {
  // Real-time Document Input
  docInput.addEventListener('input', analyzeDocument);
  docInput.addEventListener('paste', () => setTimeout(analyzeDocument, 50));

  // Filters
  filterCategorySelect.addEventListener('change', renderErrorTable);
  searchErrorsInput.addEventListener('input', renderErrorTable);

  // Buttons
  document.getElementById('btn-sample-errors').onclick = () => {
    docInput.value = SAMPLE_ERRORS_TEXT;
    analyzeDocument();
  };

  document.getElementById('btn-sample-valid').onclick = () => {
    docInput.value = SAMPLE_VALID_TEXT;
    analyzeDocument();
  };

  document.getElementById('btn-clear-doc').onclick = () => {
    docInput.value = '';
    analyzeDocument();
  };

  document.getElementById('btn-copy-report').onclick = copyDiagnosticReport;
  document.getElementById('btn-export-json').onclick = exportJsonReport;

  // Auto-analyze initial sample with errors on first load
  docInput.value = SAMPLE_ERRORS_TEXT;
  analyzeDocument();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initEventListeners);
