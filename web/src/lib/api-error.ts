export const GENERIC_SERVER_ERROR_MESSAGE =
  "Something went wrong on our side. Please try again later.";

/** Treat every HTTP 5xx response as an internal server failure. */
export function isServerErrorStatus(status: unknown): status is number {
  return typeof status === "number" && status >= 500 && status < 600;
}
