# Archivio Investigativo

Portale web statico per ospitare più casi investigativi. È pronto per GitHub Pages e non richiede backend.

## Struttura

- `index.html` — portale + motore del caso
- `cases/index.json` — catalogo pubblico dei casi
- `cases/caso-001.json` — contenuto del caso 001
- `cases/caso-002.json` — secondo caso dimostrativo
- `js/app.js` — routing, catalogo e interfaccia
- `js/game-state.js` — salvataggi separati per ogni caso in localStorage
- `js/investigation.js` — logica investigativa
- `css/style.css` — interfaccia responsive
- `assets/` — immagini di scene, sospettati, prove e documenti

## Come aggiungere un nuovo caso

1. Duplica `cases/caso-002.json` e rinominalo, ad esempio `caso-003.json`.
2. Cambia titolo, vittima, scena, prove, sospettati e soluzione.
3. Aggiungi il caso a `cases/index.json`:

```json
{
  "id": "caso-003",
  "file": "caso-003.json",
  "caseNumber": "003",
  "title": "Titolo del caso",
  "subtitle": "Breve introduzione senza spoiler.",
  "location": "Napoli",
  "difficulty": "Media",
  "duration": "90 min",
  "players": "2-8",
  "status": "available"
}
```

Per mostrare una scheda non ancora giocabile usa `"status": "coming-soon"`.

## URL diretti

Ogni caso può essere aperto direttamente con:

`https://TUO-UTENTE.github.io/TUO-REPOSITORY/?case=caso-001`

## Avvio locale

I browser possono bloccare `fetch()` se apri `index.html` con `file://`.
Avvia quindi un server locale dalla cartella del progetto, per esempio:

```bash
python -m http.server 8000
```

Poi visita `http://localhost:8000`.

## GitHub Pages

1. Crea un repository GitHub.
2. Carica **il contenuto** della cartella `murder-mystery` nella root del repository.
3. Apri **Settings → Pages**.
4. Scegli **Deploy from a branch**.
5. Seleziona `main` e `/ (root)`.
6. Salva e usa l'URL fornito da GitHub Pages.

## Evoluzioni consigliate

Il motore è predisposto per essere esteso con interrogatori, più scene per caso, inventario prove, laboratorio, timeline, documenti, audio/video e in seguito un backend multiplayer (Firebase o Supabase).
