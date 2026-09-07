// UI-facing frequency analyzer: updates IC/entropy/chi-square, n-grams,
// charts, and Norwegian language hints for Caesar analysis panels.
import {
  calculateChiSquare,
  calculateEntropy,
  calculateIC,
  calculateNgramScore,
  calculateSlidingWindowIC,
  checkNorwegianChars,
  countNorwegianWords,
  detectLanguageVariant,
  getTopNgrams,
  interpretICConfidence,
  sanitizeText,
  validateText,
  escapeHtml,
  setSafeText
} from '../../core/utils.js'
import { NORWEGIAN_FREQ } from '../../core/constants.js'

export class FrequencyAnalyzer {
  constructor () {
    this.currentNgramType = 'quadgram'
    this.customNgramLength = 7
  }

  handleNgramChange (value, customLength) {
    this.currentNgramType = value || 'quadgram'
    if (this.currentNgramType === 'custom' && customLength) {
      this.customNgramLength = Number(customLength) || 7
    }
  }

  getNgramLength () {
    if (this.currentNgramType === 'bigram') return 2
    if (this.currentNgramType === 'trigram') return 3
    if (this.currentNgramType === 'pentagram') return 5
    if (this.currentNgramType === 'hexagram') return 6
    if (this.currentNgramType === 'custom') return this.customNgramLength
    return 4
  }

  updateFrequencyAnalysis (text) {
    if (!text) return

    // Sanitize and validate input
    const sanitized = sanitizeText(text, {
      maxLength: 50000,
      allowNewlines: true,
      allowSpecialChars: true
    })

    const validation = validateText(sanitized, {
      maxLength: 50000
    })

    if (!validation.valid) {
      console.warn('Text validation failed:', validation.errors)
      return
    }

    const ic = calculateIC(sanitized)
    const icEl = document.getElementById('icValue')
    if (icEl) setSafeText(icEl, ic.toFixed(4))

    const slidingIC = calculateSlidingWindowIC(sanitized)
    const icConf = document.getElementById('icConfidence')
    if (icConf) setSafeText(icConf, interpretICConfidence(slidingIC))

    const entropy = calculateEntropy(sanitized)
    const entropyEl = document.getElementById('entropyValue')
    if (entropyEl) setSafeText(entropyEl, entropy.toFixed(2))
    const entropyInterp = document.getElementById('entropyInterpret')
    if (entropyInterp) setSafeText(entropyInterp, entropy < 4.0 ? 'Strukturert' : 'Tilfeldig')

    const chi = calculateChiSquare(sanitized, NORWEGIAN_FREQ)
    const chiEl = document.getElementById('chiSquare')
    if (chiEl) setSafeText(chiEl, chi.toFixed(2))
    const chiQuality = document.getElementById('chiSquareQuality')
    if (chiQuality) {
      setSafeText(chiQuality, chi < 100 ? 'Godt match' : chi < 300 ? 'Middels' : 'Dårlig match')
    }

    const langVariant = detectLanguageVariant(sanitized)
    const langEl = document.getElementById('detectedLang')
    if (langEl) setSafeText(langEl, langVariant)

    const ngramLength = this.getNgramLength()
    const topNgrams = getTopNgrams(sanitized, ngramLength, 1)
    const topNgramEl = document.getElementById('topNgram')
    if (topNgramEl && topNgrams.length > 0) {
      setSafeText(topNgramEl, topNgrams[0].ngram)
    }

    const ngramScore = calculateNgramScore(sanitized, this.currentNgramType)
    const ngramScoreEl = document.getElementById('ngramScore')
    if (ngramScoreEl) setSafeText(ngramScoreEl, ngramScore.toFixed(2))

    this.updateFrequencyChart(sanitized)
    this.updateNgramTable(sanitized, ngramLength)
  }

