# Archivio Investigativo — V11

Portale web cooperativo per casi investigativi, pensato per essere giocato da un gruppo su un unico PC, tablet o telefono.

## Novità V11

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


## V8
- Layout più vicino a una vera app: su desktop il portale resta dentro una cornice fissa, evitando lo scorrimento dell'intera pagina.
- Ritocchi alle dimensioni dei pannelli per usare meglio lo spazio disponibile.
- Ritratti dei sospettati sostituiti con immagini **fotorealistiche** nel Caso 001.


## V9
- Gestione degli indizi resa meno ripetitiva: i testi nella scena ora sono contestuali all'oggetto selezionato.
- Tolta la formula ripetitiva “clicca per rilevare/esaminare”: ogni hotspot mostra una breve osservazione naturale.
- Pulsante di azione semplificato in “Esamina” / “Rivedi osservazione”.
- Tooltip degli hotspot alleggeriti con testi più discreti e meno meccanici.


## V10
- Nuova sezione **Mappa Investigativa**: si popola automaticamente con prove, persone di interesse, testimonianze e fatti verificati già emersi durante il caso.
- I collegamenti sono raggruppati per vittima, scena, sospettati e piste tematiche, senza anticipare elementi non ancora scoperti.
- Le risposte già ottenute negli interrogatori entrano automaticamente nella mappa come verbali.
- Le nuove scoperte indicano anche che la Mappa Investigativa è stata aggiornata.
- Corretto il bug del tutorial iniziale: dopo essere stato visto una volta per un caso, non ricompare più al semplice aggiornamento della pagina.
- Il comando **Ricomincia caso** azzera anche lo stato del tutorial, coerentemente con un vero nuovo inizio.


## V11 — Mappa Investigativa rifinita
- Mappa riprogettata come vera parete investigativa digitale.
- Ritratti fotorealistici dei sospettati integrati nei nodi.
- Collegamenti visuali automatici tra persone, luoghi e piste, mostrati solo quando supportati da prove scoperte.
- Nuove schede indizio con simbologia, stato NUOVO e mini-gerarchia visiva.
- Valutazione manuale della squadra riportata direttamente sui sospettati nella mappa.
- Filo temporale laterale più compatto e leggibile.
- Layout responsive: linee e schede si adattano anche a tablet e telefono.
- Mantiene la correzione V10 del tutorial iniziale: non ricompare al semplice refresh della pagina.


## V11.2
- Corretto il reset del caso: dopo **Ricomincia caso** il portale torna all'archivio e il caso risulta **Nuovo caso / Apri fascicolo**, non più erroneamente **In corso / Continua indagine**.
- Migliorata la leggibilità del testo nella parte bassa dei pannelli della **Mappa Investigativa**.
- Aumentati contrasto, spaziatura e padding delle aree vuote dei pannelli per evitare testi tagliati o quasi invisibili.


## V11.2
- Corretto il routing dei collegamenti nella Mappa Investigativa: linee ed etichette ora passano negli spazi tra le schede e non vengono più coperte dai pannelli.


## V11.5
- Aggiunto ritratto realistico della vittima Andrea Romano nella Mappa Investigativa.
- Corretti definitivamente i riferimenti Laura/Marco e aggiunto cache-busting alle immagini per evitare foto vecchie da GitHub Pages/browser.
