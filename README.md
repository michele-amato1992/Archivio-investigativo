# Archivio Investigativo — V3

Portale web statico per casi investigativi cooperativi, pensato per essere giocato da un gruppo su un solo PC, tablet o telefono.

## Novità V3

- nuova grafica scura e professionale
- immagini illustrate per i luoghi investigabili
- hotspot visibili direttamente sulle scene
- guida "Come si gioca" sempre accessibile
- tutorial al primo accesso a un caso
- sezione "Cosa fare adesso" con suggerimenti non risolutivi
- Appunti di squadra con salvataggio automatico
- campi separati per teoria, contraddizioni, domande aperte e movente
- valutazione manuale di ogni sospettato
- salvataggi separati per ogni caso nel browser
- modalità cooperativa su un solo dispositivo

## Pubblicazione su GitHub Pages

Sostituisci nel repository i file/cartelle della versione precedente con quelli contenuti in questa V3.

I file principali modificati sono:

- `index.html`
- `css/style.css`
- `js/app.js`
- `js/game-state.js`
- `js/investigation.js`
- `cases/caso-001.json`
- `cases/caso-002.json`
- `assets/ui/archive-bg.svg`
- `assets/locations/room317.svg`
- `assets/locations/bar.svg`
- `assets/locations/corridor.svg`
- `assets/locations/lounge.svg`
- `assets/locations/taxi.svg`

## Struttura dei casi

`cases/index.json` contiene il catalogo.

Ogni caso è un file JSON indipendente, ad esempio:

- `cases/caso-001.json`
- `cases/caso-002.json`

Per aggiungere un nuovo caso crea un nuovo JSON e aggiungilo al catalogo.

## Immagini delle scene

Ogni luogo può avere una proprietà `image`:

```json
{
  "id": "room317",
  "name": "Stanza 317",
  "image": "assets/locations/room317.svg"
}
```

Gli hotspot usano coordinate percentuali `x` e `y`, quindi rimangono posizionati correttamente anche quando l'immagine cambia dimensione.

## Salvataggi

Lo stato viene salvato nel `localStorage` del browser. Il salvataggio include:

- prove scoperte
- hotspot esaminati
- interrogatori effettuati
- analisi eseguite
- appunti della squadra
- valutazioni dei sospettati
- stato risolto/non risolto

Non è necessario alcun backend per questa versione.
