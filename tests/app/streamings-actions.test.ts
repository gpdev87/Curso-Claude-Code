import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const supabase = { from: vi.fn(() => ({ upsert })) };
const getCurrentUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabase,
  getCurrentUser: () => getCurrentUser(),
}));

import { saveStreamings } from "@/app/streamings-actions";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
  upsert.mockResolvedValue({ error: null });
});

describe("saveStreamings", () => {
  it("returns ok:false without a user and does not touch the database", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await saveStreamings(["netflix"])).toEqual({ ok: false });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("sanitizes ids and upserts for the user", async () => {
    expect(await saveStreamings(["netflix", "<script>", "p190"])).toEqual({ ok: true });
    expect(supabase.from).toHaveBeenCalledWith("user_settings");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", streamings: ["netflix", "p190"] }),
      { onConflict: "user_id" },
    );
  });

  it("returns ok:false on database error or throw", async () => {
    upsert.mockResolvedValue({ error: { message: "x" } });
    expect(await saveStreamings(["netflix"])).toEqual({ ok: false });
    upsert.mockRejectedValue(new Error("boom"));
    expect(await saveStreamings(["netflix"])).toEqual({ ok: false });
  });
});
