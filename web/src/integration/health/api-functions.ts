import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { ApiResponse, HealthStatus } from "../types";

export const getHealth = (
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<HealthStatus>>> =>
  apiClient.get(ENDPOINTS.HEALTH, config);
