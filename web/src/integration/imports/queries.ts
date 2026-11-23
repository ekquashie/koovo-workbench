import { useQuery } from "@tanstack/react-query";
import { importKeys } from "../query-keys";
import { extractResponseData } from "../utils";
import { getImports } from "./api-functions";

export const useImportsQuery = () =>
  useQuery({
    queryKey: importKeys.all,
    queryFn: ({ signal }) => getImports({ signal }).then(extractResponseData),
  });
