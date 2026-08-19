class ReplayCache {
  constructor(ttlMs = 10 * 60 * 1000) {
    this.ttlMs = ttlMs;
    this.entries = new Map();
  }

  purge() {
    const now = Date.now();

    for (const [key, expiresAt] of this.entries) {
      if (expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  has(key) {
    this.purge();
    return this.entries.has(key);
  }

  add(key) {
    this.purge();

    if (!key) {
      throw new Error('Replay cache key is required');
    }

    if (this.entries.has(key)) {
      return false;
    }

    this.entries.set(key, Date.now() + this.ttlMs);
    return true;
  }
}

module.exports = ReplayCache;
