import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { ApiResponse, Reviewer } from "../types";

export const getReviewers = (
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<Reviewer[]>>> =>
  apiClient.get<ApiResponse<Reviewer[]>>(ENDPOINTS.REVIEWERS, config);
