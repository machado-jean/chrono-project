import "@testing-library/jest-dom/vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect } from "vitest";

expect.extend(matchers);

class MemoryStorage implements Storage {
  #values = new Map<string, string>();

  get length(): number { return this.#values.size; }
  clear(): void { this.#values.clear(); }
  getItem(key: string): string | null { return this.#values.get(key) ?? null; }
  key(index: number): string | null { return [...this.#values.keys()][index] ?? null; }
  removeItem(key: string): void { this.#values.delete(key); }
  setItem(key: string, value: string): void { this.#values.set(key, value); }
}

// Node 25 may expose an unavailable global localStorage to jsdom. The desktop
// application uses WebView2 storage; tests use this equivalent in-memory store.
Object.defineProperty(window, "localStorage", { configurable: true, value: new MemoryStorage() });

beforeEach(() => {
  // Existing UI tests describe the Brazilian Portuguese baseline explicitly.
  window.localStorage.setItem("chrono-project.language", "pt-BR");
});

afterEach(() => {
  cleanup();
});
