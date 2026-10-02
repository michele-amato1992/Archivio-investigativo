const GameState = {
  caseId: null,
  data: null,

  defaultData() {
    return {
      unlockedEvidence: [],
      examinedHotspots: [],
      askedTopics: [],
      evidenceActions: [],
      notes: '',
      solved: false,
      startedAt: null,
      updatedAt: null
    };
  },

  key(caseId = this.caseId) {
    return `case-files-state-v3-${caseId}`;
  },

  legacyKey(caseId = this.caseId) {
    return `case-files-state-v2-${caseId}`;
  },

  load(caseId) {
    this.caseId = caseId;
    this.data = this.defaultData();
    let raw = localStorage.getItem(this.key());
    if (!raw) raw = localStorage.getItem(this.legacyKey());
    if (raw) {
      try { this.data = { ...this.data, ...JSON.parse(raw) }; } catch (_) {}
    }
    if (!this.data.startedAt) this.data.startedAt = new Date().toISOString();
    this.save();
    return this.data;
  },

  peek(caseId) {
    const raw = localStorage.getItem(this.key(caseId)) || localStorage.getItem(this.legacyKey(caseId));
    if (!raw) return null;
    try { return { ...this.defaultData(), ...JSON.parse(raw) }; } catch (_) { return null; }
  },

  save() {
    if (!this.caseId || !this.data) return;
    this.data.updatedAt = new Date().toISOString();
    localStorage.setItem(this.key(), JSON.stringify(this.data));
  },

  reset(caseId = this.caseId) {
    if (!caseId) return;
    localStorage.removeItem(this.key(caseId));
    localStorage.removeItem(this.legacyKey(caseId));
    if (caseId === this.caseId) this.data = this.defaultData();
  }
};
