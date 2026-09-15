/*
 * Single in-memory source of truth for the frontend-only EMS demo.
 *
 * Feature services seed a named collection once, then read and mutate it
 * through this module. No feature data is fetched from the API; only the
 * authentication service communicates with the backend.
 */
const STORAGE_KEY = "elexoplus:frontend-mock-store:v1";
const copy = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

const state = new Map();
const listeners = new Set();

const storage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

const persist = () => {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(state)));
  } catch {
    // The demo remains usable if browser storage is disabled or full.
  }
};

const restore = () => {
  try {
    const saved = storage()?.getItem(STORAGE_KEY);
    const entries = saved ? JSON.parse(saved) : null;
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) return;
    Object.entries(entries).forEach(([key, value]) => state.set(key, value));
  } catch {
    storage()?.removeItem(STORAGE_KEY);
  }
};

restore();

const notify = (key) => {
  listeners.forEach((listener) => listener(key));
};

export const mockStore = {
  get(key, seed) {
    if (!state.has(key)) {
      state.set(key, copy(seed));
      persist();
    }
    return state.get(key);
  },

  snapshot(key, seed) {
    return copy(this.get(key, seed));
  },

  set(key, value) {
    state.set(key, copy(value));
    persist();
    notify(key);
    return this.snapshot(key, value);
  },

  update(key, seed, updater) {
    const current = this.get(key, seed);
    const next = updater(current);
    state.set(key, next === undefined ? current : next);
    persist();
    notify(key);
    return this.snapshot(key, seed);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  reset() {
    state.clear();
    storage()?.removeItem(STORAGE_KEY);
    notify("*");
  },
};

export const mockCopy = copy;
