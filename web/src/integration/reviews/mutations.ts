import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionKeys } from "../query-keys";
import type { CreateReviewBody } from "../types";
import { extractResponseData, isConflictError } from "../utils";
import { createReview } from "./api-functions";

export interface CreateReviewVariables {
  transactionId: string;
  reviewerId: string;
  body: CreateReviewBody;
}

/**
 * On success, refreshes the record, its history and every list (each row
 * shows review state). Counts are untouched: reviewing never changes
 * validation status. On 409 the record is refreshed too, so the screen shows
 * the decision that beat this one.
 */
export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();

  const refreshRecord = (transactionId: string) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(transactionId),
      }),
      queryClient.invalidateQueries({
        queryKey: transactionKeys.activity(transactionId),
      }),
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() }),
    ]);

  return useMutation({
    mutationFn: ({ transactionId, reviewerId, body }: CreateReviewVariables) =>
      createReview(transactionId, reviewerId, body).then(extractResponseData),
    onSuccess: (_result, { transactionId }) => refreshRecord(transactionId),
    onError: (error, { transactionId }) =>
      isConflictError(error) ? refreshRecord(transactionId) : undefined,
  });
};
