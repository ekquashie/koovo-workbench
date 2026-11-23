import { useQuery } from "@tanstack/react-query";
import { getHealth } from "./api-functions";
import { extractResponseData } from "../utils";

export const useHealthQuery = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: () => getHealth().then(extractResponseData),
  });
