# Archivio Investigativo — V7

Portale web cooperativo per casi investigativi, pensato per essere giocato da un gruppo su un unico PC, tablet o telefono.

## Novità V7

- Tooltip degli hotspot ora **sempre contenuti nella fotografia**: vengono posizionati dinamicamente e non possono più uscire/tagliarsi sopra o ai lati della scena.
- Business lounge rifatta con una nuova immagine coerente: **portatile, stampante e distruggidocumenti sono realmente visibili** e gli hotspot coincidono con gli oggetti.
- Testi della lounge aggiornati per corrispondere esattamente alla scena.

- Scene fotografiche realistiche per Stanza 317, bar, corridoio e business lounge.
- Nessun marker numerato visibile sulle scene.
- Su PC gli oggetti investigabili si evidenziano solo al passaggio del mouse.
- L'hover mostra soltanto il nome dell'oggetto: l'indizio resta segreto fino a **Esamina elemento**.
- Su dispositivi touch è disponibile **Aiuto ricerca**, che mostra temporaneamente le aree esplorabili.
- Gli oggetti già esaminati restano invisibili finché non vengono nuovamente individuati.
- Nessun totale delle aree nascoste viene mostrato: il portale indica solo quanti elementi sono già stati esaminati.

## Pubblicazione su GitHub Pages

Sostituisci i file della versione precedente con tutto il contenuto di questa cartella. In GitHub: **Settings → Pages → Deploy from a branch → main → /(root)**.

Dopo l'aggiornamento è consigliato usare **Ricomincia caso** per testare il Caso 001 dall'inizio.

## Struttura

- `index.html` — interfaccia del portale
- `css/style.css` — grafica e comportamento visivo delle scene
- `js/` — motore dell'indagine e salvataggio locale
- `cases/` — catalogo e contenuti dei casi
- `assets/locations/` — fotografie/illustrazioni delle scene


## V7
- Schede sospettati ridisegnate in stile dossier, con ritratti coerenti.
- Interrogatori trasformati in verbali progressivi: le domande non disponibili restano invisibili.
- Risposte già ottenute restano consultabili come trascrizione.
- Reperti con simbologia visiva diversa per categoria.
- Migliore leggibilità su PC, tablet e telefono.
