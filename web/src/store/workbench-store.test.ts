import { beforeEach, describe, expect, it } from "vitest";
import { useWorkbenchStore } from "./workbench-store";

const state = () => useWorkbenchStore.getState();

describe("useWorkbenchStore", () => {
  beforeEach(() =>
    useWorkbenchStore.setState({ filters: {}, selectedId: null }),
  );

  it("treats an empty client or status as no filter", () => {
    state().setClient("C01");
    state().setStatus("VALID");
    state().setClient("");
    state().setStatus(undefined);
    expect(state().filters).toEqual({ clientId: undefined, status: undefined });
  });

  it("toggles a status on and off (summary cards), keeping the client", () => {
    state().setClient("C01");
    state().toggleStatus("EXCLUDED");
    expect(state().filters).toEqual({ clientId: "C01", status: "EXCLUDED" });
    state().toggleStatus("VALID");
    expect(state().filters.status).toBe("VALID");
    state().toggleStatus("VALID");
    expect(state().filters).toEqual({ clientId: "C01", status: undefined });
  });

  it("clears filters without closing the open record", () => {
    state().setClient("C02");
    state().select("id-R007");
    state().clearFilters();
    expect(state().filters).toEqual({});
    expect(state().selectedId).toBe("id-R007");
  });
});
