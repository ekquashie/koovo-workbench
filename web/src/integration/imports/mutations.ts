import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importKeys, transactionKeys } from "../query-keys";
import type { CreateImportBody } from "../types";
import { extractResponseData } from "../utils";
import { createImport } from "./api-functions";

/**
 * An import re-validates the whole dataset, so any record, count or client
 * may have changed: refresh everything under transactions, plus the batches.
 */
export const useCreateImportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateImportBody) =>
      createImport(body).then(extractResponseData),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: importKeys.all }),
      ]),
  });
};
