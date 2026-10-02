(async function () {
  const portalView = document.getElementById('portalView');
  const caseView = document.getElementById('caseView');
  const view = document.getElementById('view');
  const pageTitle = document.getElementById('pageTitle');
  const homeBtn = document.getElementById('homeBtn');
  const resetBtn = document.getElementById('resetBtn');
  const navButtons = [...document.querySelectorAll('.nav-btn')];
  let catalog = [];
  let currentCaseMeta = null;
  let data = null;

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function card(html, cls = '') { return `<article class="card ${cls}">${html}</article>`; }

  async function loadCatalog() {
    const response = await fetch('cases/index.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Impossibile caricare il catalogo dei casi.');
    catalog = (await response.json()).cases || [];
  }

  function progressFor(meta) {
    const state = GameState.peek(meta.id);
    if (!state) return { label: 'Nuovo caso', cls: 'new', progress: 0 };
    if (state.solved) return { label: 'Risolto', cls: 'solved', progress: 100 };
    const explored = state.examinedHotspots?.length || 0;
    const proofs = state.unlockedEvidence?.length || 0;
    const progress = Math.min(95, 10 + explored * 12 + proofs * 8);
    return { label: 'In corso', cls: 'progress', progress };
  }

  function renderPortal() {
    document.title = 'Archivio Investigativo';
    pageTitle.textContent = 'Casi disponibili';
    homeBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    caseView.classList.add('hidden');
    portalView.classList.remove('hidden');

    const cards = catalog.map(meta => {
      const status = progressFor(meta);
      const disabled = meta.status !== 'available';
      return `
        <article class="case-card ${disabled ? 'disabled' : ''}">
          <div class="case-card-top">
            <span class="badge">CASO ${escapeHtml(meta.caseNumber)}</span>
            <span class="status ${status.cls}">${disabled ? 'Prossimamente' : status.label}</span>
          </div>
          <h2>${escapeHtml(meta.title)}</h2>
          <p class="case-subtitle">${escapeHtml(meta.subtitle)}</p>
          <div class="case-meta">
            <span>📍 ${escapeHtml(meta.location)}</span>
            <span>◈ ${escapeHtml(meta.difficulty)}</span>
            <span>⏱ ${escapeHtml(meta.duration)}</span>
            <span>👥 ${escapeHtml(meta.players)}</span>
          </div>
          ${status.progress > 0 && !disabled ? `<div class="progressbar"><span style="width:${status.progress}%"></span></div>` : ''}
          <button class="btn primary open-case" type="button" data-case-id="${escapeHtml(meta.id)}" ${disabled ? 'disabled' : ''}>
            ${status.label === 'In corso' ? 'Continua indagine' : status.label === 'Risolto' ? 'Rivedi il caso' : 'Apri fascicolo'}
          </button>
        </article>`;
    }).join('');

    portalView.innerHTML = `
      <section class="portal-hero">
        <p class="eyebrow">CENTRALE OPERATIVA</p>
        <h2>Scegli il prossimo caso da investigare</h2>
        <p class="muted">Ogni fascicolo ha progressi indipendenti salvati sul dispositivo.</p>
      </section>
      <section class="case-grid">${cards || '<p>Nessun caso disponibile.</p>'}</section>`;

    document.querySelectorAll('.open-case').forEach(btn => btn.addEventListener('click', () => openCase(btn.dataset.caseId, true)));
  }

  async function openCase(caseId, pushState = false) {
    const meta = catalog.find(c => c.id === caseId);
    if (!meta || meta.status !== 'available') return;
    const response = await fetch(`cases/${meta.file}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Impossibile caricare ${meta.title}.`);

    data = await response.json();
    currentCaseMeta = meta;
    Investigation.setCase(data);
    GameState.load(meta.id);
    Investigation.unlockEvidence(data.evidence.filter(e => e.initial).map(e => e.id));

    if (pushState) history.pushState({ caseId }, '', `?case=${encodeURIComponent(caseId)}`);
    portalView.classList.add('hidden');
    caseView.classList.remove('hidden');
    homeBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    pageTitle.textContent = `Caso ${data.caseNumber} — ${data.title}`;
    document.title = `${data.title} — Archivio Investigativo`;
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === 'briefing'));
    renderBriefing();
  }

  function renderBriefing() {
    view.innerHTML = card(`
      <span class="badge new">CASO ${escapeHtml(data.caseNumber)}</span>
      <h2>${escapeHtml(data.title)}</h2>
      <p>${escapeHtml(data.briefing)}</p><hr>
      <div class="grid">
        <div><strong>Vittima</strong><p class="muted">${escapeHtml(data.victim.name)}, ${escapeHtml(data.victim.age)} anni</p></div>
        <div><strong>Luogo</strong><p class="muted">${escapeHtml(data.location)}</p></div>
        <div><strong>Ora del ritrovamento</strong><p class="muted">${escapeHtml(data.timeFound)}</p></div>
        <div><strong>Obiettivo</strong><p class="muted">Identificare colpevole, movente e ricostruzione.</p></div>
      </div>`);
  }

  function renderScene() {
    const hotspots = data.scene.hotspots.map(h => `<button class="hotspot" type="button" data-hotspot="${escapeHtml(h.id)}" style="left:${Number(h.x)}%;top:${Number(h.y)}%" aria-label="Esamina punto ${escapeHtml(h.label)}">${escapeHtml(h.label)}</button>`).join('');
    const bg = data.scene.image ? `<img class="scene-image" src="${escapeHtml(data.scene.image)}" alt="Scena del crimine">` : `<div class="scene-placeholder">${escapeHtml(data.scene.label || 'Scena del crimine')}</div>`;
    view.innerHTML = `${card('<h2>Scena del crimine</h2><p class="muted">Tocca i marcatori numerati per esaminare gli elementi disponibili.</p>')}<div class="scene-box">${bg}${hotspots}</div><div id="sceneResult"></div>`;
    document.querySelectorAll('[data-hotspot]').forEach(btn => btn.addEventListener('click', () => {
      const h = Investigation.examineHotspot(btn.dataset.hotspot);
      if (!h) return;
      document.getElementById('sceneResult').innerHTML = card(`<h3>${escapeHtml(h.title)}</h3><p>${escapeHtml(h.description)}</p><p class="muted">${h.unlocks?.length ? 'Nuove prove aggiunte al fascicolo.' : 'Nessuna nuova prova.'}</p>`);
    }));
  }

  function renderEvidence() {
    view.innerHTML = `<h2>Prove</h2><div class="grid">${data.evidence.map(e => {
      const unlocked = GameState.data.unlockedEvidence.includes(e.id) || e.initial;
      return card(`<span class="badge ${unlocked ? 'new' : ''}">${unlocked ? 'DISPONIBILE' : 'BLOCCATA'}</span><h3>${escapeHtml(e.title)}</h3><p>${unlocked ? escapeHtml(e.description) : 'Questa prova non è ancora stata scoperta.'}</p>`, `evidence-item ${unlocked ? 'unlocked' : 'locked'}`);
    }).join('')}</div>`;
  }

  function renderSuspects() {
    view.innerHTML = `<h2>Sospettati</h2><div class="grid">${data.suspects.map(s => card(`<h3>${escapeHtml(s.name)}</h3><div class="suspect-meta"><span><strong>Età:</strong> ${escapeHtml(s.age)}</span><span><strong>Rapporto:</strong> ${escapeHtml(s.relationship)}</span><span><strong>Alibi dichiarato:</strong> ${escapeHtml(s.alibi)}</span><span><strong>Possibile movente:</strong> ${escapeHtml(s.motive)}</span></div>`)).join('')}</div>`;
  }

  function renderNotes() {
    view.innerHTML = card(`<h2>Appunti investigativi</h2><p class="muted">Gli appunti sono separati per ogni caso e salvati sul dispositivo.</p><textarea id="notes"></textarea><div class="actions"><button class="btn primary" id="saveNotes" type="button">Salva appunti</button></div><div id="notesMsg" class="muted" aria-live="polite"></div>`);
    document.getElementById('notes').value = GameState.data.notes || '';
    document.getElementById('saveNotes').addEventListener('click', () => {
      GameState.data.notes = document.getElementById('notes').value;
      GameState.save();
      document.getElementById('notesMsg').textContent = 'Appunti salvati.';
    });
  }

  function renderAccusation() {
    view.innerHTML = card(`<h2>Accusa finale</h2><p>Quando siete pronti, indicate il colpevole e il movente.</p><label for="culprit">Colpevole</label><select id="culprit">${data.suspects.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('')}</select><label for="motive">Movente</label><input id="motive" type="text" placeholder="Scrivete il movente in poche parole"><div class="actions"><button class="btn danger" id="accuseBtn" type="button">Formula accusa</button></div><div id="accuseResult"></div>`);
    document.getElementById('accuseBtn').addEventListener('click', () => {
      const result = Investigation.checkAccusation(document.getElementById('culprit').value, document.getElementById('motive').value);
      document.getElementById('accuseResult').innerHTML = `<div class="result ${result.success ? 'success' : 'fail'}">${escapeHtml(result.text)}</div>`;
    });
  }

  const renderers = { briefing: renderBriefing, scene: renderScene, evidence: renderEvidence, suspects: renderSuspects, notes: renderNotes, accusation: renderAccusation };
  navButtons.forEach(btn => btn.addEventListener('click', () => {
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderers[btn.dataset.view]();
  }));

  homeBtn.addEventListener('click', () => {
    history.pushState({}, '', location.pathname);
    currentCaseMeta = null;
    data = null;
    renderPortal();
  });

  resetBtn.addEventListener('click', () => {
    if (!currentCaseMeta) return;
    if (confirm('Vuoi davvero cancellare i progressi di questo caso?')) {
      GameState.reset(currentCaseMeta.id);
      GameState.load(currentCaseMeta.id);
      Investigation.unlockEvidence(data.evidence.filter(e => e.initial).map(e => e.id));
      renderBriefing();
    }
  });

  window.addEventListener('popstate', () => routeFromUrl(false));

  async function routeFromUrl(pushState) {
    const caseId = new URLSearchParams(location.search).get('case');
    if (caseId) await openCase(caseId, pushState);
    else renderPortal();
  }

  try {
    await loadCatalog();
    await routeFromUrl(false);
  } catch (error) {
    portalView.innerHTML = `<div class="error-box"><h2>Errore</h2><p>${escapeHtml(error.message)}</p><p>Se stai aprendo il file direttamente dal computer, avvialo tramite un piccolo server locale oppure GitHub Pages.</p></div>`;
  }
})();
