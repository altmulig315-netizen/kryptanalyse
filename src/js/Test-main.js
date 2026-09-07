// Entry bootstrap: wires UI modules (carousel, gallery, dark mode, modal),
// password checker, and Caesar analyzer/solver once DOM is ready.
import { initCarousel } from './modules/carousel.js'
import { initGallery } from './modules/gallery.js'
import { initDarkMode } from './modules/darkmode.js'
import { initModal } from './modules/modal.js'
import { PasswordChecker } from './features/password-checker/validator.js'
import { FrequencyAnalyzer } from './features/caesar-cipher/analyzer.js'
import { AutoSolver } from './features/caesar-cipher/solver.js'
import { 
  debounce, 
  caesarShift, 
  updateLegacyResult,
  validateFile,
  sanitizeText,
  validateNumber,
  escapeHtml
} from './core/utils.js'

document.addEventListener('DOMContentLoaded', () => {
  // Basic console mock/banner retained
  console.log('               WILLIAMS GRILL')
  console.log('---------------------------------------------')
  console.log('               Order Details')
  console.log('---------------------------------------------')
  console.log(' Item,            Quantity,             Price')
  console.log('---------------------------------------------')
  console.log('Burger                1                 3')
  console.log('Soda                  1                 2')
  console.log('Fries                 1                 4')
  console.log('---------------------------------------------')
  console.log('                     Total              9')
  console.log('=============================================')

  // Legacy Caesar decoder (top inputs): keep wired
  const cipherInput = document.getElementById('cipherText')
  const keyInput = document.getElementById('key')
  const keyValue = document.getElementById('keyValue')
  const resultDiv = document.getElementById('result')
  if (cipherInput && keyInput && keyValue && resultDiv) {
    updateLegacyResult(cipherInput, keyInput, keyValue, resultDiv)
  }

  // Initialize UI modules
  initCarousel()
  initGallery()
  initDarkMode()
  initModal()
  // eslint-disable-next-line no-new
  new PasswordChecker()

  // Caesar analyzer + solver
  const analyzer = new FrequencyAnalyzer()
  const solver = new AutoSolver('norwegian', analyzer)

  // Bind events for Analyzer/Solver controls
  const inputTextEl = document.getElementById('inputText')
  const shiftEl = document.getElementById('shiftValue')
  const outputEl = document.getElementById('outputText')
  const alphabetSelect = document.getElementById('alphabetType')
  const ngramSelect = document.getElementById('ngramType')
  const customNgramLengthEl = document.getElementById('customNgramLength')
  const customAlphabetGroupEl = document.getElementById('customAlphabetGroup')

  // File drop and upload
  const dropZone = document.getElementById('dropZone')
  const fileInput = document.getElementById('fileInput')
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click())
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.classList.add('dragover')
    })
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'))
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('dragover')
      const file = e.dataTransfer.files[0]
      
        // Validate file
        const validation = validateFile(file, {
          allowedExtensions: ['.txt'],
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['text/plain', '']
        })
      
        if (!validation.valid) {
          alert(`❌ Filopplasting feilet: ${validation.error}`)
          return
        }
      
        if (file) {
        const reader = new FileReader()
        
          reader.onerror = () => {
            alert('❌ Feil ved lesing av fil')
          }
        
        reader.onload = (event) => {
          if (inputTextEl) {
              try {
                // Sanitize file content
                const content = sanitizeText(event.target.result, {
                  maxLength: 50000,
                  allowNewlines: true
                })
              
                if (content.length === 0) {
                  alert('⚠️ Filen er tom eller inneholder ugyldig innhold')
                  return
                }
              
                inputTextEl.value = content
                analyzer.updateFrequencyAnalysis(content)
              } catch (error) {
                console.error('Error processing file:', error)
                alert('❌ Feil ved prosessering av fil')
              }
          }
        }
        
          // Read as text with error handling
          try {
            reader.readAsText(file, 'UTF-8')
          } catch (error) {
            console.error('Error reading file:', error)
            alert('❌ Kunne ikke lese filen')
          }
      }
    })
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (!file) return
      
        // Validate file
        const validation = validateFile(file, {
          allowedExtensions: ['.txt'],
          maxSize: 5 * 1024 * 1024,
          allowedMimeTypes: ['text/plain', '']
        })
      
        if (!validation.valid) {
          alert(`❌ Filopplasting feilet: ${validation.error}`)
          fileInput.value = '' // Reset input
          return
        }
      
      const reader = new FileReader()
      
        reader.onerror = () => {
          alert('❌ Feil ved lesing av fil')
          fileInput.value = ''
        }
      
      reader.onload = (event) => {
        if (inputTextEl) {
            try {
              const content = sanitizeText(event.target.result, {
                maxLength: 50000,
                allowNewlines: true
              })
            
              if (content.length === 0) {
                alert('⚠️ Filen er tom eller inneholder ugyldig innhold')
                fileInput.value = ''
                return
              }
            
              inputTextEl.value = content
              analyzer.updateFrequencyAnalysis(content)
            } catch (error) {
              console.error('Error processing file:', error)
              alert('❌ Feil ved prosessering av fil')
              fileInput.value = ''
            }
        }
      }
      
        try {
          reader.readAsText(file, 'UTF-8')
        } catch (error) {
          console.error('Error reading file:', error)
          alert('❌ Kunne ikke lese filen')
          fileInput.value = ''
        }
    })
  }

  // Alphabet selection
  if (alphabetSelect) {
    alphabetSelect.addEventListener('change', (e) => {
      const type = e.target.value
      if (type === 'custom' && customAlphabetGroupEl) {
        customAlphabetGroupEl.style.display = 'block'
      } else if (customAlphabetGroupEl) {
        customAlphabetGroupEl.style.display = 'none'
      }
      solver.setAlphabet(type)
      if (inputTextEl?.value) analyzer.updateFrequencyAnalysis(inputTextEl.value)
    })
  }

  // N-gram selection
  if (ngramSelect) {
    ngramSelect.addEventListener('change', () => {
      const selected = ngramSelect.value
      const customGroup = document.getElementById('customNgramGroup')
      if (selected === 'custom' && customGroup) customGroup.style.display = 'block'
      else if (customGroup) customGroup.style.display = 'none'
      analyzer.handleNgramChange(selected, customNgramLengthEl?.value)
      if (inputTextEl?.value) analyzer.updateFrequencyAnalysis(inputTextEl.value)
    })
  }

  if (customNgramLengthEl) {
    customNgramLengthEl.addEventListener('change', () => {
      analyzer.handleNgramChange('custom', customNgramLengthEl.value)
      if (inputTextEl?.value) analyzer.updateFrequencyAnalysis(inputTextEl.value)
    })
  }

  if (inputTextEl) {
    const debounced = debounce(() => {
      if (inputTextEl.value.length > 0) analyzer.updateFrequencyAnalysis(inputTextEl.value)
    }, 500)
    inputTextEl.addEventListener('input', debounced)
  }

  // Bind cipher action buttons
  const encryptBtn = document.getElementById('encryptBtn')
  const decryptBtn = document.getElementById('decryptBtn')
  const autoSolveBtn = document.getElementById('autoSolveBtn')
  const bruteForceBtn = document.getElementById('bruteForceBtn')
  const copyBtn = document.getElementById('copyBtn')
  const exportBtn = document.getElementById('exportBtn')
  const rot13Btn = document.getElementById('rot13Btn')
  const rot5Btn = document.getElementById('rot5Btn')
  const rot47Btn = document.getElementById('rot47Btn')
  const advancedBtn = document.getElementById('advancedAnalysisBtn')

  encryptBtn?.addEventListener('click', () => {
    if (!inputTextEl || !shiftEl || !outputEl) return
      const shiftValidation = validateNumber(shiftEl.value, {
        integer: true,
        min: -100,
        max: 100
      })
    
      if (!shiftValidation.valid) {
        alert(`❌ Ugyldig shift-verdi: ${shiftValidation.error}`)
        return
      }
    
      const sanitized = sanitizeText(inputTextEl.value, { maxLength: 50000 })
      outputEl.value = caesarShift(sanitized, shiftValidation.value || 0)
  })

  decryptBtn?.addEventListener('click', () => {
    if (!inputTextEl || !shiftEl || !outputEl) return
      const shiftValidation = validateNumber(shiftEl.value, {
        integer: true,
        min: -100,
        max: 100
      })
    
      if (!shiftValidation.valid) {
        alert(`❌ Ugyldig shift-verdi: ${shiftValidation.error}`)
        return
      }
    
      const sanitized = sanitizeText(inputTextEl.value, { maxLength: 50000 })
      outputEl.value = caesarShift(sanitized, -(shiftValidation.value || 0))
  })

  rot13Btn?.addEventListener('click', () => {
    if (!inputTextEl || !outputEl) return
      const sanitized = sanitizeText(inputTextEl.value, { maxLength: 50000 })
      outputEl.value = caesarShift(sanitized, 13)
  })

  rot5Btn?.addEventListener('click', () => {
    if (!inputTextEl || !outputEl) return
      const sanitized = sanitizeText(inputTextEl.value, { maxLength: 50000 })
      outputEl.value = sanitized
      .split('')
      .map((c) => (c.match(/[0-9]/) ? String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48) : c))
      .join('')
  })

  rot47Btn?.addEventListener('click', () => {
    if (!inputTextEl || !outputEl) return
      const sanitized = sanitizeText(inputTextEl.value, { maxLength: 50000 })
      outputEl.value = sanitized
      .split('')
      .map((c) => {
        const code = c.charCodeAt(0)
        return code >= 33 && code <= 126 ? String.fromCharCode(33 + ((code + 14) % 94)) : c
      })
      .join('')
  })

  autoSolveBtn?.addEventListener('click', () => {
    if (!inputTextEl) return
     const sanitized = sanitizeText(inputTextEl.value, { maxLength: 50000 })
     solver.autoSolve(sanitized)
  })

  bruteForceBtn?.addEventListener('click', () => {
    if (!inputTextEl) return
     const sanitized = sanitizeText(inputTextEl.value, { maxLength: 50000 })
     solver.bruteForce(sanitized)
  })

  copyBtn?.addEventListener('click', (event) => {
    if (!outputEl?.value) {
      alert('Ingen resultat å kopiere!')
      return
    }
    navigator.clipboard
      .writeText(outputEl.value)
      .then(() => {
        const btn = event.target.closest('button')
        const originalHTML = btn.innerHTML
        btn.innerHTML = '<span>✅ Kopiert!</span>'
        setTimeout(() => {
          btn.innerHTML = originalHTML
        }, 2000)
      })
      .catch(() => {
        outputEl.select()
        document.execCommand('copy')
        alert('📋 Kopiert til utklippstavlen!')
      })
  })

  exportBtn?.addEventListener('click', () => {
    if (!outputEl?.value) {
      alert('Ingen resultat å eksportere!')
      return
    }
    const blob = new Blob([outputEl.value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `caesar_result_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('💾 Fil eksportert!')
  })

  advancedBtn?.addEventListener('click', () => {
    const panel = document.getElementById('advanced-panel')
    if (!panel) return
    const isHidden = panel.classList.contains('advanced-panel-hidden')
    if (isHidden) panel.classList.remove('advanced-panel-hidden')
    else panel.classList.add('advanced-panel-hidden')
    if (isHidden) {
      const text = inputTextEl?.value || ''
      if (text) {
        const analyzerInst = new FrequencyAnalyzer()
        const ngramLength = analyzerInst.getNgramLength()
        analyzerInst.updateNgramTable(text, ngramLength)
      }
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })

  // Features button toggle
  const featuresBtn = document.getElementById('featuresBtn')
  const featuresPanel = document.getElementById('featuresPanel')
  featuresBtn?.addEventListener('click', () => {
    if (!featuresPanel) return
    const isVisible = featuresPanel.style.display === 'block'
    if (isVisible) {
      featuresPanel.style.display = 'none'
    } else {
      featuresPanel.innerHTML = `
        <strong>📚 App-funksjoner:</strong><br><br>
        <strong>🔐 Caesar Cipher:</strong><br>
        • Encrypt/Decrypt med shift-verdi<br>
        • ROT13, ROT5, ROT47 hurtigknapper<br>
        • Auto-Solve (ensemble scoring)<br>
        • Brute Force (alle 26 rotasjoner)<br><br>
        <strong>📊 Kryptoanalyse:</strong><br>
        • IC (Index of Coincidence)<br>
        • Shannon Entropy<br>
        • Chi-Square test<br>
        • Språkdeteksjon (Bokmål/Nynorsk/Engelsk)<br>
        • Frekvensdiagram (A-Z + ÆØÅ)<br>
        • N-gram analyse (bigram, trigram, quadgram, custom)<br><br>
        <strong>🔧 Substitusjonsløser:</strong><br>
        • Automatisk frekvensbasert mapping<br>
        • Manuell bokstavmapping<br>
        • Apply/Reset/Copy funksjoner<br><br>
        <strong>🚀 Avanserte verktøy:</strong><br>
        • Crib søk<br>
        • Hill Climbing<br>
        • Pattern recognition<br>
        • Polyalphabetic detection<br><br>
        <strong>🛠️ Andre funksjoner:</strong><br>
        • Dark Mode<br>
        • Fil upload (.txt)<br>
        • Eksporter resultat<br>
        • Kopier til clipboard<br>
        • Passord-sjekker<br>
        • Bildegalleri + Modal
      `
      featuresPanel.style.display = 'block'
      featuresPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })

  // Substitution controls
  const autoSolveSubBtn = document.getElementById('autoSolveSubBtn')
  const showMappingBtn = document.getElementById('showMappingBtn')
  const resetMappingBtn = document.getElementById('resetMappingBtn')
  const applyMappingBtn = document.getElementById('applyMappingBtn')
  const substitutionResult = document.getElementById('substitutionResult')
  const substitutionMappingPanel = document.getElementById('substitutionMappingPanel')
  let substitutionMapping = {}

  const updateFrequencyChartsSubstitution = (text) => {
    const analyzerInst = new FrequencyAnalyzer()
    analyzerInst.updateFrequencyChartsSubstitution(text)
  }

  autoSolveSubBtn?.addEventListener('click', () => {
    const text = inputTextEl?.value || ''
    if (!text || !substitutionResult) return alert('Vennligst skriv inn tekst først!')
    const freq = {}
    text.toUpperCase().split('').forEach((c) => {
      if (c.match(/[A-ZÆØÅ]/)) freq[c] = (freq[c] || 0) + 1
    })
    const sortedCipher = Object.entries(freq).sort((a, b) => b[1] - a[1])
    const norwegianOrder = ['E', 'R', 'N', 'T', 'A', 'I', 'S', 'L', 'O', 'D', 'G', 'K', 'M', 'V', 'F']
    substitutionMapping = {}
    sortedCipher.forEach((entry, idx) => {
      if (idx < norwegianOrder.length) substitutionMapping[entry[0]] = norwegianOrder[idx]
    })
    const decoded = text
      .toUpperCase()
      .split('')
      .map((c) => substitutionMapping[c] || c)
      .join('')
    substitutionResult.innerHTML = `
      <div class="auto-solve-card">
        <h3>🤖 Automatisk Substitusjon (Frekvensbasert)</h3>
        <div class="result-text">${escapeHtml(decoded)}</div>
        <button class="substitution-apply-btn mt-10" id="copyDecodedBtn"><span>📋 Kopier til resultat</span></button>
      </div>`
    document.getElementById('copyDecodedBtn')?.addEventListener('click', () => {
      if (outputEl) outputEl.value = decoded
    })
    updateFrequencyChartsSubstitution(text)
  })

  showMappingBtn?.addEventListener('click', () => {
    if (!substitutionMappingPanel) return
    const isVisible = !substitutionMappingPanel.classList.contains('substitution-mapping-hidden')
    if (isVisible) {
      substitutionMappingPanel.classList.add('substitution-mapping-hidden')
      substitutionMappingPanel.classList.remove('substitution-mapping-visible')
    } else {
      substitutionMappingPanel.classList.remove('substitution-mapping-hidden')
      substitutionMappingPanel.classList.add('substitution-mapping-visible')
      const table = document.getElementById('mappingTable')
      if (table) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ'.split('')
        table.innerHTML = alphabet
          .map(
            (letter) => `
            <div class="substitution-cell">
              <div class="substitution-cell-label">${letter}</div>
              <div class="substitution-cell-arrow">↓</div>
              <input type="text" maxlength="1" value="${substitutionMapping[letter] || ''}" class="substitution-cell-input" data-letter="${letter}">
            </div>`
          )
          .join('')
        table.querySelectorAll('.substitution-cell-input').forEach((input) => {
          input.addEventListener('change', (e) => {
            const letter = e.target.dataset.letter
            substitutionMapping[letter] = e.target.value.toUpperCase()
          })
        })
      }
    }
  })

  resetMappingBtn?.addEventListener('click', () => {
    substitutionMapping = {}
    if (substitutionMappingPanel) {
      substitutionMappingPanel.classList.add('substitution-mapping-hidden')
      substitutionMappingPanel.classList.remove('substitution-mapping-visible')
    }
    if (substitutionResult) substitutionResult.innerHTML = ''
    alert('Mapping er resatt!')
  })

  applyMappingBtn?.addEventListener('click', () => {
    const text = inputTextEl?.value || ''
    if (!text) return alert('Vennligst skriv inn tekst først!')
    const decoded = text
      .toUpperCase()
      .split('')
      .map((c) => substitutionMapping[c] || c)
      .join('')
    if (outputEl) outputEl.value = decoded
    alert('Mapping anvendt! Sjekk resultatfeltet.')
  })

  // Advanced analysis actions
  const searchCribsBtn = document.getElementById('searchCribsBtn')
  const hillClimbBtn = document.getElementById('hillClimbBtn')
  const patternBtn = document.getElementById('patternBtn')
  const polyTestBtn = document.getElementById('polyTestBtn')
  const cribInputEl = document.getElementById('cribInput')

  searchCribsBtn?.addEventListener('click', () => {
    if (!inputTextEl) return
    const text = inputTextEl.value
    const cribs = cribInputEl?.value || ''
    const solverInst = new AutoSolver('norwegian', analyzer)
    solverInst.searchCribs(text, cribs)
  })

  hillClimbBtn?.addEventListener('click', () => {
    if (!inputTextEl) return
    const solverInst = new AutoSolver('norwegian', analyzer)
    solverInst.runHillClimbing(inputTextEl.value)
  })

  patternBtn?.addEventListener('click', () => {
    if (!inputTextEl) return
    const solverInst = new AutoSolver('norwegian', analyzer)
    solverInst.runPatternRecognition(inputTextEl.value)
  })

  polyTestBtn?.addEventListener('click', () => {
    if (!inputTextEl) return
    const solverInst = new AutoSolver('norwegian', analyzer)
    solverInst.runPolyalphabeticTest(inputTextEl.value)
  })
})
