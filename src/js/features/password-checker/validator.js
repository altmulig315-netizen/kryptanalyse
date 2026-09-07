// Advanced Password Strength Checker: bit strength, charset size, crack time,
// character-type indicators, recommendations, and generator.
import { sanitizeText, validateText } from '../../core/utils.js'

// Kryptografisk tilfeldig heltall i [0, max). Math.random() er forutsigbar og
// hoerer ikke hjemme i passordgenerering. En rett `% max` over 2^32 verdier gir
// modulo-skjevhet naar max ikke gaar opp i 2^32, saa vi forkaster verdier i den
// siste, ufullstendige bolken (rejection sampling) og alle utfall blir like sannsynlige.
function randomInt (max) {
  const limit = Math.floor(2 ** 32 / max) * max
  const buf = new Uint32Array(1)
  let v
  do {
    crypto.getRandomValues(buf)
    v = buf[0]
  } while (v >= limit)
  return v % max
}

function randomChar (charset) {
  return charset[randomInt(charset.length)]
}

// Fisher-Yates. `sort(() => Math.random() - 0.5)` er ikke en jevn stokking:
// sammenligningsfunksjonen er inkonsistent, og resultatet blir skjevfordelt
// uansett hvor god tilfeldighetskilden er.
function shuffle (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

export class PasswordChecker {
  constructor () {
    this.passwordInput = document.getElementById('password')
    this.toggleBtn = document.getElementById('toggleBtn')
    this.strengthBar = document.getElementById('strengthBar')
    this.strengthText = document.getElementById('strengthText')
    this.bitStrength = document.getElementById('bitStrength')
    this.lengthEl = document.getElementById('length')
    this.combinationsEl = document.getElementById('combinations')
    this.charsetSizeEl = document.getElementById('charsetSize')
    this.crackTimeEl = document.getElementById('crackTime')
    this.lowercaseIcon = document.getElementById('lowercase')
    this.uppercaseIcon = document.getElementById('uppercase')
    this.numbersIcon = document.getElementById('numbers')
    this.symbolsIcon = document.getElementById('symbols')
    this.generateBtn = document.getElementById('generateBtn')
    this.recommendationsBox = document.getElementById('recommendationsBox')
    this.recommendationsList = document.getElementById('recommendationsList')

    if (!this.passwordInput || !this.strengthBar || !this.strengthText) return
    this.attachEventListeners()
    this.resetDisplay()
  }

  attachEventListeners () {
    this.toggleBtn?.addEventListener('click', () => this.toggleVisibility())
    this.passwordInput.addEventListener('input', () => this.onInput())
    this.passwordInput.addEventListener('paste', (e) => this.handlePaste(e))
    this.generateBtn?.addEventListener('click', () => this.generateAndAnalyze())
  }

  toggleVisibility () {
    const type = this.passwordInput.type === 'password' ? 'text' : 'password'
    this.passwordInput.type = type
    if (this.toggleBtn) this.toggleBtn.textContent = type === 'password' ? '👁️' : '🙈'
  }

  handlePaste (event) {
    event.preventDefault()
    const pastedText = (event.clipboardData || window.clipboardData).getData('text')
    const sanitized = sanitizeText(pastedText, {
      maxLength: 256,
      allowNewlines: false,
      allowSpecialChars: true,
      trim: false
    })
    const start = this.passwordInput.selectionStart
    const end = this.passwordInput.selectionEnd
    const current = this.passwordInput.value
    this.passwordInput.value = current.substring(0, start) + sanitized + current.substring(end)
    this.passwordInput.selectionStart = this.passwordInput.selectionEnd = start + sanitized.length
    this.passwordInput.dispatchEvent(new Event('input'))
  }

  onInput () {
    const raw = this.passwordInput.value
    const password = sanitizeText(raw, {
      maxLength: 256,
      allowNewlines: false,
      allowSpecialChars: true,
      trim: false
    })
    if (password !== raw) this.passwordInput.value = password
    const validation = validateText(password, { maxLength: 256, allowEmpty: true })
    if (!validation.valid && password.length > 0) return this.showTransientError(validation.errors[0])
    this.update(this.calculate(password))
  }

  calculate (password) {
    const length = password.length
    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumbers = /[0-9]/.test(password)
    const hasSymbols = /[^a-zA-Z0-9]/.test(password)
    let charsetSize = 0
    if (hasLowercase) charsetSize += 26
    if (hasUppercase) charsetSize += 26
    if (hasNumbers) charsetSize += 10
    if (hasSymbols) charsetSize += 32
    const combinations = Math.pow(charsetSize || 1, length)
    const bits = Math.log2(combinations)
    const attemptsPerSecond = 1e10
    const secondsToCrack = combinations / attemptsPerSecond
    let category, categoryText
    if (bits < 28) { category = 'very-weak'; categoryText = '❌ Ekstremt svakt' }
    else if (bits < 36) { category = 'weak'; categoryText = '⚠️ Veldig svakt' }
    else if (bits < 60) { category = 'weak'; categoryText = '⚠️ Svakt' }
    else if (bits < 80) { category = 'moderate'; categoryText = '⚡ Moderat' }
    else if (bits < 128) { category = 'strong'; categoryText = '✅ Sterkt' }
    else { category = 'very-strong'; categoryText = '🔐 Veldig sterkt' }
    return {
      length,
      charsetSize,
      combinations,
      bits: Math.round(bits * 10) / 10,
      secondsToCrack,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
      category,
      categoryText
    }
  }

  update (a) {
    this.strengthBar.className = 'strength-bar ' + a.category
    this.strengthText.textContent = a.categoryText
    if (this.bitStrength) this.bitStrength.textContent = `${a.bits} bits`
    this.lengthEl.textContent = `${a.length} tegn`
    this.lengthEl.className = 'result-value ' + (a.length >= 12 ? 'good' : 'bad')
    this.combinationsEl.textContent = this.formatLargeNumber(a.combinations)
    this.charsetSizeEl.textContent = a.charsetSize
    this.lowercaseIcon.className = 'char-type-icon ' + (a.hasLowercase ? 'active' : 'inactive')
    this.uppercaseIcon.className = 'char-type-icon ' + (a.hasUppercase ? 'active' : 'inactive')
    this.numbersIcon.className = 'char-type-icon ' + (a.hasNumbers ? 'active' : 'inactive')
    this.symbolsIcon.className = 'char-type-icon ' + (a.hasSymbols ? 'active' : 'inactive')
    if (this.crackTimeEl) this.crackTimeEl.textContent = this.formatTime(a.secondsToCrack)
    this.generateRecommendations(a)
  }

  formatLargeNumber (num) {
    if (!Number.isFinite(num)) return '∞ (Uendelig)'
    if (num > 1e100) return '> 10¹⁰⁰'
    if (num > 1e21) return num.toExponential(2)
    if (num > 1e12) return (num / 1e12).toFixed(1) + ' billioner'
    if (num > 1e9) return (num / 1e9).toFixed(1) + ' milliarder'
    if (num > 1e6) return (num / 1e6).toFixed(1) + ' millioner'
    return num.toLocaleString('no-NO')
  }

  formatTime (seconds) {
    if (!Number.isFinite(seconds) || seconds > 1e15) return '♾️ Praktisk uknekk'
    const minute = 60
    const hour = 60 * minute
    const day = 24 * hour
    const year = 365.25 * day
    const century = 100 * year
    if (seconds < 1) return 'Øyeblikkelig'
    if (seconds < minute) return Math.round(seconds) + ' sekunder'
    if (seconds < hour) return Math.round(seconds / minute) + ' minutter'
    if (seconds < day) return Math.round(seconds / hour) + ' timer'
    if (seconds < year) return Math.round(seconds / day) + ' dager'
    if (seconds < century) return Math.round(seconds / year) + ' år'
    return Math.round(seconds / century) + ' århundrer'
  }

  generateRecommendations (a) {
    const recs = []
    if (a.length < 12) recs.push('Øk lengden til minst 12 tegn')
    if (!a.hasLowercase) recs.push('Legg til små bokstaver (a-z)')
    if (!a.hasUppercase) recs.push('Legg til store bokstaver (A-Z)')
    if (!a.hasNumbers) recs.push('Legg til tall (0-9)')
    if (!a.hasSymbols) recs.push('Legg til symboler (!@#$%^&*)')
    if (a.bits < 80) recs.push('Mål på minst 80 bits for viktige kontoer')
    if (recs.length > 0) {
      if (this.recommendationsBox) this.recommendationsBox.style.display = 'block'
      if (this.recommendationsList) this.recommendationsList.innerHTML = recs.map(r => `<li>${r}</li>`).join('')
    } else if (this.recommendationsBox) {
      this.recommendationsBox.style.display = 'none'
    }
  }

  showTransientError (message) {
    let el = document.getElementById('password-error')
    if (!el) {
      el = document.createElement('div')
      el.id = 'password-error'
      el.className = 'error-message'
      el.style.color = '#ff4757'
      el.style.fontSize = '0.9rem'
      el.style.marginTop = '0.5rem'
      this.passwordInput.parentNode.insertBefore(el, this.passwordInput.nextSibling)
    }
    el.textContent = message
    setTimeout(() => { if (el) el.textContent = '' }, 3000)
  }

  generateAndAnalyze () {
    const p = this.generateStrongPassword(16)
    this.passwordInput.value = p
    this.passwordInput.type = 'text'
    if (this.toggleBtn) this.toggleBtn.textContent = '🙈'
    this.update(this.calculate(p))
  }

  generateStrongPassword (length = 16) {
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nums = '0123456789'
    const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const all = lower + upper + nums + syms

    // Garanter minst ett tegn fra hver klasse, fyll resten fra hele settet.
    const chars = [
      randomChar(lower),
      randomChar(upper),
      randomChar(nums),
      randomChar(syms)
    ]
    while (chars.length < length) chars.push(randomChar(all))

    shuffle(chars)
    return chars.join('')
  }

  resetDisplay () {
    this.strengthBar.className = 'strength-bar'
    this.strengthText.textContent = 'Skriv inn et passord'
    if (this.bitStrength) this.bitStrength.textContent = '0 bits'
    this.lengthEl.textContent = '0 tegn'
    this.combinationsEl.textContent = '0'
    this.charsetSizeEl.textContent = '0'
    if (this.crackTimeEl) this.crackTimeEl.textContent = '-'
    this.lowercaseIcon.className = 'char-type-icon inactive'
    this.uppercaseIcon.className = 'char-type-icon inactive'
    this.numbersIcon.className = 'char-type-icon inactive'
    this.symbolsIcon.className = 'char-type-icon inactive'
    if (this.recommendationsBox) this.recommendationsBox.style.display = 'none'
  }
}
