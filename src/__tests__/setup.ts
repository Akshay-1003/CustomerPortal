import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom has no layout observer; Radix uses it for hidden form input sizing.
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
