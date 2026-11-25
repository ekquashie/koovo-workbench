import { useQuery } from "@tanstack/react-query";
import { reviewerKeys } from "../query-keys";
import { extractResponseData } from "../utils";
import { getReviewers } from "./api-functions";

/** A fixed list on the API, so it never goes stale during a session. */
export const useReviewersQuery = () =>
  useQuery({
    queryKey: reviewerKeys.all,
    queryFn: ({ signal }) => getReviewers({ signal }).then(extractResponseData),
    staleTime: Infinity,
  });
