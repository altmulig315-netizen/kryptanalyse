# Sikkerhetsdokumentasjon

Dette er en **statisk frontend uten server**. All validering og sanitering skjer i
nettleseren. Det gir ingen beskyttelse mot en angriper som kontrollerer klienten —
formålet er å hindre at prosjektets egen kode innfører sårbarheter, særlig XSS
gjennom dynamisk generert HTML.

Hver påstand nedenfor kan etterprøves mot koden. Filer og linjenumre er oppgitt.

---

## Sikkerhetsfunksjoner

Alle ligger i `src/js/core/utils.js`.

| Funksjon | Hva den gjør | Brukt |
|---|---|---|
| `escapeHtml()` | `&` `<` `>` `"` `'` → HTML-entiteter | 9 steder |
| `sanitizeText()` | Fjerner null-bytes, kontrolltegn, `<script>`-blokker, `on*=`-attributter og `javascript:`; trimmer og håndhever maks lengde | 17 steder |
| `setSafeText()` | Setter innhold via `textContent` | 11 steder |
| `validateText()` | Min/maks lengde, påkrevd, regex-mønster, egen validator | 2 steder |
| `validateNumber()` | Min/maks, heltall vs. desimal, avviser `Infinity`/`NaN` | 2 steder |
| `validateFile()` | Størrelse, filendelse mot hviteliste, MIME-type | 2 steder |
| `setSafeAttribute()` | Blokkerer `onclick`/`onerror`/`onload`/`onmouseover`, og `javascript:`/`data:`/`vbscript:` i `href`/`src` | **0 — ubrukt** |
| `createSafeTextNode()` | Lager tekstnode | **0 — ubrukt** |

De to siste er eksportert, men kalles ikke fra noen modul. De er tilgjengelige,
ikke aktive.

---

## Tiltak per modul

### Passordsjekker — `src/js/features/password-checker/validator.js`

- Sanitering av input og av innlimt tekst, maks 256 tegn (linje 74, 90)
- `validateText()` på saniterte verdien (linje 97)
- Egen `paste`-håndterer i stedet for å stole på feltets råverdi (linje 61)
- Anbefalinger skrives fra interne strenger, ikke brukerinput (linje 191)
- `autocomplete="new-password"` på feltet (`index.html` linje 805)

**Passordgenerering** bruker `crypto.getRandomValues()` — ikke `Math.random()`:

- `randomInt()` bruker rejection sampling. Et rett `% max` over 2³² verdier gir
  modulo-skjevhet når `max` ikke går opp i 2³²; verdier i den siste ufullstendige
  bolken forkastes, så alle utfall blir like sannsynlige.
- Stokkingen er Fisher-Yates. `sort(() => Math.random() - 0.5)` gir skjev
  fordeling uansett tilfeldighetskilde, fordi sammenligningsfunksjonen er
  inkonsistent.

### Caesar-analyse — `src/js/features/caesar-cipher/analyzer.js`

- `sanitizeText()` med maks 50 000 tegn (linje 47, 152)
- `escapeHtml()` på hver verdi som interpoleres inn i frekvensdiagrammer og
  n-gram-tabeller (linje 119, 142, 167, 182)
- Tekstutdata via `setSafeText()`

### Caesar-løser — `src/js/features/caesar-cipher/solver.js`

- `sanitizeText()` med maks 50 000 tegn før dekryptering (linje 65, 189)
- `escapeHtml()` på alle kandidater og resultater (linje 124, 151)

### Filopplasting — `src/js/main.js`

- `validateFile()` med hviteliste `.txt`, maks 5 MB, MIME `text/plain` (linje 82–84)
- Filinnhold saniteres med maks 50 000 tegn før bruk
- Feilhåndtering på `FileReader`

### Substitusjonsresultat — `src/js/main.js`

- `escapeHtml()` på dekodet tekst før den settes inn (linje 451). Nødvendig fordi
  substitusjonsmappingen slipper ukjente tegn gjennom uendret via `|| c`, slik at
  `<` og `>` ellers overlever.

### Galleri — `src/js/modules/gallery.js`

