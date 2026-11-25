import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  CreateImportBody,
  ImportBatch,
  ImportResult,
} from "../types";

export const getImports = (
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<ImportBatch[]>>> =>
  apiClient.get<ApiResponse<ImportBatch[]>>(ENDPOINTS.IMPORTS, config);

export const createImport = (
  body: CreateImportBody,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<ImportResult>>> =>
  apiClient.post<ApiResponse<ImportResult>>(ENDPOINTS.IMPORTS, body, config);
