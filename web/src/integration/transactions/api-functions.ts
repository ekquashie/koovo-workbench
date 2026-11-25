import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "../client";
import { buildEndpoint, ENDPOINTS } from "../endpoints";
import type {
  ApiResponse,
  ReviewActivity,
  TransactionDetail,
  TransactionFilters,
  TransactionListItem,
  TransactionSummary,
} from "../types";

/** Empty filters are dropped, so `?clientId=` is never sent. */
const filterParams = (filters: TransactionFilters) => ({
  clientId: filters.clientId || undefined,
  status: filters.status || undefined,
});

export const getTransactions = (
  filters: TransactionFilters = {},
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<TransactionListItem[]>>> =>
  apiClient.get<ApiResponse<TransactionListItem[]>>(ENDPOINTS.TRANSACTIONS, {
    ...config,
    params: filterParams(filters),
  });

export const getTransactionSummary = (
  clientId?: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<TransactionSummary>>> =>
  apiClient.get<ApiResponse<TransactionSummary>>(
    ENDPOINTS.TRANSACTIONS_SUMMARY,
    {
      ...config,
      params: { clientId: clientId || undefined },
    },
  );

export const getTransaction = (
  id: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<TransactionDetail>>> =>
  apiClient.get<ApiResponse<TransactionDetail>>(
    buildEndpoint.transaction(id),
    config,
  );

export const getTransactionActivity = (
  id: string,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<ApiResponse<ReviewActivity[]>>> =>
  apiClient.get<ApiResponse<ReviewActivity[]>>(
    buildEndpoint.transactionActivity(id),
    config,
  );
