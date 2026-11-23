import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./utils";
import { GENERIC_SERVER_ERROR_MESSAGE } from "@/lib/api-error";

const axiosError = (status: number, message: string) =>
  new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code: status, message, data: null },
  });

describe("getErrorMessage", () => {
  it("shows the API's message for 4xx responses", () => {
    expect(getErrorMessage(axiosError(400, "Note is required"))).toBe(
      "Note is required",
    );
  });

  it("hides server details for 5xx responses", () => {
    expect(getErrorMessage(axiosError(500, "db exploded"))).toBe(
      GENERIC_SERVER_ERROR_MESSAGE,
    );
  });
});
