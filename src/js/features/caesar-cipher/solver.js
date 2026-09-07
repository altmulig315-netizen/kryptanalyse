// Decision-engine for Caesar solving: brute force, auto-solve with ensemble
// scoring, hill climbing, pattern/crib search, and polyalphabetic tests.
import {
  ALPHABETS,
  NORWEGIAN_FREQ
} from '../../core/constants.js'
import {
  caesarTransform,
  calculateChiSquare,
  calculateEntropy,
  calculateNgramScore,
  calculateSlidingWindowIC,
  checkImprobableSequences,
  checkNorwegianChars,
  countNorwegianWords,
  detectLanguageVariant,
  detectPatterns,
  detectPolyalphabetic,
  interpretICConfidence,
  sanitizeText,
  escapeHtml
} from '../../core/utils.js'
import { FrequencyAnalyzer } from './analyzer.js'

export class AutoSolver {
  constructor (alphabetKey = 'norwegian', analyzer = new FrequencyAnalyzer()) {
    this.alphabetKey = alphabetKey
    this.analyzer = analyzer
  }

  setAlphabet (alphabetKey) {
    this.alphabetKey = alphabetKey || 'norwegian'
  }

  calculateEnsembleScore (text) {
    const textLength = text.replace(/[^A-ZÆØÅ]/gi, '').length
    let w
    if (textLength <= 40) {
      w = { chiSquare: 0.15, bigram: 0.25, trigram: 0.2, quadgram: 0.15, dictionary: 0.2, improbable: 0.05 }
    } else if (textLength <= 200) {
      w = { chiSquare: 0.2, bigram: 0.2, trigram: 0.2, quadgram: 0.15, dictionary: 0.15, improbable: 0.1 }
    } else {
      w = { chiSquare: 0.3, bigram: 0.15, trigram: 0.15, quadgram: 0.2, dictionary: 0.1, improbable: 0.1 }
    }
    const chiSquare = calculateChiSquare(text, NORWEGIAN_FREQ)
    const bigramScore = -calculateNgramScore(text, 'bigram')
    const trigramScore = -calculateNgramScore(text, 'trigram')
    const quadgramScore = -calculateNgramScore(text, 'quadgram')
    const dictionaryScore = -(countNorwegianWords(text) * 2)
    const improbablePenalty = checkImprobableSequences(text)
    return (
      w.chiSquare * chiSquare +
      w.bigram * bigramScore +
      w.trigram * trigramScore +
      w.quadgram * quadgramScore +
      w.dictionary * dictionaryScore +
      w.improbable * improbablePenalty
    )
  }