  updateFrequencyChart (text) {
    const chartEl = document.getElementById('frequencyChart')
    if (!chartEl) return

    const clean = text.toUpperCase().replace(/[^A-ZÆØÅ]/g, '')
    const freq = {}
    for (const char of clean) {
      freq[char] = (freq[char] || 0) + 1
    }
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ'.split('')
    const maxCount = Math.max(...Object.values(freq), 1)
    let html = ''
    for (const letter of alphabet) {
      const count = freq[letter] || 0
      const height = (count / maxCount) * 100
      // Escape letter for safe output
      const safeLetter = escapeHtml(letter)
      const safeHeight = Math.max(0, Math.min(100, height)) // Clamp to 0-100
      html += `<div class="bar-container bar-container-flex"><div class="bar bar-fill" style="height: ${safeHeight}%;" title="${safeLetter}"></div><div class="bar-label bar-label-styled">${safeLetter}</div></div>`
    }
    chartEl.innerHTML = html
  }

  updateNgramTable (text, n) {
    const tableEl = document.getElementById('ngram-table')
    if (!tableEl) return

    // Validate n-gram length
    const ngramLength = Math.max(1, Math.min(10, parseInt(n) || 4))

    const topNgrams = getTopNgrams(text, ngramLength, 10)
    if (topNgrams.length === 0) {
      tableEl.innerHTML = '<p class="pattern-empty">Ingen n-grammer funnet</p>'
      return
    }
    let html = '<table class="ngram-table">'
    html += '<tr class="ngram-header"><th>N-gram</th><th>Frekvens</th></tr>'
    topNgrams.forEach((ng) => {
      // Escape n-gram for safe output
      const safeNgram = escapeHtml(ng.ngram)
      const safeCount = parseInt(ng.count) || 0
      html += `<tr class="ngram-row"><td><code class="ngram-chip">${safeNgram}</code></td><td class="ngram-count">${safeCount}</td></tr>`
    })
    html += '</table>'
    tableEl.innerHTML = html
  }

  updateFrequencyChartsSubstitution (text) {
    // Sanitize text first
    const sanitized = sanitizeText(text, { maxLength: 50000 })

    const freq = {}
    sanitized.toUpperCase().split('').forEach((c) => {
      if (c.match(/[A-ZÆØÅ]/)) freq[c] = (freq[c] || 0) + 1
    })
    const total = Object.values(freq).reduce((a, b) => a + b, 0)
    const cipherChart = document.getElementById('cipherFreqChart')
    if (cipherChart) {
      const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
      cipherChart.innerHTML = sorted
        .map(([letter, count]) => {
          const percent = ((count / total) * 100).toFixed(1)
          const safeLetter = escapeHtml(letter)
          const safePercent = Math.max(0, Math.min(100, parseFloat(percent) || 0))
          const safeWidth = Math.max(0, Math.min(500, safePercent * 5))
          return `<div class="freq-chart-item"><span class="freq-chart-letter">${safeLetter}:</span><span class="freq-chart-percent">${safePercent}%</span><div class="freq-chart-bar freq-chart-bar-cyan" style="width: ${safeWidth}px;"></div></div>`
        })
        .join('')
    }
    const norwegianChart = document.getElementById('norwegianFreqChart')
    if (norwegianChart) {
      const norFreq = [
        ['E', 16.72], ['R', 8.97], ['N', 7.85], ['T', 7.24], ['A', 6.84],
        ['I', 6.05], ['S', 5.93], ['L', 5.14], ['O', 4.98], ['D', 4.51]
      ]
      norwegianChart.innerHTML = norFreq
        .map(([letter, percent]) => {
          const safeLetter = escapeHtml(letter)
          const safePercent = Math.max(0, Math.min(100, parseFloat(percent) || 0))
          const safeWidth = Math.max(0, Math.min(500, safePercent * 5))
          return `<div class="freq-chart-item"><span class="freq-chart-letter-norwegian">${safeLetter}:</span><span class="freq-chart-percent">${safePercent}%</span><div class="freq-chart-bar freq-chart-bar-green" style="width: ${safeWidth}px;"></div></div>`
        })
        .join('')
    }
  }

  countNorwegianWords (text) {
    return countNorwegianWords(text)
  }

  checkNorwegianChars (text) {
    return checkNorwegianChars(text)
  }
}
