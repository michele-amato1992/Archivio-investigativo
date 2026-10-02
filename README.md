# Archivio Investigativo

Portale web statico per giocare più casi investigativi. È pensato per funzionare su GitHub Pages senza backend.

## Cosa contiene

- Catalogo di più casi
- Salvataggio separato per ogni caso nel browser
- Più luoghi investigabili per caso
- Hotspot interattivi
- Prove che si sbloccano progressivamente
- Analisi di laboratorio / acquisizioni digitali
- Sospettati e interrogatori progressivi
- Domande che si sbloccano solo dopo aver trovato determinate prove
- Cronologia ricostruita automaticamente
- Appunti del gruppo
- Accusa finale con verifica di colpevole, movente, metodo e prove chiave

## Casi inclusi

### Caso 001 — La stanza 317
Caso completo di difficoltà medio/alta, progettato per circa 90-120 minuti e 2-8 giocatori.

### Caso 002 — L'ultima corsa
Caso breve dimostrativo/tutorial.

## Pubblicazione su GitHub Pages

Carica tutti i file nella root del repository. La root deve contenere direttamente:

- `index.html`
- `css/`
- `js/`
- `cases/`

Poi vai su GitHub:

1. `Settings`
2. `Pages`
3. `Build and deployment`
4. Source: `Deploy from a branch`
5. Branch: `main`
6. Folder: `/ (root)`
7. `Save`

## Aggiornare un progetto già pubblicato

Se il repository contiene già la versione precedente, sostituisci questi file con quelli presenti in questo pacchetto:

- `index.html`
- `css/style.css`
- `js/app.js`
- `js/game-state.js`
- `js/investigation.js`
- `cases/index.json`
- `cases/caso-001.json`

`cases/caso-002.json` può essere sostituito anch'esso, anche se resta il caso demo.

Dopo il commit, GitHub Pages aggiorna normalmente il sito in pochi minuti.

## Aggiungere un nuovo caso

1. Copia un file esistente in `cases/`, ad esempio `caso-001.json`.
2. Rinominalo, per esempio `caso-003.json`.
3. Cambia contenuti, sospettati, prove, luoghi, interrogatori e soluzione.
4. Aggiungi il caso a `cases/index.json`.

Il motore del portale non deve essere modificato se il nuovo caso segue lo stesso formato JSON.

## Nota sul salvataggio

I progressi vengono salvati con `localStorage`, quindi sono legati al browser e al dispositivo usato. Non esiste ancora sincronizzazione multiplayer tra telefoni diversi.
