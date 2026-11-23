/** Envelope every API response is wrapped in by the NestJS ResponseInterceptor. */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  /** Present on 400s from FieldValidationException: field -> message. */
  errors?: Record<string, string>;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: "ok";
}
