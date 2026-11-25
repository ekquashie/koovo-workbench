import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library can't register this itself.
afterEach(cleanup);
// Filters are mirrored in the URL; start every test at a clean address.
afterEach(() => window.history.replaceState(null, "", "/"));
