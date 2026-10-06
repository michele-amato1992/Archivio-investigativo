const GameState = {
  caseId: null,
  data: null,

  defaultData() {
    return {
      unlockedEvidence: [],
      seenEvidence: [],
      examinedHotspots: [],
      askedTopics: [],
      evidenceActions: [],
      notes: '',
      noteBoard: {
        theories: '',
        contradictions: '',
        questions: '',
        motive: '',
        suspectStatuses: {}
      },
      solved: false,
      onboardingSeen: false,
      startedAt: null,
      updatedAt: null
    };
  },

  key(caseId = this.caseId) {
    return `case-files-state-v5-${caseId}`;
  },

  onboardingKey(caseId = this.caseId) {
    return `case-files-onboarding-v1-${caseId}`;
  },

  hasSeenOnboarding(caseId = this.caseId) {
    if (!caseId) return false;
    if (localStorage.getItem(this.onboardingKey(caseId)) === '1') return true;
    return !!(caseId === this.caseId && this.data?.onboardingSeen);
  },

  markOnboardingSeen(caseId = this.caseId) {
    if (!caseId) return;
    localStorage.setItem(this.onboardingKey(caseId), '1');
    if (caseId === this.caseId && this.data) {
      this.data.onboardingSeen = true;
      this.save();
    }
  },

  legacyKeys(caseId = this.caseId) {
    return [`case-files-state-v4-${caseId}`, `case-files-state-v3-${caseId}`, `case-files-state-v2-${caseId}`];
  },

  load(caseId) {
    this.caseId = caseId;
    this.data = this.defaultData();
    let raw = localStorage.getItem(this.key());
    if (!raw) {
      for (const key of this.legacyKeys()) {
        raw = localStorage.getItem(key);
        if (raw) break;
      }
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          noteBoard: { ...this.data.noteBoard, ...(parsed.noteBoard || {}) }
        };
      } catch (_) {}
    }
    if (!this.data.startedAt) this.data.startedAt = new Date().toISOString();
    this.save();
    return this.data;
  },

  peek(caseId) {
    let raw = localStorage.getItem(this.key(caseId));
    if (!raw) {
      for (const key of this.legacyKeys(caseId)) {
        raw = localStorage.getItem(key);
        if (raw) break;
      }
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const defaults = this.defaultData();
      return { ...defaults, ...parsed, noteBoard: { ...defaults.noteBoard, ...(parsed.noteBoard || {}) } };
    } catch (_) { return null; }
  },

  save() {
    if (!this.caseId || !this.data) return;
    this.data.updatedAt = new Date().toISOString();
    localStorage.setItem(this.key(), JSON.stringify(this.data));
  },

  reset(caseId = this.caseId) {
    if (!caseId) return;
    localStorage.removeItem(this.key(caseId));
    localStorage.removeItem(this.onboardingKey(caseId));
    this.legacyKeys(caseId).forEach(key => localStorage.removeItem(key));
    if (caseId === this.caseId) this.data = this.defaultData();
  }
};
