# Kryptanalyse

Kryptanalyseverktøy som kjører i nettleseren. Frekvensanalyse av Caesar-chiffer med
norske språkdata, og en passordstyrkemåler som regner entropi i bits.

Ren HTML, CSS og native ES-moduler. Ingen rammeverk, ingen byggesteg, ingen
tredjepartsbiblioteker i kjøretid.

## Kjøre lokalt

Siden lastes som ES-modul, og nettlesere blokkerer `import` fra `file://`. Åpner du
`index.html` direkte fra Utforsker, vises siden — men ingen JavaScript kjører.

Den må serveres over HTTP:

```bash
npx http-server -p 8777
```

Åpne så **http://localhost:8777/** — uten filnavn. Stopp serveren med `Ctrl+C`.

Krever Node. Alt annet er null oppsett.

## Funksjoner

**Caesar-analyse** — frekvensfordeling, sammenfallsindeks med glidende vindu,
entropi, khikvadrat mot norske frekvenstabeller, n-gram-scoring (bigram til
kvadgram) og Kasiski-test for å avdekke polyalfabetiske chiffer.

**Caesar-løser** — automatisk løsning med beslutningsmotor som rangerer kandidater
på ordtreff, norske tegn (ÆØÅ) og usannsynlige bokstavsekvenser, samt brute force
over alle skift.

**Passordsjekker** — entropi i bits, alfabetstørrelse, estimert knekketid og
konkrete anbefalinger. Generatoren bruker `crypto.getRandomValues()` med rejection
sampling og Fisher-Yates-stokking.

## Linting

```bash
npm install
npm run lint
```

Kjører ESLint, Stylelint og HTMLHint. Samme kommando kjøres i CI ved hver push.

## Struktur

```
index.html              Inngangspunkt
CTF.html                Oversikt over CTF-konkurranser
src/css/main.css        Samler base/, components/, layout/, modules/, pages/
src/js/main.js          Kobler moduler og funksjoner ved DOMContentLoaded
src/js/core/            Kryptofunksjoner, språkdata, sanitering og validering
src/js/features/        caesar-cipher/, password-checker/
src/js/modules/         Karusell, galleri, modal, dark mode
```

## Sikkerhet

Se [SECURITY.md](SECURITY.md) for hvilke tiltak som er implementert, hvor de ligger
i koden, og hva som bevisst **ikke** er implementert. Hver påstand der har fil- og
linjereferanse.
