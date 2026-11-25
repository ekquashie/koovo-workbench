import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";

/** A resolved axios response wrapped in the API envelope. */
export function ok<T>(data: T, code = 200): AxiosResponse {
  return {
    data: { code, message: "Success", data },
    status: code,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
}

/** A rejected axios error carrying the API's error envelope. */
export function apiError(
  status: number,
  message: string,
  errors?: Record<string, string>,
): AxiosError {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code: status, message, data: null, ...(errors ? { errors } : {}) },
  });
}
