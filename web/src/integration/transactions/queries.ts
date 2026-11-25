import { useQuery } from "@tanstack/react-query";
import { transactionKeys } from "../query-keys";
import type { TransactionFilters } from "../types";
import { extractResponseData } from "../utils";
import {
  getTransaction,
  getTransactionActivity,
  getTransactions,
  getTransactionSummary,
} from "./api-functions";

/** Keeps the previous rows on screen while a new filter loads (no flash). */
export const useTransactionsQuery = (filters: TransactionFilters) =>
  useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: ({ signal }) =>
      getTransactions(filters, { signal }).then(extractResponseData),
    // Same as keepPreviousData, written inline so TS infers the data type.
    placeholderData: (previous) => previous,
  });

export const useTransactionSummaryQuery = (clientId?: string) =>
  useQuery({
    queryKey: transactionKeys.summary(clientId),
    queryFn: ({ signal }) =>
      getTransactionSummary(clientId, { signal }).then(extractResponseData),
    // Same as keepPreviousData, written inline so TS infers the data type.
    placeholderData: (previous) => previous,
  });

/** Idle until a record is selected. */
export const useTransactionQuery = (id: string | null | undefined) =>
  useQuery({
    queryKey: transactionKeys.detail(id ?? ""),
    queryFn: ({ signal }) =>
      getTransaction(id!, { signal }).then(extractResponseData),
    enabled: Boolean(id),
  });

export const useTransactionActivityQuery = (id: string | null | undefined) =>
  useQuery({
    queryKey: transactionKeys.activity(id ?? ""),
    queryFn: ({ signal }) =>
      getTransactionActivity(id!, { signal }).then(extractResponseData),
    enabled: Boolean(id),
  });
