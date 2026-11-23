import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "../client";
import { buildEndpoint } from "../endpoints";
import type { ApiResponse, CreateReviewBody, ReviewResult } from "../types";

/** Header the API's ReviewerGuard reads (mock identity). */
export const REVIEWER_HEADER = "X-Reviewer-Id";

/**
 * The reviewer is passed per call rather than set globally on the client:
 * only this request needs it, and the selected reviewer is UI state.
 */
export const createReview = (
  transactionId: string,
  reviewerId: string,
  body: CreateReviewBody,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<ReviewResult>>> =>
  apiClient.post<ApiResponse<ReviewResult>>(
    buildEndpoint.transactionReviews(transactionId),
    body,
    {
      ...config,
      headers: { ...config?.headers, [REVIEWER_HEADER]: reviewerId },
    },
  );
