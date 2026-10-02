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
  let currentLocationId = null;

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
    const interviews = state.askedTopics?.length || 0;
    const progress = Math.min(95, 6 + explored * 4 + proofs * 3 + interviews * 3);
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
    currentLocationId = Investigation.locations()[0]?.id || null;

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
    const objectives = (data.objectives || ['Identificare il colpevole', 'Stabilire il movente', 'Ricostruire la dinamica']).map(x => `<li>${escapeHtml(x)}</li>`).join('');
    view.innerHTML = card(`
      <span class="badge new">CASO ${escapeHtml(data.caseNumber)}</span>
      <h2>${escapeHtml(data.title)}</h2>
      <p>${escapeHtml(data.briefing)}</p><hr>
      <div class="grid">
        <div><strong>Vittima</strong><p class="muted">${escapeHtml(data.victim.name)}, ${escapeHtml(data.victim.age)} anni</p></div>
        <div><strong>Luogo</strong><p class="muted">${escapeHtml(data.location)}</p></div>
        <div><strong>Ora del ritrovamento</strong><p class="muted">${escapeHtml(data.timeFound)}</p></div>
        <div><strong>Obiettivi</strong><ul class="compact-list">${objectives}</ul></div>
      </div>
      ${data.instructions ? `<hr><p class="muted">${escapeHtml(data.instructions)}</p>` : ''}`);
  }

  function renderScene(locationId = currentLocationId) {
    const locations = Investigation.locations();
    const location = locations.find(l => l.id === locationId) || locations[0];
    if (!location) { view.innerHTML = card('<h2>Nessun luogo investigabile</h2>'); return; }
    currentLocationId = location.id;
    const tabs = locations.map(l => `<button class="location-tab ${l.id === location.id ? 'active' : ''}" data-location="${escapeHtml(l.id)}" type="button">${escapeHtml(l.name || l.label || 'Luogo')}</button>`).join('');
    const hotspots = (location.hotspots || []).map(h => {
      const examined = GameState.data.examinedHotspots.includes(`${location.id}:${h.id}`);
      return `<button class="hotspot ${examined ? 'examined' : ''}" type="button" data-hotspot="${escapeHtml(h.id)}" style="left:${Number(h.x)}%;top:${Number(h.y)}%" aria-label="Esamina punto ${escapeHtml(h.label)}">${escapeHtml(h.label)}</button>`;
    }).join('');
    const bg = location.image ? `<img class="scene-image" src="${escapeHtml(location.image)}" alt="${escapeHtml(location.name || 'Luogo investigativo')}">` : `<div class="scene-placeholder"><strong>${escapeHtml(location.name || location.label || 'Luogo')}</strong><span>${escapeHtml(location.description || 'Esamina i punti numerati.')}</span></div>`;
    view.innerHTML = `${card(`<h2>Luoghi investigabili</h2><div class="location-tabs">${tabs}</div><p class="muted">${escapeHtml(location.description || 'Tocca i marcatori numerati per esaminare gli elementi disponibili.')}</p>`)}<div class="scene-box">${bg}${hotspots}</div><div id="sceneResult"></div>`;
    document.querySelectorAll('[data-location]').forEach(btn => btn.addEventListener('click', () => renderScene(btn.dataset.location)));
    document.querySelectorAll('[data-hotspot]').forEach(btn => btn.addEventListener('click', () => {
      const h = Investigation.examineHotspot(location.id, btn.dataset.hotspot);
      if (!h) return;
      btn.classList.add('examined');
      document.getElementById('sceneResult').innerHTML = card(`<h3>${escapeHtml(h.title)}</h3><p>${escapeHtml(h.description)}</p><p class="muted">${h.unlocks?.length ? 'Il fascicolo delle prove è stato aggiornato.' : 'Elemento registrato negli appunti investigativi.'}</p>`);
    }));
  }

  function renderEvidence() {
    view.innerHTML = `<div class="section-head"><div><h2>Prove</h2><p class="muted">Gli elementi bloccati si sbloccano esplorando luoghi, eseguendo analisi e interrogando i sospettati.</p></div><span class="badge">${GameState.data.unlockedEvidence.length}/${data.evidence.length}</span></div><div class="grid" id="evidenceGrid">${data.evidence.map(e => {
      const unlocked = Investigation.hasEvidence(e.id);
      const actionDone = GameState.data.evidenceActions.includes(e.id);
      const actionHtml = unlocked && e.action ? `<button class="btn secondary evidence-action" data-evidence-action="${escapeHtml(e.id)}" type="button" ${actionDone ? 'disabled' : ''}>${actionDone ? 'Analisi completata' : escapeHtml(e.action.label)}</button>` : '';
      return card(`<span class="badge ${unlocked ? 'new' : ''}">${unlocked ? escapeHtml(e.category || 'DISPONIBILE') : 'BLOCCATA'}</span><h3>${escapeHtml(e.title)}</h3><p>${unlocked ? escapeHtml(e.description) : 'Questa prova non è ancora stata scoperta.'}</p>${actionHtml}${unlocked && actionDone && e.action?.result ? `<div class="mini-result">${escapeHtml(e.action.result)}</div>` : ''}`, `evidence-item ${unlocked ? 'unlocked' : 'locked'}`);
    }).join('')}</div>`;
    document.querySelectorAll('[data-evidence-action]').forEach(btn => btn.addEventListener('click', () => {
      const action = Investigation.runEvidenceAction(btn.dataset.evidenceAction);
      if (action) renderEvidence();
    }));
  }

  function renderSuspects() {
    view.innerHTML = `<h2>Sospettati</h2><div class="grid">${data.suspects.map(s => card(`<h3>${escapeHtml(s.name)}</h3><div class="suspect-meta"><span><strong>Età:</strong> ${escapeHtml(s.age)}</span><span><strong>Rapporto:</strong> ${escapeHtml(s.relationship)}</span><span><strong>Alibi dichiarato:</strong> ${escapeHtml(s.alibi)}</span><span><strong>Possibile movente:</strong> ${escapeHtml(s.motive)}</span>${s.note ? `<span class="muted">${escapeHtml(s.note)}</span>` : ''}</div>`)).join('')}</div>`;
  }

  function renderInterrogations() {
    const suspectBlocks = data.suspects.map(s => {
      const topics = s.interrogation || [];
      const rows = topics.map(t => {
        const available = Investigation.availableTopic(t);
        const asked = GameState.data.askedTopics.includes(`${s.id}:${t.id}`);
        const requirements = (t.requiresEvidence || []).map(id => data.evidence.find(e => e.id === id)?.title || id).join(', ');
        return `<div class="topic-row ${available ? '' : 'locked-topic'}">
          <div><strong>${escapeHtml(t.question)}</strong>${!available ? `<small>Richiede: ${escapeHtml(requirements)}</small>` : asked ? `<small>Già discusso</small>` : '<small>Domanda disponibile</small>'}</div>
          <button class="btn secondary ask-topic" type="button" data-suspect="${escapeHtml(s.id)}" data-topic="${escapeHtml(t.id)}" ${available ? '' : 'disabled'}>${asked ? 'Rileggi' : 'Chiedi'}</button>
        </div>`;
      }).join('');
      return card(`<h3>${escapeHtml(s.name)}</h3><p class="muted">${escapeHtml(s.relationship)}</p><div class="topic-list">${rows || '<p>Nessuna domanda disponibile.</p>'}</div><div id="answer-${escapeHtml(s.id)}"></div>`);
    }).join('');
    view.innerHTML = `<h2>Interrogatori</h2><p class="muted">Nuove domande diventano disponibili quando trovate elementi con cui confrontare i sospettati.</p><div class="stack">${suspectBlocks}</div>`;
    document.querySelectorAll('.ask-topic').forEach(btn => btn.addEventListener('click', () => {
      const topic = Investigation.askTopic(btn.dataset.suspect, btn.dataset.topic);
      if (!topic) return;
      const target = document.getElementById(`answer-${btn.dataset.suspect}`);
      target.innerHTML = `<div class="statement"><strong>Risposta</strong><p>${escapeHtml(topic.answer)}</p>${topic.note ? `<p class="muted">${escapeHtml(topic.note)}</p>` : ''}</div>`;
      btn.textContent = 'Rileggi';
    }));
  }

  function renderTimeline() {
    const visible = Investigation.visibleTimeline();
    view.innerHTML = `<h2>Cronologia ricostruita</h2><p class="muted">La linea temporale si completa automaticamente quando emergono elementi verificabili.</p><div class="timeline">${visible.map(item => `<div class="timeline-item"><time>${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p></div></div>`).join('') || '<p>Nessun evento verificato.</p>'}</div>`;
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
    const evidenceCount = GameState.data.unlockedEvidence.length;
    view.innerHTML = card(`<h2>Accusa finale</h2><p>Indicate chi ha ucciso ${escapeHtml(data.victim.name)}, perché e con quale metodo. L'accusa viene accettata solo quando avete raccolto gli elementi chiave.</p><p class="muted">Prove raccolte: ${evidenceCount}/${data.evidence.length}</p><label for="culprit">Colpevole</label><select id="culprit">${data.suspects.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('')}</select><label for="motive">Movente</label><input id="motive" type="text" placeholder="Perché avrebbe ucciso la vittima?"><label for="method">Metodo / dinamica</label><input id="method" type="text" placeholder="Come è stato commesso l'omicidio?"><div class="actions"><button class="btn danger" id="accuseBtn" type="button">Formula accusa</button></div><div id="accuseResult"></div>`);
    document.getElementById('accuseBtn').addEventListener('click', () => {
      const result = Investigation.checkAccusation(document.getElementById('culprit').value, document.getElementById('motive').value, document.getElementById('method').value);
      document.getElementById('accuseResult').innerHTML = `<div class="result ${result.success ? 'success' : 'fail'}">${escapeHtml(result.text)}</div>`;
    });
  }

  const renderers = { briefing: renderBriefing, scene: renderScene, evidence: renderEvidence, suspects: renderSuspects, interrogations: renderInterrogations, timeline: renderTimeline, notes: renderNotes, accusation: renderAccusation };
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
