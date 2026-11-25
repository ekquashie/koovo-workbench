import { AxiosError, type AxiosResponse } from "axios";
import type { ApiResponse } from "./types";
import {
  GENERIC_SERVER_ERROR_MESSAGE,
  isServerErrorStatus,
} from "@/lib/api-error";

/** Unwraps { code, message, data } to just data. */
export function extractResponseData<T>(
  response: AxiosResponse<ApiResponse<T>>,
): T {
  return response.data.data;
}

/** A message safe to show the user; 5xx details are never surfaced. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (isServerErrorStatus(error.response?.status)) {
      return GENERIC_SERVER_ERROR_MESSAGE;
    }
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    return data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

/** HTTP status of a failed request, or undefined for network errors. */
export function getErrorStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

/**
 * Per-field messages from a 400, keyed as the API sends them ("note",
 * "records.3.total"), for react-hook-form's setError. Undefined otherwise.
 */
export function getFieldErrors(
  error: unknown,
): Record<string, string> | undefined {
  if (getErrorStatus(error) !== 400) return undefined;
  const data = (error as AxiosError<ApiResponse<unknown>>).response?.data;
  return data?.errors;
}

/** 409: someone else changed the review; the screen must reload. */
export const isConflictError = (error: unknown): boolean =>
  getErrorStatus(error) === 409;
