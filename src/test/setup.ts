import React, { useEffect, useState, type ComponentType } from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

/** En tests, `next/dynamic` resuelve el import en `useEffect` (como en cliente). */
vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
  ) => {
    function DynamicInTest(props: Record<string, unknown>) {
      const [Resolved, setResolved] =
        useState<ComponentType<Record<string, unknown>> | null>(null);

      useEffect(() => {
        let active = true;
        void loader().then((mod) => {
          if (active) {
            setResolved(() => mod.default);
          }
        });
        return () => {
          active = false;
        };
      }, []);

      if (!Resolved) {
        return null;
      }
      return React.createElement(Resolved, props);
    }
    return DynamicInTest;
  },
}));

/**
 * Node 25+ expone `globalThis.localStorage` nativo que queda `undefined`
 * sin `--localstorage-file`, y pisa el de jsdom en tests que usan el global.
 */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
  };
}

Object.defineProperty(globalThis, "localStorage", {
  value: createMemoryStorage(),
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: createMemoryStorage(),
  configurable: true,
  writable: true,
});
