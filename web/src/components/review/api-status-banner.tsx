import { getErrorStatus, useHealthQuery } from "@/integration";
import { API_BASE_URL } from "@/lib/config";

/** Explains the most likely local-dev failure: the API isn't running. */
export const ApiStatusBanner = () => {
  const { isError, error } = useHealthQuery();
  if (!isError || getErrorStatus(error) !== undefined) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      Can't reach the API at <code>{API_BASE_URL}</code>. Start it with{" "}
      <code>cd api &amp;&amp; pnpm start:dev</code>, then reload.
    </div>
  );
};
