import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SHELVES, buildCategoryParams, buildDiscoverParams, getAllShelves, getCategoryPage } from "@/lib/tmdb/discover";

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

describe("seeAllHref", () => {
  it("links genre shelves and top rated to category pages", () => {
    expect(shelf("terror").seeAllHref).toBe("/categoria/terror");
    expect(shelf("ficcao").seeAllHref).toBe("/categoria/ficcao-cientifica");
    expect(shelf("mais-avaliados").seeAllHref).toBe("/categoria/todas?ordem=nota");
    expect(shelf("em-alta").seeAllHref).toBeUndefined();
  });
});

describe("buildCategoryParams", () => {
  it("sorts by rating with a 300-vote minimum", () => {
    const p = buildCategoryParams(27, "nota", [8], 3);
    expect(p).toMatchObject({
      with_genres: 27,
      sort_by: "vote_average.desc",
      "vote_count.gte": 300,
      page: 3,
      with_watch_providers: "8",
      watch_region: "BR",
      with_watch_monetization_types: "flatrate",
    });
  });
  it("sorts by popularity without genre or provider filters", () => {
    const p = buildCategoryParams(null, "alta", [], 1);
    expect(p.with_genres).toBeUndefined();
    expect(p.with_watch_providers).toBeUndefined();
    expect(p["vote_count.gte"]).toBeUndefined();
    expect(p.sort_by).toBe("popularity.desc");
  });
});

describe("getCategoryPage", () => {
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
  const respond = (total_pages: number) =>
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{ id: 1, title: "X", poster_path: null, vote_average: 7, release_date: "" }],
        total_pages,
      }),
    });

  it("reports more pages until the last one", async () => {
    respond(3);
    expect((await getCategoryPage(27, "alta", [], 2)).hasMore).toBe(true);
    const last = await getCategoryPage(27, "alta", [], 3);
    expect(last.hasMore).toBe(false);
    expect(last.movies.map((m) => m.id)).toEqual([1]);
  });
  it("caps at TMDB's 500-page limit", async () => {
    respond(900);
    expect((await getCategoryPage(null, "nota", [], 500)).hasMore).toBe(false);
  });
});
