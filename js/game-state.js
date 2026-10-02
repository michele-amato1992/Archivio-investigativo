const GameState = {
  caseId: null,
  data: null,

  defaultData() {
    return {
      unlockedEvidence: [],
      examinedHotspots: [],
      notes: '',
      solved: false,
      startedAt: null,
      updatedAt: null
    };
  },

  key(caseId = this.caseId) {
    return `case-files-state-v2-${caseId}`;
  },

  load(caseId) {
    this.caseId = caseId;
    this.data = this.defaultData();
    const raw = localStorage.getItem(this.key());
    if (raw) {
      try { this.data = { ...this.data, ...JSON.parse(raw) }; } catch (_) {}
    }
    if (!this.data.startedAt) {
      this.data.startedAt = new Date().toISOString();
      this.save();
    }
    return this.data;
  },

  peek(caseId) {
    const raw = localStorage.getItem(this.key(caseId));
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
    if (caseId === this.caseId) this.data = this.defaultData();
  }
};
