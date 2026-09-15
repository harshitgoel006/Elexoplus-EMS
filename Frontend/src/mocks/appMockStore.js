/*
 * Single in-memory source of truth for the frontend-only EMS demo.
 *
 * Feature services seed a named collection once, then read and mutate it
 * through this module. No feature data is fetched from the API; only the
 * authentication service communicates with the backend.
 */
const copy = (value) => JSON.parse(JSON.stringify(value));

const state = new Map();
const listeners = new Set();

const notify = (key) => {
  listeners.forEach((listener) => listener(key));
};

export const mockStore = {
  get(key, seed) {
    if (!state.has(key)) state.set(key, copy(seed));
    return state.get(key);
  },

  snapshot(key, seed) {
    return copy(this.get(key, seed));
  },

  set(key, value) {
    state.set(key, copy(value));
    notify(key);
    return this.snapshot(key, value);
  },

  update(key, seed, updater) {
    const current = this.get(key, seed);
    const next = updater(current);
    state.set(key, next === undefined ? current : next);
    notify(key);
    return this.snapshot(key, seed);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  reset() {
    state.clear();
    notify("*");
  },
};

export const mockCopy = copy;

