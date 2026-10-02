const Investigation = {
  caseData: null,

  setCase(data) { this.caseData = data; },

  unlockEvidence(ids) {
    ids.forEach(id => {
      if (!GameState.data.unlockedEvidence.includes(id)) GameState.data.unlockedEvidence.push(id);
    });
    GameState.save();
  },

  examineHotspot(id) {
    const hotspot = this.caseData.scene.hotspots.find(h => h.id === id);
    if (!hotspot) return null;
    if (!GameState.data.examinedHotspots.includes(id)) GameState.data.examinedHotspots.push(id);
    this.unlockEvidence(hotspot.unlocks || []);
    GameState.save();
    return hotspot;
  },

  checkAccusation(suspectId, motive) {
    const solution = this.caseData.solution;
    const correctSuspect = suspectId === solution.culpritId;
    const normalized = motive.trim().toLowerCase();
    const keywords = solution.motiveKeywords || [solution.motiveKeyword || ''];
    const motiveOk = keywords.some(k => k && normalized.includes(k.toLowerCase()));
    const success = correctSuspect && motiveOk;
    if (success) {
      GameState.data.solved = true;
      GameState.save();
    }
    return { success, text: success ? solution.reveal : solution.failureHint };
  }
};