  autoSolve (text) {
    if (!text) return

    // Sanitize input text
    const sanitizedText = sanitizeText(text, {
      maxLength: 50000,
      allowNewlines: true
    })

    if (!sanitizedText) return

    const mode = document.getElementById('analysisMode')?.value || 'educational'
    const panel = document.getElementById('autoSolvePanel')
    const results = document.getElementById('autoSolveResults')
    if (!panel || !results) return
    panel.classList.remove('auto-solve-hidden')
    results.innerHTML = '<div class="p-20 text-center color-cyan">🔬 Analyserer med beslutningsmotor...</div>'
    const alphabet = ALPHABETS[this.alphabetKey] || ALPHABETS.norwegian
    const icData = calculateSlidingWindowIC(sanitizedText)
    const entropy = calculateEntropy(sanitizedText)
    const icConfidence = interpretICConfidence(icData)
    const candidates = []
    for (let shift = 0; shift < alphabet.length; shift++) {
      const decrypted = caesarTransform(sanitizedText, shift, this.alphabetKey, false)
      const ensembleScore = this.calculateEnsembleScore(decrypted)
      const wordCount = countNorwegianWords(decrypted)
      const norwegianCharsDecrypted = checkNorwegianChars(decrypted)
      const languageVariant = detectLanguageVariant(decrypted)
      let aeoeaaBonus = 0
      if (norwegianCharsDecrypted.hasAeOeAa && norwegianCharsDecrypted.percentage > 0.5) {
        aeoeaaBonus = -20
      }
      const finalScore = ensembleScore + aeoeaaBonus
      candidates.push({
        shift,
        text: decrypted,
        score: finalScore,
        wordCount,
        languageVariant,
        hasNorwegianChars: norwegianCharsDecrypted.hasAeOeAa,
        norwegianCharPercent: norwegianCharsDecrypted.percentage
      })
    }
    candidates.sort((a, b) => a.score - b.score)
    const bestScore = candidates[0].score
    const secondBestScore = candidates[1].score
    const scoreGap = secondBestScore - bestScore
    let confidence = 'low'
    let confidencePercent = 30 + scoreGap * 3
    if (scoreGap > 50) {
      confidence = 'very_high'
      confidencePercent = Math.min(99, 80 + scoreGap / 5)
    } else if (scoreGap > 20) {
      confidence = 'high'
      confidencePercent = 70 + scoreGap
    } else if (scoreGap > 10) {
      confidence = 'medium'
      confidencePercent = 50 + scoreGap * 2
    }
    const renderLearningMode = () => {
      let html = '<div class="analysis-report-box">'
      html += '<h3 class="analysis-report-title">🔬 Analyserapport</h3>'
      html += '<div class="analysis-report-content">'
      html += `<strong>📏 Tekstlengde:</strong> ${escapeHtml(sanitizedText.replace(/[^A-ZÆØÅ]/gi, '')).length} tegn<br>`
      html += `<strong>🎲 Entropy:</strong> ${entropy.toFixed(3)} bits (${entropy < 4.0 ? 'strukturert' : 'tilfeldig'})<br>`
      html += `<strong>🔍 IC:</strong> ${icData.mean.toFixed(4)} ± ${icData.stdDev.toFixed(4)}<br>`
      html += `<strong>🎯 IC-konfidans:</strong> ${icConfidence}<br>`
      html += '</div></div>'
      for (let i = 0; i < Math.min(3, candidates.length); i++) {
        const candidate = candidates[i]
        const isRecommended = i === 0
        const gap = i > 0 ? candidates[i].score - bestScore : 0
        const confidenceClass = isRecommended && confidence === 'low'
          ? 'confidence-low'
          : isRecommended && confidence === 'medium'
            ? 'confidence-medium'
            : 'confidence-high'
        const badgeText = isRecommended
          ? `${confidencePercent.toFixed(0)}% - ${confidence === 'very_high' ? 'Ekstremt høy tillit' : confidence === 'high' ? 'Høy tillit' : 'Moderat tillit'}`
          : `Alternativ (+${gap.toFixed(1)} score)`
        html += `
          <div class="auto-solve-card auto-solve-result-card" data-shift="${candidate.shift}">
            <span class="confidence-badge confidence-badge-custom ${isRecommended ? 'confidence-badge-recommended' : 'confidence-badge-alternative'} ${confidenceClass}">
              ${isRecommended ? '🏆 ' : ''}${badgeText}
            </span>
            <div class="result-shift-label">
              ${isRecommended ? '🔐 Anbefalt løsning: ' : ''}Shift ${candidate.shift}
              ${candidate.hasNorwegianChars ? ' ✓ ÆØÅ' : ''}
              ${candidate.wordCount > 0 ? ` (${candidate.wordCount} ord)` : ''}
            </div>
              <div class="result-text result-text-truncated">${escapeHtml(candidate.text.substring(0, 200))}${candidate.text.length > 200 ? '...' : ''}</div>
            <div class="result-metadata">
              📊 Score: ${candidate.score.toFixed(2)} | 🧠 Språk: ${candidate.languageVariant} ${candidate.norwegianCharPercent > 0 ? `(${candidate.norwegianCharPercent.toFixed(1)}% ÆØÅ)` : ''}
            </div>
          </div>`
      }
      html += '<div class="explanation-box">'
      html += '<strong>💡 Hvorfor er vi sikre?</strong><br>'
      html += `• Statistisk gap: ${scoreGap.toFixed(1)}<br>`
      html += '• Ensemble-score kombinert med språkprofil'
      html += '</div>'
      return html
    }
    const renderCTFMode = () => {
      const best = candidates[0]
      return `
          <div class="result-text auto-solve-card-result">${escapeHtml(best.text)}</div>
        <div class="mt-10 color-muted text-center">Shift: ${best.shift} | Confidence: ${confidencePercent.toFixed(0)}%</div>`
    }
    results.innerHTML = mode === 'ctf' ? renderCTFMode() : renderLearningMode()
    results.querySelectorAll('.auto-solve-result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const shift = Number(card.dataset.shift || 0)
        const output = document.getElementById('outputText')
        const shiftValue = document.getElementById('shiftValue')
        const candidate = candidates.find((c) => c.shift === shift)
        if (output && candidate) output.value = candidate.text
        if (shiftValue) shiftValue.value = shift
      })
    })
    const output = document.getElementById('outputText')
    if (output) output.value = candidates[0].text
  }

  bruteForce (text) {
    if (!text) return

    // Sanitize input text
    const sanitizedText = sanitizeText(text, {
      maxLength: 50000,
      allowNewlines: true
    })

    if (!sanitizedText) return

    const panel = document.getElementById('bruteForcePanel')
    const results = document.getElementById('bruteForceResults')
    if (!panel || !results) return
    let html = ''
    for (let shift = 0; shift < 26; shift++) {
      const decoded = caesarTransform(sanitizedText, shift, this.alphabetKey, false)
      html += `
        <div class="brute-result-card" data-shift="${shift}">
          <h3>Shift ${shift}</h3>
          <p>${escapeHtml(decoded.substring(0, 150))}${decoded.length > 150 ? '...' : ''}</p>
        </div>`
    }
    results.innerHTML = html
    panel.classList.remove('brute-force-hidden')
    results.querySelectorAll('.brute-result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const shift = Number(card.dataset.shift || 0)
        const decoded = caesarTransform(sanitizedText, shift, this.alphabetKey, false)
        const output = document.getElementById('outputText')
        const shiftValue = document.getElementById('shiftValue')
        if (output) output.value = decoded
        if (shiftValue) shiftValue.value = shift
      })
    })
  }

  performAdvancedHillClimbing (text) {
    const candidates = []
    for (let shift = 0; shift < 26; shift++) {
      const decoded = caesarTransform(text, shift, this.alphabetKey, false)
      const ensembleScore = this.calculateEnsembleScore(decoded)
      const wordCount = countNorwegianWords(decoded)
      const norwegianCharsData = checkNorwegianChars(decoded)
      let aeoeaaBonus = 0
      if (norwegianCharsData.hasAeOeAa && norwegianCharsData.percentage > 0.5) {
        aeoeaaBonus = -20
      }
      const finalScore = ensembleScore + aeoeaaBonus
      candidates.push({ shift, text: decoded, score: finalScore, wordCount })
    }
    candidates.sort((a, b) => a.score - b.score)
    const bestScore = candidates[0].score
    const secondBestScore = candidates[1].score
    const scoreGap = secondBestScore - bestScore
    const confidence = Math.min(99, 50 + scoreGap)
    return { shift: candidates[0].shift, text: candidates[0].text, score: bestScore, wordCount: candidates[0].wordCount, confidence }
  }

  runHillClimbing (text) {
    if (!text) return
    const result = this.performAdvancedHillClimbing(text)
    const hillIterations = document.getElementById('hillIterations')
    const hillBestScore = document.getElementById('hillBestScore')
    const hillResult = document.getElementById('hillClimbingResult')
    if (hillIterations) hillIterations.textContent = '26'
    if (hillBestScore) hillBestScore.textContent = result.score.toFixed(2)
    if (hillResult) hillResult.textContent = `Shift ${result.shift} | ${result.confidence.toFixed(0)}%`
    const output = document.getElementById('outputText')
    if (output) output.value = result.text
  }

  runPatternRecognition (text) {
    if (!text) return
    const patterns = detectPatterns(text)
    const resultsDiv = document.getElementById('patternResults')
    if (!resultsDiv) return
    let html = '<div class="pattern-wrapper">'
    html += '<h4 class="pattern-title">🎯 Mønstre funnet:</h4>'
    if (patterns.common.length > 0) {
      html += `<p class="pattern-summary">Fant ${patterns.count} repeterende mønstre:</p>`
      patterns.common.slice(0, 10).forEach((p) => {
        html += `<div class="pattern-card"><strong class="pattern-highlight">${p.pattern}</strong> - ${p.frequency} ganger</div>`
      })
    } else {
      html += '<p class="pattern-empty">Ingen repeterende mønstre funnet</p>'
    }
    html += '</div>'
    resultsDiv.innerHTML = html
  }

  runPolyalphabeticTest (text) {
    if (!text) return
    const { ic } = detectPolyalphabetic(text)
    const polyResults = document.getElementById('polyResults')
    if (polyResults) {
      polyResults.textContent = `IC: ${ic.toFixed(4)}`
    }
  }

  searchCribs (text, cribInput) {
    if (!text || !cribInput) return
    const cribList = cribInput.split(',').map((c) => c.trim().toLowerCase())
    const resultsDiv = document.getElementById('cribResults')
    if (!resultsDiv) return
    let results = '<div class="poly-detection-box">'
    results += '<h4 class="substitution-title mb-10">🔍 Crib Søkeresultater:</h4>'
    let foundAny = false
    const alphabet = ALPHABETS[this.alphabetKey] || ALPHABETS.norwegian
    for (let shift = 0; shift < alphabet.length; shift++) {
      const decrypted = caesarTransform(text, shift, this.alphabetKey, false)
      const lowerDecoded = decrypted.toLowerCase()
      for (const crib of cribList) {
        if (crib && lowerDecoded.includes(crib)) {
          foundAny = true
          results += `<div class="pattern-card"><strong class="pattern-highlight">✅ Funnet "${crib}" med shift ${shift}</strong><br><div class="poly-detection-text">${decrypted.substring(0, 150)}...</div></div>`
        }
      }
    }
    if (!foundAny) {
      results += '<div class="pattern-empty">❌ Ingen cribs funnet i noen shift</div>'
    }
    results += '</div>'
    resultsDiv.innerHTML = results
  }
}
