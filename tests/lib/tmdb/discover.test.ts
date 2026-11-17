import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SHELVES, buildDiscoverParams, getAllShelves } from "@/lib/tmdb/discover";

const shelf = (id: string) => SHELVES.find((s) => s.id === id)!;

describe("SHELVES", () => {
  it("has the spec order", () => {
    expect(SHELVES.map((s) => s.id)).toEqual([
      "em-alta", "mais-avaliados", "recem-lancados",
      "comedia", "acao", "terror", "familia", "drama", "animacao", "romance", "ficcao",
    ]);
  });
});

describe("buildDiscoverParams", () => {
  it("filters by BR subscription streaming and selected providers", () => {
    const p = buildDiscoverParams(shelf("em-alta"), [8, 1899], "2026-11-17");
    expect(p.with_watch_providers).toBe("8|1899");
    expect(p.watch_region).toBe("BR");
    expect(p.with_watch_monetization_types).toBe("flatrate");
    expect(p.sort_by).toBe("popularity.desc");
  });
  it("omits the provider filter when nothing is selected", () => {
    expect(buildDiscoverParams(shelf("em-alta"), [], "2026-11-17").with_watch_providers).toBeUndefined();
  });
  it("requires 300 votes for top rated", () => {
    expect(buildDiscoverParams(shelf("mais-avaliados"), [], "2026-11-17")["vote_count.gte"]).toBe(300);
  });
  it("limits recent releases to today", () => {
    expect(buildDiscoverParams(shelf("recem-lancados"), [], "2026-11-17")["primary_release_date.lte"]).toBe(
      "2026-11-17",
    );
  });
  it("filters genre shelves", () => {
    expect(buildDiscoverParams(shelf("terror"), [], "2026-11-17").with_genres).toBe(27);
  });
});

describe("getAllShelves", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "tok");
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const movie = { id: 1, title: "X", poster_path: "/x.jpg", vote_average: 7, release_date: "2024-01-01" };
  const ok = (results: unknown[]) => ({ ok: true, status: 200, json: async () => ({ results }) });

  it("drops shelves with no movies", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      new URL(url).searchParams.get("with_genres") === "27" ? ok([]) : ok([movie]),
    );
    const shelves = await getAllShelves([8]);
    expect(shelves.map((s) => s.shelf.id)).not.toContain("terror");
    expect(shelves.length).toBe(SHELVES.length - 1);
  });

  it("omits a failing shelf but keeps the others", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      new URL(url).searchParams.get("with_genres") === "35" ? { ok: false, status: 500 } : ok([movie]),
    );
    const shelves = await getAllShelves([]);
    expect(shelves.map((s) => s.shelf.id)).not.toContain("comedia");
    expect(shelves.length).toBe(SHELVES.length - 1);
  });

  it("rejects when every shelf fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    await expect(getAllShelves([])).rejects.toMatchObject({ name: "TmdbError", status: 401 });
  });
});
