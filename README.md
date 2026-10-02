# Archivio Investigativo — V6

Portale web cooperativo per casi investigativi, pensato per essere giocato da un gruppo su un unico PC, tablet o telefono.

## Novità V6

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
