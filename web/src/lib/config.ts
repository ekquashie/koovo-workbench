/** Versioned API base URL; falls back to the local NestJS dev server. */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
