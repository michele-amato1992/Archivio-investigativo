(async function () {
  const portalView = document.getElementById('portalView');
  const caseView = document.getElementById('caseView');
  const view = document.getElementById('view');
  const pageTitle = document.getElementById('pageTitle');
  const homeBtn = document.getElementById('homeBtn');
  const resetBtn = document.getElementById('resetBtn');
  const guideBtn = document.getElementById('guideBtn');
  const guideDialog = document.getElementById('guideDialog');
  const onboardingDialog = document.getElementById('onboardingDialog');
  const navButtons = [...document.querySelectorAll('.nav-btn')];
  let catalog = [];
  let currentCaseMeta = null;
  let data = null;
  let currentLocationId = null;

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function initials(name = '') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]?.toUpperCase()).join('');
  }

  function card(html, cls = '') { return `<article class="card ${cls}">${html}</article>`; }

  function evidenceById(id) {
    return data?.evidence?.find(e => e.id === id) || null;
  }

  function evidenceSymbol(category = '') {
    const key = String(category).toUpperCase();
    const map = {
      'VERBALE':'▤','MEDICO':'✚','DOCUMENTO':'▧','REPERTO':'◇','TELEFONO':'▣','DIGITALE':'⌘',
      'TECNICO':'⌁','VIDEO':'▶','REGISTRO':'≡','LABORATORIO':'⚗','FINANZIARIO':'€','E-MAIL':'@',
      'TESTIMONIANZA':'❝'
    };
    return map[key] || '◆';
  }

  function suspectImage(s) {
    return s?.image ? `<img src="${escapeHtml(s.image)}" alt="Ritratto investigativo di ${escapeHtml(s.name)}">` : escapeHtml(initials(s?.name || ''));
  }

  function showToast(title, text = '') {
    let toast = document.getElementById('discoveryToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'discoveryToast';
      toast.className = 'discovery-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="discovery-toast-kicker">NUOVA SCOPERTA</span><strong>${escapeHtml(title)}</strong>${text ? `<small>${escapeHtml(text)}</small>` : ''}`;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 4200);
  }

  function markEvidenceSeen(id) {
    GameState.data.seenEvidence ||= [];
    if (!GameState.data.seenEvidence.includes(id)) {
      GameState.data.seenEvidence.push(id);
      GameState.save();
    }
  }

  function showGuide() {
    if (typeof guideDialog.showModal === 'function') guideDialog.showModal();
    else alert('Leggete il fascicolo, esplorate i luoghi, analizzate le prove, interrogate i sospettati e formulate un\'accusa finale.');
  }

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
            <span>Luogo · ${escapeHtml(meta.location)}</span>
            <span>Difficoltà · ${escapeHtml(meta.difficulty)}</span>
            <span>Durata · ${escapeHtml(meta.duration)}</span>
            <span>Squadra · ${escapeHtml(meta.players)}</span>
          </div>
          ${status.progress > 0 && !disabled ? `<div class="progressbar" aria-label="Avanzamento indicativo"><span style="width:${status.progress}%"></span></div>` : ''}
          <button class="btn primary open-case" type="button" data-case-id="${escapeHtml(meta.id)}" ${disabled ? 'disabled' : ''}>
            ${status.label === 'In corso' ? 'Continua indagine' : status.label === 'Risolto' ? 'Rivedi il caso' : 'Apri fascicolo'}
          </button>
        </article>`;
    }).join('');

    portalView.innerHTML = `
      <section class="portal-hero">
        <p class="eyebrow">CENTRALE OPERATIVA</p>
        <h2>Ogni dettaglio può cambiare il caso.</h2>
        <p class="muted">Un portale cooperativo da usare tutti insieme sullo stesso PC, tablet o telefono. Esplorate le scene, confrontate le testimonianze e annotate le vostre teorie.</p>
        <div class="portal-tools"><button class="btn secondary" id="portalGuide" type="button">Leggi le istruzioni</button></div>
      </section>
      <section class="case-grid">${cards || '<p>Nessun caso disponibile.</p>'}</section>`;

    document.querySelectorAll('.open-case').forEach(btn => btn.addEventListener('click', () => openCase(btn.dataset.caseId, true)));
    document.getElementById('portalGuide')?.addEventListener('click', showGuide);
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

    if (!GameState.data.onboardingSeen) {
      GameState.data.onboardingSeen = true;
      GameState.save();
      setTimeout(() => {
        if (typeof onboardingDialog.showModal === 'function') onboardingDialog.showModal();
      }, 150);
    }
  }

  function renderNextSteps() {
    return Investigation.nextSteps().map((step, i) => `<div class="next-step"><b>${i + 1}</b><span>${escapeHtml(step)}</span></div>`).join('');
  }

  function renderBriefing() {
    const objectives = (data.objectives || ['Identificare il colpevole', 'Stabilire il movente', 'Ricostruire la dinamica']).map(x => `<li>${escapeHtml(x)}</li>`).join('');
    const discovered = (data.evidence || []).filter(e => Investigation.hasEvidence(e.id)).length;
    const explored = GameState.data.examinedHotspots.length;
    const asked = GameState.data.askedTopics.length;
    view.innerHTML = `
      <section class="case-dashboard">
        <div class="case-hero">
          <div class="case-hero-copy">
            <div class="case-id-row"><span class="case-stamp">CASO ${escapeHtml(data.caseNumber)}</span><span class="case-status-dot">INDAGINE APERTA</span></div>
            <h2>${escapeHtml(data.title)}</h2>
            <p class="case-lead">${escapeHtml(data.briefing)}</p>
          </div>
          <div class="case-file-meta">
            <div><span>VITTIMA</span><strong>${escapeHtml(data.victim.name)}</strong><small>${escapeHtml(data.victim.age)} anni</small></div>
            <div><span>LUOGO</span><strong>${escapeHtml(data.location)}</strong><small>Scena primaria</small></div>
            <div><span>RITROVAMENTO</span><strong>${escapeHtml(data.timeFound)}</strong><small>Orario registrato</small></div>
            <div><span>MODALITÀ</span><strong>Cooperativa</strong><small>Un dispositivo</small></div>
          </div>
        </div>
        <div class="intel-strip">
          <div><span>REPERTI ACQUISITI</span><strong>${discovered}</strong></div>
          <div><span>ELEMENTI ESAMINATI</span><strong>${explored}</strong></div>
          <div><span>DOMANDE POSTE</span><strong>${asked}</strong></div>
        </div>
        <div class="dashboard-grid">
          ${card(`<p class="eyebrow">OBIETTIVI DELL'INDAGINE</p><ul class="objective-list">${objectives}</ul>${data.instructions ? `<div class="briefing-note">${escapeHtml(data.instructions)}</div>` : ''}`,'paper-card')}
          ${card(`<p class="eyebrow">PROSSIME POSSIBILITÀ</p><div class="next-steps">${renderNextSteps()}</div><div class="quick-actions"><button class="btn primary" id="goScenes" type="button">Esplora i luoghi</button><button class="btn secondary" id="briefGuide" type="button">Come si gioca</button></div>`,'next-actions-card')}
        </div>
      </section>`;
    document.getElementById('goScenes')?.addEventListener('click', () => activateView('scene'));
    document.getElementById('briefGuide')?.addEventListener('click', showGuide);
  }

  function renderScene(locationId = currentLocationId) {
    const locations = Investigation.locations();
    const location = locations.find(l => l.id === locationId) || locations[0];
    if (!location) { view.innerHTML = card('<h2>Nessun luogo investigabile</h2>'); return; }
    currentLocationId = location.id;

    const tabs = locations.map(l => {
      const done = (l.hotspots || []).filter(h => GameState.data.examinedHotspots.includes(`${l.id}:${h.id}`)).length;
      return `<button class="location-tab ${l.id === location.id ? 'active' : ''}" data-location="${escapeHtml(l.id)}" type="button"><span>${escapeHtml(l.name || l.label || 'Luogo')}</span><small>${done ? `${done} esaminati` : 'Da esplorare'}</small></button>`;
    }).join('');

    const hotspots = (location.hotspots || []).map(h => {
      const examined = GameState.data.examinedHotspots.includes(`${location.id}:${h.id}`);
      const hasBox = Number.isFinite(Number(h.w)) && Number.isFinite(Number(h.h));
      const left = hasBox ? Number(h.x) : Number(h.x) - 3;
      const top = hasBox ? Number(h.y) : Number(h.y) - 4;
      const width = hasBox ? Number(h.w) : 6;
      const height = hasBox ? Number(h.h) : 8;
      const tipClasses = [
        top < 18 ? 'tip-below' : '',
        left < 12 ? 'tip-align-left' : '',
        (left + width) > 88 ? 'tip-align-right' : ''
      ].filter(Boolean).join(' ');
      return `<button class="hotspot-region ${examined ? 'examined' : ''} ${tipClasses}" type="button" data-hotspot="${escapeHtml(h.id)}" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-label="Individua ${escapeHtml(h.title || h.label)}">
        <span class="hotspot-frame" aria-hidden="true"></span>
      </button>`;
    }).join('');

    const bg = location.image
      ? `<img class="scene-image" src="${escapeHtml(location.image)}" alt="${escapeHtml(location.name || 'Luogo investigativo')}">`
      : `<div class="scene-placeholder"><strong>${escapeHtml(location.name || location.label || 'Luogo')}</strong><span>${escapeHtml(location.description || 'Osserva attentamente la scena.')}</span></div>`;

    const examinedCount = (location.hotspots || []).filter(h => GameState.data.examinedHotspots.includes(`${location.id}:${h.id}`)).length;
    view.innerHTML = `
      <div class="scene-page-head">
        <div><p class="eyebrow">SCENE E LUOGHI</p><h2>Esplorazione della scena</h2><p><strong>Non ci sono marcatori visibili.</strong> Muovi il mouse lentamente sulla fotografia: quando individui qualcosa di interessante, l'oggetto si incornicia. Su telefono usa <em>Aiuto ricerca</em> se serve.</p></div>
        <span class="scene-progress">${examinedCount} elementi esaminati</span>
      </div>
      <div class="location-tabs location-tabs-v4">${tabs}</div>
      <section class="scene-stage">
        <div class="scene-caption">
          <div><span class="eyebrow">${escapeHtml(location.name || location.label || 'LUOGO')}</span><h3>${escapeHtml(location.name || location.label || 'Luogo')}</h3><p>${escapeHtml(location.description || 'Osservate attentamente la scena.')}</p></div>
          <button id="revealHotspots" class="scene-search-help" type="button" aria-pressed="false"><span>⌕</span> Aiuto ricerca</button>
        </div>
        <div id="sceneBox" class="scene-box scene-search-mode">${bg}<div class="scene-vignette"></div>${hotspots}<div id="sceneHoverTip" class="scene-hover-tip" role="status" aria-live="polite"></div><div class="scan-instruction"><span>⌖</span><strong>Esplora la scena</strong><small>Muovi il puntatore sugli oggetti</small></div></div>
      </section>
      <div id="sceneInspector" class="scene-inspector empty"><div><span class="eyebrow">ISPETTORE SCENA</span><h3>Nessun elemento selezionato</h3><p>Esplora la fotografia. Quando il cursore incontra un elemento investigabile, questo verrà evidenziato senza anticiparti ciò che nasconde.</p></div></div>
      <div id="sceneResult"></div>`;

    document.querySelectorAll('[data-location]').forEach(btn => btn.addEventListener('click', () => renderScene(btn.dataset.location)));

    const sceneBox = document.getElementById('sceneBox');
    const hoverTip = document.getElementById('sceneHoverTip');
    const helpBtn = document.getElementById('revealHotspots');

    const positionHoverTip = (btn, hotspot) => {
      if (!sceneBox || !hoverTip || !btn || !hotspot) return;
      const examined = GameState.data.examinedHotspots.includes(`${location.id}:${hotspot.id}`);
      hoverTip.innerHTML = `<strong>${escapeHtml(hotspot.title || 'Elemento da esaminare')}</strong><small>${examined ? 'Già esaminato · clicca per rileggere' : 'Clicca per osservare'}</small>`;
      hoverTip.classList.add('show');
      requestAnimationFrame(() => {
        const box = sceneBox.getBoundingClientRect();
        const r = btn.getBoundingClientRect();
        const tw = hoverTip.offsetWidth || 210;
        const th = hoverTip.offsetHeight || 56;
        const pad = 10;
        const centerX = (r.left - box.left) + r.width / 2;
        let left = centerX - tw / 2;
        left = Math.max(pad, Math.min(left, box.width - tw - pad));
        const above = (r.top - box.top) - th - 10;
        const below = (r.bottom - box.top) + 10;
        let top = above >= pad ? above : below;
        if (top + th > box.height - pad) top = Math.max(pad, box.height - th - pad);
        hoverTip.style.left = `${left}px`;
        hoverTip.style.top = `${top}px`;
        hoverTip.classList.toggle('below', above < pad);
      });
    };
    const hideHoverTip = () => hoverTip?.classList.remove('show');
    helpBtn?.addEventListener('click', () => {
      const on = sceneBox.classList.toggle('reveal-search');
      helpBtn.setAttribute('aria-pressed', String(on));
      helpBtn.classList.toggle('active', on);
      helpBtn.innerHTML = on ? '<span>×</span> Nascondi aiuto' : '<span>⌕</span> Aiuto ricerca';
    });

    document.querySelectorAll('[data-hotspot]').forEach(btn => {
      const hotspot = (location.hotspots || []).find(h => h.id === btn.dataset.hotspot);
      if (!hotspot) return;
      btn.addEventListener('pointerenter', () => positionHoverTip(btn, hotspot));
      btn.addEventListener('focus', () => positionHoverTip(btn, hotspot));
      btn.addEventListener('pointerleave', hideHoverTip);
      btn.addEventListener('blur', hideHoverTip);
      btn.addEventListener('click', () => {
      hideHoverTip();
      if (!hotspot) return;
      document.querySelectorAll('.hotspot-region').forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
      sceneBox?.classList.remove('reveal-search');
      if (helpBtn) {
        helpBtn.classList.remove('active');
        helpBtn.setAttribute('aria-pressed', 'false');
        helpBtn.innerHTML = '<span>⌕</span> Aiuto ricerca';
      }
      const examined = GameState.data.examinedHotspots.includes(`${location.id}:${hotspot.id}`);
      const inspector = document.getElementById('sceneInspector');
      inspector.className = 'scene-inspector scene-inspector-active';
      inspector.innerHTML = `<div><span class="eyebrow">ELEMENTO INDIVIDUATO</span><h3>${escapeHtml(hotspot.title)}</h3><p>${examined ? 'Questo elemento è già stato esaminato. Puoi rileggere il risultato senza modificare l’indagine.' : 'Avete individuato qualcosa che può essere osservato più da vicino. L’indizio verrà rivelato solo dopo l’esame.'}</p></div><button class="btn ${examined ? 'secondary' : 'primary'}" id="inspectSelected" type="button">${examined ? 'Rileggi risultato' : 'Esamina elemento'}</button>`;
      inspector.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });

      document.getElementById('inspectSelected')?.addEventListener('click', () => {
        const before = new Set(GameState.data.unlockedEvidence);
        const h = Investigation.examineHotspot(location.id, hotspot.id);
        if (!h) return;
        btn.classList.add('examined');
        const newly = (h.newlyUnlocked || []).filter(id => !before.has(id));
        document.getElementById('sceneResult').innerHTML = card(`<div class="discovery-head"><span class="discovery-icon">✦</span><div><p class="eyebrow">SCOPERTA DALLA SCENA</p><h3>${escapeHtml(h.title)}</h3></div></div><p class="discovery-text">${escapeHtml(h.description)}</p>${newly.length ? `<div class="new-evidence-list"><strong>${newly.length === 1 ? 'Nuovo reperto acquisito' : 'Nuovi reperti acquisiti'}</strong>${newly.map(id => `<span>${escapeHtml(evidenceById(id)?.title || id)}</span>`).join('')}</div>` : '<p class="muted">Nessun nuovo reperto, ma l’osservazione è stata registrata.</p>'}`, 'discovery-card');
        if (newly.length) {
          const first = evidenceById(newly[0]);
          showToast(first?.title || 'Nuovo reperto', newly.length > 1 ? `+${newly.length - 1} altri elementi` : 'Aggiunto alla sezione Prove');
        }
        const count = (location.hotspots || []).filter(x => GameState.data.examinedHotspots.includes(`${location.id}:${x.id}`)).length;
        const progress = document.querySelector('.scene-progress');
        if (progress) progress.textContent = `${count} elementi esaminati`;
        const tab = document.querySelector(`[data-location="${CSS.escape(location.id)}"] small`);
        if (tab) tab.textContent = `${count} esaminati`;
      });
      });
    });
  }

  function renderEvidence() {
    GameState.data.seenEvidence ||= [];
    const unlocked = (data.evidence || []).filter(e => Investigation.hasEvidence(e.id));
    const unseenCount = unlocked.filter(e => !GameState.data.seenEvidence.includes(e.id)).length;
    const cardsHtml = unlocked.map((e, index) => {
      const isNew = !GameState.data.seenEvidence.includes(e.id);
      const actionDone = GameState.data.evidenceActions.includes(e.id);
      const actionHtml = e.action ? `<button class="btn secondary evidence-action" data-evidence-action="${escapeHtml(e.id)}" type="button" ${actionDone ? 'disabled' : ''}>${actionDone ? 'Analisi completata' : escapeHtml(e.action.label)}</button>` : '';
      return `<article class="evidence-file ${isNew ? 'is-new' : ''}" data-evidence-card="${escapeHtml(e.id)}">
        <div class="evidence-file-top"><span class="evidence-code">REP-${String(index + 1).padStart(3,'0')}</span>${isNew ? '<span class="new-ribbon">NUOVO</span>' : `<span class="evidence-category">${escapeHtml(e.category || 'REPERTO')}</span>`}</div>
        <div class="evidence-visual evidence-${escapeHtml(String(e.category || 'reperto').toLowerCase())}"><span>${escapeHtml(evidenceSymbol(e.category))}</span><small>${escapeHtml(e.category || 'Reperto')}</small><i aria-hidden="true"></i></div>
        <div class="evidence-content"><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.description)}</p>${actionHtml}${actionDone && e.action?.result ? `<div class="analysis-result"><span>RISULTATO ANALISI</span>${escapeHtml(e.action.result)}</div>` : ''}</div>
      </article>`;
    }).join('');
    view.innerHTML = `<div class="section-head evidence-head"><div><p class="eyebrow">REPERTI ACQUISITI</p><h2>Prove</h2><p class="muted">Qui compaiono <strong>solo</strong> gli elementi che avete realmente scoperto. Le prove ancora sconosciute non vengono mostrate.</p></div><div class="evidence-summary"><strong>${unlocked.length}</strong><span>acquisite</span>${unseenCount ? `<b>${unseenCount} nuove</b>` : ''}</div></div>${unlocked.length ? `<div class="evidence-grid-v4">${cardsHtml}</div>` : `<div class="empty-state"><span>⌕</span><h3>Nessun reperto acquisito</h3><p>Esplorate i luoghi e interagite con gli elementi della scena. Le prove appariranno qui solo dopo la scoperta.</p><button class="btn primary" id="emptyGoScenes" type="button">Vai ai luoghi</button></div>`}`;
    document.getElementById('emptyGoScenes')?.addEventListener('click', () => activateView('scene'));
    document.querySelectorAll('[data-evidence-card]').forEach(el => el.addEventListener('click', evt => {
      if (evt.target.closest('button')) return;
      markEvidenceSeen(el.dataset.evidenceCard);
      el.classList.remove('is-new');
      el.querySelector('.new-ribbon')?.replaceWith(Object.assign(document.createElement('span'), {className:'evidence-category', textContent: evidenceById(el.dataset.evidenceCard)?.category || 'REPERTO'}));
    }));
    document.querySelectorAll('[data-evidence-action]').forEach(btn => btn.addEventListener('click', () => {
      const action = Investigation.runEvidenceAction(btn.dataset.evidenceAction);
      if (action?.newlyUnlocked?.length) { const first = evidenceById(action.newlyUnlocked[0]); showToast(first?.title || 'Nuovo reperto', 'Risultato di un’analisi'); }
      renderEvidence();
    }));
  }

  function renderSuspects() {
    const statuses = GameState.data.noteBoard?.suspectStatuses || {};
    view.innerHTML = `<div class="section-head"><div><p class="eyebrow">PERSONE DI INTERESSE</p><h2>Sospettati</h2><p class="muted">Il possibile movente non equivale a colpevolezza. Le schede raccolgono solo informazioni già note alla squadra.</p></div></div><div class="suspect-grid-v7">${data.suspects.map((s, idx) => {
      const asked = (s.interrogation || []).filter(t => GameState.data.askedTopics.includes(`${s.id}:${t.id}`)).length;
      const available = (s.interrogation || []).filter(t => Investigation.availableTopic(t) && !GameState.data.askedTopics.includes(`${s.id}:${t.id}`)).length;
      return `<article class="suspect-dossier">
        <div class="suspect-photo"><span class="suspect-index">SOG-${String(idx+1).padStart(2,'0')}</span>${suspectImage(s)}</div>
        <div class="suspect-body">
          <div class="suspect-title-row"><div><p class="eyebrow">PERSONA DI INTERESSE</p><h3>${escapeHtml(s.name)}</h3></div><span class="badge">${escapeHtml(statuses[s.id] || 'Da valutare')}</span></div>
          <div class="suspect-facts"><span><small>ETÀ</small><strong>${escapeHtml(s.age)}</strong></span><span><small>RAPPORTO</small><strong>${escapeHtml(s.relationship)}</strong></span></div>
          <div class="suspect-block"><small>ALIBI DICHIARATO</small><p>${escapeHtml(s.alibi)}</p></div>
          <div class="suspect-block"><small>POSSIBILE MOVENTE</small><p>${escapeHtml(s.motive)}</p></div>
          ${s.interviewProfile ? `<div class="suspect-profile"><small>PROFILO INTERROGATORIO</small><p>${escapeHtml(s.interviewProfile)}</p></div>` : ''}
          <div class="suspect-foot"><span>${asked} domande verbalizzate</span>${available ? `<b>${available} nuove domande</b>` : '<span>Nessuna nuova domanda</span>'}</div>
        </div>
      </article>`;
    }).join('')}</div>`;
  }

  function renderInterrogations() {
    const suspectBlocks = data.suspects.map((s, idx) => {
      const topics = s.interrogation || [];
      const availableTopics = topics.filter(t => Investigation.availableTopic(t));
      const askedTopics = availableTopics.filter(t => GameState.data.askedTopics.includes(`${s.id}:${t.id}`));
      const pendingTopics = availableTopics.filter(t => !GameState.data.askedTopics.includes(`${s.id}:${t.id}`));
      const transcript = askedTopics.map(t => `<div class="transcript-entry"><div class="transcript-q"><span>INVESTIGATORE</span><p>${escapeHtml(t.question)}</p></div><div class="transcript-a"><span>${escapeHtml(s.name.toUpperCase())}</span><p>${escapeHtml(t.answer)}</p>${t.note ? `<small>${escapeHtml(t.note)}</small>` : ''}</div></div>`).join('');
      const rows = pendingTopics.map(t => `<button class="interview-question ask-topic" type="button" data-suspect="${escapeHtml(s.id)}" data-topic="${escapeHtml(t.id)}"><span>Nuova linea di domanda</span><strong>${escapeHtml(t.question)}</strong><i>→</i></button>`).join('');
      return `<article class="interview-file">
        <header class="interview-head"><div class="interview-photo">${suspectImage(s)}</div><div><p class="eyebrow">VERBALE INTERROGATORIO · SOG-${String(idx+1).padStart(2,'0')}</p><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.relationship)}</p></div><div class="interview-count"><strong>${askedTopics.length}</strong><span>verbalizzate</span></div></header>
        ${transcript ? `<div class="transcript">${transcript}</div>` : `<div class="interview-empty"><span>●</span><p>Nessuna risposta ancora verbalizzata per questo soggetto.</p></div>`}
        <div class="interview-actions"><p class="eyebrow">DOMANDE DISPONIBILI</p>${rows || '<p class="muted">Nessuna nuova domanda disponibile. Altre linee possono emergere raccogliendo prove.</p>'}</div>
      </article>`;
    }).join('');
    view.innerHTML = `<div class="section-head"><div><p class="eyebrow">SALA INTERROGATORI</p><h2>Interrogatori</h2><p class="muted">Le domande future restano completamente nascoste. Compaiono soltanto quando una prova rende possibile quella linea di interrogatorio.</p></div></div><div class="interview-stack">${suspectBlocks}</div>`;
    document.querySelectorAll('.ask-topic').forEach(btn => btn.addEventListener('click', () => {
      const topic = Investigation.askTopic(btn.dataset.suspect, btn.dataset.topic);
      if (!topic) return;
      if (topic.newlyUnlocked?.length) {
        const first = evidenceById(topic.newlyUnlocked[0]);
        showToast(first?.title || 'Nuova informazione', topic.newlyUnlocked.length > 1 ? `+${topic.newlyUnlocked.length - 1} altri elementi` : 'Acquisita durante l’interrogatorio');
      }
      renderInterrogations();
    }));
  }

  function renderTimeline() {
    const visible = Investigation.visibleTimeline();
    view.innerHTML = `<div class="section-head"><div><p class="eyebrow">RICOSTRUZIONE TEMPORALE</p><h2>Cronologia</h2><p class="muted">La linea temporale si completa automaticamente quando emergono elementi verificabili.</p></div></div><div class="timeline">${visible.map(item => `<div class="timeline-item"><time>${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p></div></div>`).join('') || '<p>Nessun evento verificato.</p>'}</div>`;
  }

  function renderNotes() {
    const board = GameState.data.noteBoard || {};
    const statuses = board.suspectStatuses || {};
    view.innerHTML = `
      <div class="section-head"><div><p class="eyebrow">LAVAGNA DELLA SQUADRA</p><h2>Appunti di squadra</h2><p class="muted">Tutto viene salvato automaticamente su questo dispositivo.</p></div><span class="autosave" id="autosaveStatus">Salvataggio automatico attivo</span></div>
      <div class="notes-layout">
        ${card(`
          <div class="note-section"><label for="notes">Appunti liberi</label><small>Scrivete qualunque dettaglio che volete ricordare.</small><textarea id="notes" placeholder="Orari, collegamenti, dettagli sospetti..."></textarea></div>
          <div class="note-section"><label for="theories">Teoria del gruppo</label><small>Come pensate che siano andate le cose?</small><textarea id="theories" placeholder="La nostra ricostruzione attuale..."></textarea></div>
          <div class="note-section"><label for="contradictions">Contraddizioni</label><small>Segnate qui bugie, orari incompatibili e versioni che non coincidono.</small><textarea id="contradictions" placeholder="Marco dice..., ma la telecamera..."></textarea></div>
          <div class="note-section"><label for="questions">Domande aperte</label><small>Cosa dobbiamo ancora verificare?</small><textarea id="questions" placeholder="Chi aveva accesso a...? Perché...?"></textarea></div>
          <div class="note-section"><label for="motive">Movente ipotizzato</label><textarea id="motive" placeholder="Quale potrebbe essere il vero movente?"></textarea></div>
        `)}
        ${card(`<p class="eyebrow">VALUTAZIONE SOSPETTATI</p><h3>Stato della squadra</h3><p class="muted">Queste etichette non cambiano il gioco: servono solo a organizzare la discussione.</p><div class="pin-list">${data.suspects.map(s => `<div class="pin-card"><strong>${escapeHtml(s.name)}</strong><select class="suspect-status" data-suspect-status="${escapeHtml(s.id)}"><option value="Da valutare">Da valutare</option><option value="Da approfondire">Da approfondire</option><option value="Alibi dubbio">Alibi dubbio</option><option value="Sospetto principale">Sospetto principale</option><option value="Poco probabile">Poco probabile</option><option value="Scagionato">Scagionato</option></select></div>`).join('')}</div>`)}
      </div>`;

    const values = {
      notes: GameState.data.notes || '',
      theories: board.theories || '',
      contradictions: board.contradictions || '',
      questions: board.questions || '',
      motive: board.motive || ''
    };
    Object.entries(values).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });
    document.querySelectorAll('.suspect-status').forEach(el => { el.value = statuses[el.dataset.suspectStatus] || 'Da valutare'; });

    let saveTimer;
    function scheduleSave() {
      const status = document.getElementById('autosaveStatus');
      if (status) status.textContent = 'Salvataggio...';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        GameState.data.notes = document.getElementById('notes')?.value || '';
        GameState.data.noteBoard = GameState.data.noteBoard || {};
        GameState.data.noteBoard.theories = document.getElementById('theories')?.value || '';
        GameState.data.noteBoard.contradictions = document.getElementById('contradictions')?.value || '';
        GameState.data.noteBoard.questions = document.getElementById('questions')?.value || '';
        GameState.data.noteBoard.motive = document.getElementById('motive')?.value || '';
        GameState.save();
        if (status) status.textContent = 'Salvato';
      }, 350);
    }
    document.querySelectorAll('#notes,#theories,#contradictions,#questions,#motive').forEach(el => el.addEventListener('input', scheduleSave));
    document.querySelectorAll('.suspect-status').forEach(el => el.addEventListener('change', () => {
      GameState.data.noteBoard = GameState.data.noteBoard || {};
      GameState.data.noteBoard.suspectStatuses = GameState.data.noteBoard.suspectStatuses || {};
      GameState.data.noteBoard.suspectStatuses[el.dataset.suspectStatus] = el.value;
      GameState.save();
      const status = document.getElementById('autosaveStatus');
      if (status) status.textContent = 'Salvato';
    }));
  }

  function renderAccusation() {
    const unlockedEvidence = (data.evidence || []).filter(e => Investigation.hasEvidence(e.id));
    const evidenceOptions = unlockedEvidence.map(e => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title)}</option>`).join('');
    view.innerHTML = card(`<p class="eyebrow">CHIUSURA DEL CASO</p><h2>Accusa finale</h2><p>La squadra deve presentare una ricostruzione completa: responsabile, movente, metodo, finestra temporale e prova decisiva.</p><p class="muted">Reperti acquisiti: ${unlockedEvidence.length}. Il sistema non indica quante prove esistono complessivamente.</p><label for="culprit">Responsabile</label><select id="culprit">${data.suspects.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('')}</select><label for="accuseMotive">Movente</label><input id="accuseMotive" type="text" placeholder="Perché avrebbe dovuto uccidere Andrea?"><label for="method">Metodo / dinamica</label><input id="method" type="text" placeholder="Come è stato commesso l'omicidio?"><label for="timeWindow">Finestra temporale / momento chiave</label><input id="timeWindow" type="text" placeholder="Es. tra le 23:07 e le 23:16"><label for="decisiveEvidence">Prova che ritenete decisiva</label><select id="decisiveEvidence"><option value="">Seleziona una prova acquisita</option>${evidenceOptions}</select><div class="actions"><button class="btn danger" id="accuseBtn" type="button">Presenta ricostruzione</button></div><div id="accuseResult"></div>`);
    document.getElementById('accuseMotive').value = GameState.data.noteBoard?.motive || '';
    document.getElementById('accuseBtn').addEventListener('click', () => {
      const result = Investigation.checkAccusation(
        document.getElementById('culprit').value,
        document.getElementById('accuseMotive').value,
        document.getElementById('method').value,
        document.getElementById('timeWindow').value,
        document.getElementById('decisiveEvidence').value
      );
      document.getElementById('accuseResult').innerHTML = `<div class="result ${result.success ? 'success' : 'fail'}">${escapeHtml(result.text)}</div>`;
    });
  }

  const renderers = { briefing: renderBriefing, scene: renderScene, evidence: renderEvidence, suspects: renderSuspects, interrogations: renderInterrogations, timeline: renderTimeline, notes: renderNotes, accusation: renderAccusation };

  function activateView(name) {
    const btn = navButtons.find(b => b.dataset.view === name);
    if (!btn || !renderers[name]) return;
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderers[name]();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(btn => btn.addEventListener('click', () => activateView(btn.dataset.view)));
  guideBtn.addEventListener('click', showGuide);

  homeBtn.addEventListener('click', () => {
    history.pushState({}, '', location.pathname);
    currentCaseMeta = null;
    data = null;
    renderPortal();
  });

  resetBtn.addEventListener('click', () => {
    if (!currentCaseMeta) return;
    if (confirm('Vuoi davvero cancellare progressi, appunti e valutazioni di questo caso?')) {
      GameState.reset(currentCaseMeta.id);
      GameState.load(currentCaseMeta.id);
      Investigation.unlockEvidence(data.evidence.filter(e => e.initial).map(e => e.id));
      navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === 'briefing'));
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
