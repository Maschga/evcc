import { describe, expect, test, vi } from "vite-plus/test";
import api from "@/api";
import { assignCircuit } from "./index";

vi.mock("@/api", () => ({ default: { get: vi.fn(), put: vi.fn() } }));

describe("assign circuit", () => {
  test("updates only the circuit without replaying stale live configuration", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { title: "stale" } });
    await assignCircuit(13, "db:12");
    expect(api.put).toHaveBeenCalledWith("config/loadpoints/13", { circuit: "db:12" });
    expect(api.get).not.toHaveBeenCalled();
  });
});