- URL-er parses med `new URL()` og avvises hvis protokollen ikke er `http:`/`https:` (linje 61–73)
- Titler og undertekster saniteres, maks 200/500 tegn (linje 47–48)
- Inline-stiler strippes for `< > ' "` før de settes (linje 83)
- Tekst settes via `setSafeText()` (linje 95, 97)

### Eksterne lenker — `index.html`

- `rel="nofollow noopener noreferrer"` på utgående lenker. `noopener` hindrer
  reverse tabnabbing via `window.opener`; `noreferrer` fjerner Referer-headeren.

---

## Kodepraksis

- Ingen `eval()` eller `new Function()`
- Ingen `document.write()`
- Ingen `setTimeout("...")`/`setInterval("...")` med streng — kun funksjoner
- Ingen inline `<script>`-blokker eller `on*`-attributter i HTML
- Ingen tredjeparts kjørebiblioteker eller sporingsskript. `package.json` inneholder
  kun utviklingsverktøy for linting, som ikke lastes av siden
- CSS bruker kun HEX-farger; ingen `rgb()`/`rgba()`

---

## Ikke implementert

Dette er ærlige hull, ikke utelatelser.

| Mangler | Hvorfor det betyr noe |
|---|---|
| Content Security Policy | Ingen CSP er satt. Siden har ingen server, og det finnes ingen `<meta http-equiv>` i HTML-en. En CSP ville vært siste forsvarslinje hvis escaping svikter. |
| Sikkerhetsheadere | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP — ingen av disse er satt. De krever en server eller statisk hosting med header-konfigurasjon. |
| Serverside-validering | Finnes ikke. Klientvalidering alene er utilstrekkelig for produksjon. |
| Rate limiting | Ikke relevant uten server, men verdt å merke seg. |
| `data:` og `vbscript:` i `sanitizeText()` | Kun `javascript:` fjernes. De to andre blokkeres bare i `setSafeAttribute()`, som ikke er i bruk. |

**Om `sanitizeText()`:** den fjerner `<script>`-blokker og `on*=`-attributter med
regulære uttrykk. Regex-basert HTML-sanitering er ikke robust og bør ikke være
eneste forsvar. Den reelle beskyttelsen i dette prosjektet er `escapeHtml()` og
`textContent` — `sanitizeText()` er et supplement, ikke en erstatning.

---

## Verifiser selv

```bash
# Havner brukerinput i innerHTML uten escaping?
grep -rn "innerHTML" src/js/

# Brukes de farlige APIene?
grep -rn "eval(\|document\.write\|new Function" src/js/

# Er tilfeldigheten kryptografisk?
grep -rn "Math.random\|getRandomValues" src/js/

# Finnes sikkerhetsheadere?
grep -in "http-equiv" *.html
```

---

## Sjekkliste

- [x] HTML-escaping av all brukerinput som når `innerHTML`
- [x] `textContent` framfor `innerHTML` der HTML ikke trengs
- [x] Lengdegrenser på tekstinput (256 for passord, 50 000 for chiffertekst)
- [x] Filopplasting validert på endelse, størrelse og MIME-type
- [x] URL-validering med protokoll-hviteliste
- [x] Kryptografisk sikker passordgenerering (`crypto.getRandomValues`)
- [x] Jevn stokking (Fisher-Yates)
- [x] `autocomplete="new-password"` på passordfeltet
- [x] `rel="nofollow noopener noreferrer"` på eksterne lenker
- [x] Ingen `eval()`, `new Function()` eller `document.write()`
- [x] Ingen inline `script` eller `on*`-attributter
- [x] Ingen tredjepartsbiblioteker eller sporing i kjøretid
- [x] Kun HEX-farger i CSS
- [ ] Content Security Policy
- [ ] Sikkerhetsheadere (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, m.fl.)
- [ ] Serverside-validering
- [ ] `maxlength`-attributt på inputfeltene i HTML
- [ ] `setSafeAttribute()` og `createSafeTextNode()` tatt i bruk

---

## Rapporter sikkerhetsproblemer

Ikke opprett en offentlig issue. Kontakt prosjekteier direkte med beskrivelse av
sårbarheten og steg for å reprodusere den.

---

**Sist oppdatert:** 7. september 2026
