const Investigation = {
  caseData: null,

  setCase(data) { this.caseData = data; },

  hasEvidence(id) {
    return GameState.data.unlockedEvidence.includes(id) || !!this.caseData.evidence.find(e => e.id === id)?.initial;
  },

  hasAllEvidence(ids = []) {
    return ids.every(id => this.hasEvidence(id));
  },

  unlockEvidence(ids = []) {
    ids.forEach(id => {
      if (!GameState.data.unlockedEvidence.includes(id)) GameState.data.unlockedEvidence.push(id);
    });
    GameState.save();
  },

  locations() {
    if (Array.isArray(this.caseData.locations)) return this.caseData.locations;
    if (this.caseData.scene) return [{ id: 'scene', name: this.caseData.scene.label || 'Scena del crimine', ...this.caseData.scene }];
    return [];
  },

  examineHotspot(locationId, hotspotId) {
    const location = this.locations().find(l => l.id === locationId);
    const hotspot = location?.hotspots?.find(h => h.id === hotspotId);
    if (!hotspot) return null;
    const stateId = `${locationId}:${hotspotId}`;
    if (!GameState.data.examinedHotspots.includes(stateId)) GameState.data.examinedHotspots.push(stateId);
    this.unlockEvidence(hotspot.unlocks || []);
    GameState.save();
    return hotspot;
  },

  availableTopic(topic) {
    return this.hasAllEvidence(topic.requiresEvidence || []);
  },

  askTopic(suspectId, topicId) {
    const suspect = this.caseData.suspects.find(s => s.id === suspectId);
    const topic = suspect?.interrogation?.find(t => t.id === topicId);
    if (!topic || !this.availableTopic(topic)) return null;
    const stateId = `${suspectId}:${topicId}`;
    if (!GameState.data.askedTopics.includes(stateId)) GameState.data.askedTopics.push(stateId);
    this.unlockEvidence(topic.unlocks || []);
    GameState.save();
    return topic;
  },

  runEvidenceAction(evidenceId) {
    const evidence = this.caseData.evidence.find(e => e.id === evidenceId);
    if (!evidence?.action || !this.hasEvidence(evidenceId)) return null;
    if (!GameState.data.evidenceActions.includes(evidenceId)) GameState.data.evidenceActions.push(evidenceId);
    this.unlockEvidence(evidence.action.unlocks || []);
    GameState.save();
    return evidence.action;
  },

  visibleTimeline() {
    return (this.caseData.timeline || []).filter(item => this.hasAllEvidence(item.requiresEvidence || []));
  },

  nextSteps() {
    const steps = [];
    const locations = this.locations();
    const unexplored = [];
    locations.forEach(location => {
      (location.hotspots || []).forEach(h => {
        if (!GameState.data.examinedHotspots.includes(`${location.id}:${h.id}`)) unexplored.push(location);
      });
    });
    if (unexplored.length) {
      const first = unexplored[0];
      steps.push(`Esplorate ${first.name || first.label || 'un luogo'}: ci sono ancora elementi non esaminati.`);
    }

    const pendingActions = (this.caseData.evidence || []).filter(e => this.hasEvidence(e.id) && e.action && !GameState.data.evidenceActions.includes(e.id));
    if (pendingActions.length) steps.push(`Avete ${pendingActions.length} prova${pendingActions.length === 1 ? '' : 'e'} che può essere analizzata ulteriormente.`);

    let availableQuestions = 0;
    (this.caseData.suspects || []).forEach(s => (s.interrogation || []).forEach(t => {
      const stateId = `${s.id}:${t.id}`;
      if (this.availableTopic(t) && !GameState.data.askedTopics.includes(stateId)) availableQuestions++;
    }));
    if (availableQuestions) steps.push(`Sono disponibili ${availableQuestions} nuove domande negli interrogatori.`);

    if (!steps.length && !GameState.data.solved) steps.push('Rivedete cronologia e appunti: potreste avere già abbastanza elementi per formulare una teoria.');
    if (GameState.data.solved) steps.push('Caso risolto. Potete rileggere la ricostruzione finale e confrontarla con i vostri appunti.');
    return steps.slice(0, 4);
  },

  checkAccusation(suspectId, motive, method) {
    const solution = this.caseData.solution;
    const missingRequired = (solution.requiredEvidenceIds || []).filter(id => !this.hasEvidence(id));
    if (missingRequired.length) {
      return {
        success: false,
        text: solution.notEnoughEvidence || `Non avete ancora raccolto abbastanza elementi per sostenere l'accusa. Mancano ${missingRequired.length} passaggi chiave dell'indagine.`
      };
    }

    const correctSuspect = suspectId === solution.culpritId;
    const normalize = value => String(value || '').trim().toLowerCase();
    const motiveText = normalize(motive);
    const methodText = normalize(method);
    const motiveKeywords = solution.motiveKeywords || [solution.motiveKeyword || ''];
    const methodKeywords = solution.methodKeywords || [];
    const motiveOk = motiveKeywords.some(k => k && motiveText.includes(normalize(k)));
    const methodOk = !methodKeywords.length || methodKeywords.some(k => k && methodText.includes(normalize(k)));
    const success = correctSuspect && motiveOk && methodOk;

    if (success) {
      GameState.data.solved = true;
      GameState.save();
    }
    return { success, text: success ? solution.reveal : solution.failureHint };
  }
};
