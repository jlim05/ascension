import "@testing-library/jest-dom";
import { beforeEach } from "vitest";

// Node 25 ships a native global `localStorage` whose methods are unusable
// unless the process was started with a valid --localstorage-file, and it
// shadows the working jsdom implementation. Zustand's persist middleware
// (authStore, themeStore) calls setItem on it and throws, so install a plain
// in-memory store over it for the duration of the test run.
const entries = new Map<string, string>();

const memoryStorage = {
  get length() {
    return entries.size;
  },
  key: (index: number) => [...entries.keys()][index] ?? null,
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => {
    entries.set(key, String(value));
  },
  removeItem: (key: string) => {
    entries.delete(key);
  },
  clear: () => {
    entries.clear();
  },
} as unknown as Storage;

for (const target of [globalThis, window]) {
  Object.defineProperty(target, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
}

// Keep persisted state from leaking between tests.
beforeEach(() => {
  memoryStorage.clear();
});
