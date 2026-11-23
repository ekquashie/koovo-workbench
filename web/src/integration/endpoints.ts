/**
 * Paths relative to API_BASE_URL (/api/v1). Health is version-neutral on the
 * API, so it steps out of the versioned base.
 */
export const ENDPOINTS = {
  HEALTH: "../health",
} as const;

export const buildEndpoint = {} as const;
