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
