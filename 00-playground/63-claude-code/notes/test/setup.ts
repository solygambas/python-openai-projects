import "@testing-library/jest-dom";

// Basic global mocks to reduce act warnings in tests
if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = async () => ({
    ok: true,
    json: async () => ({}),
  });
}

if (!(globalThis as any).navigator) {
  (globalThis as any).navigator = { clipboard: { writeText: async () => {} } };
}

if (!globalThis.location) {
  (globalThis as any).location = {
    origin: "http://localhost",
    reload: () => {},
  };
}
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Basic globals/mocks for browser APIs used across tests
if (!globalThis.fetch) {
  // simple fetch mock stubbed per-test when needed
  globalThis.fetch = vi.fn();
}

// clipboard mock
if (!globalThis.navigator) {
  // @ts-ignore - add navigator when missing
  (globalThis as any).navigator = {};
}
if (!globalThis.navigator.clipboard) {
  // @ts-ignore
  globalThis.navigator.clipboard = { writeText: vi.fn() };
}

// location.reload stub
if (!globalThis.location) {
  (globalThis as any).location = { reload: vi.fn() };
} else if (!globalThis.location.reload) {
  // @ts-ignore
  globalThis.location.reload = vi.fn();
}
