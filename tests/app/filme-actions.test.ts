import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const eqMovie = vi.fn();
const eqUser = vi.fn(() => ({ eq: eqMovie }));
const del = vi.fn(() => ({ eq: eqUser }));
const supabase = { from: vi.fn(() => ({ upsert, delete: del })) };
const getCurrentUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabase,
  getCurrentUser: () => getCurrentUser(),
}));

import { setMark } from "@/app/filme/actions";

const movie = { movieId: 7, title: "Filme", posterPath: "/p.jpg" };

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
  upsert.mockResolvedValue({ error: null });
  eqMovie.mockResolvedValue({ error: null });
});

describe("setMark", () => {
  it("rejects invalid input without touching the database", async () => {
    expect(await setMark({ ...movie, movieId: -1 }, "quero")).toEqual({ ok: false, reason: "invalid" });
    expect(await setMark(movie, "outro" as never)).toEqual({ ok: false, reason: "invalid" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("requires a user", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await setMark(movie, "quero")).toEqual({ ok: false, reason: "auth" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("upserts the mark for the user", async () => {
    expect(await setMark(movie, "visto")).toEqual({ ok: true });
    expect(supabase.from).toHaveBeenCalledWith("movie_marks");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", movie_id: 7, status: "visto", title: "Filme", poster_path: "/p.jpg" }),
      { onConflict: "user_id,movie_id" },
    );
  });

  it("deletes filtered by movie_id when status is null", async () => {
    expect(await setMark(movie, null)).toEqual({ ok: true });
    expect(eqUser).toHaveBeenCalledWith("user_id", "u1");
    expect(eqMovie).toHaveBeenCalledWith("movie_id", 7);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("maps database errors", async () => {
    upsert.mockResolvedValue({ error: { message: "x" } });
    expect(await setMark(movie, "quero")).toEqual({ ok: false, reason: "error" });
  });
});
