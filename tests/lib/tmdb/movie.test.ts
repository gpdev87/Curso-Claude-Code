import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "../../fixtures/movie-872585.json";
import { annotateRecommendations, getMovieDetail, mapMovieDetail } from "@/lib/tmdb/movie";
import type { MovieSummary } from "@/lib/tmdb/types";

const clone = () => structuredClone(fixture) as Record<string, unknown>;

describe("mapMovieDetail", () => {
  it("maps BR subscription providers only", () => {
    const d = mapMovieDetail(fixture);
    expect(d.providers.map((p) => p.id)).toEqual([119, 1899]);
    expect(d.providers[0]).toEqual({ id: 119, name: "Amazon Prime Video", logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg" });
  });
  it("prefers the Portuguese YouTube trailer", () => {
    expect(mapMovieDetail(fixture).trailerUrl).toBe("https://www.youtube.com/watch?v=trailerPT");
  });
  it("falls back to any YouTube trailer", () => {
    const raw = clone();
    raw.videos = { results: [{ key: "trailerEN", site: "YouTube", type: "Trailer", iso_639_1: "en" }] };
    expect(mapMovieDetail(raw).trailerUrl).toBe("https://www.youtube.com/watch?v=trailerEN");
  });
  it("uses the first non-empty BR certification", () => {
    expect(mapMovieDetail(fixture).certification).toBe("16");
  });
  it("limits cast to 10 and recommendations to 20", () => {
    const d = mapMovieDetail(fixture);
    expect(d.cast).toHaveLength(10);
    expect(d.cast[2]).toEqual({ name: "Matt Damon", character: "Leslie Groves", profilePath: null });
    expect(d.recommendations.map((r) => r.id)).toEqual([157336, 27205]);
  });
  it("maps basic fields", () => {
    const d = mapMovieDetail(fixture);
    expect(d).toMatchObject({ id: 872585, title: "Oppenheimer", runtime: 180, genres: ["Drama", "História"] });
  });
  it("handles a movie with no BR data, videos, certification or overview", () => {
    const raw = clone();
    raw["watch/providers"] = { results: {} };
    raw.videos = { results: [] };
    raw.release_dates = { results: [] };
    raw.overview = "";
    raw.runtime = 0;
    const d = mapMovieDetail(raw);
    expect(d.providers).toEqual([]);
    expect(d.trailerUrl).toBeNull();
    expect(d.certification).toBeNull();
    expect(d.overview).toBe("Sinopse não disponível em português.");
    expect(d.runtime).toBe(0);
  });
});

describe("getMovieDetail", () => {
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

  it("requests appended data and maps it", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => fixture });
    const d = await getMovieDetail(872585);
    expect(d?.title).toBe("Oppenheimer");
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/3/movie/872585");
    expect(url.searchParams.get("append_to_response")).toBe(
      "watch/providers,videos,credits,release_dates,recommendations",
    );
    expect(url.searchParams.get("include_video_language")).toBe("pt-BR,en");
  });
  it("returns null on 404", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    expect(await getMovieDetail(999999999)).toBeNull();
  });
  it("rethrows other errors", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(getMovieDetail(1)).rejects.toMatchObject({ name: "TmdbError", status: 500 });
  });
});

describe("annotateRecommendations", () => {
  const m = (id: number): MovieSummary => ({ id, title: `M${id}`, posterPath: null, voteAverage: 7, releaseDate: null });
  const [a, b, c] = [m(1), m(2), m(3)];

  it("puts movies on my streamings first, keeping relative order", async () => {
    const lookup = vi.fn(async (id: number) => (id === 3 ? [8] : [337]));
    const result = await annotateRecommendations([a, b, c], [8], lookup);
    expect(result.map((r) => r.id)).toEqual([3, 1, 2]);
    expect(result.map((r) => r.onMyStreamings)).toEqual([true, false, false]);
  });
  it("skips lookups when no streamings are selected", async () => {
    const lookup = vi.fn();
    const result = await annotateRecommendations([a, b], [], lookup);
    expect(lookup).not.toHaveBeenCalled();
    expect(result.map((r) => [r.id, r.onMyStreamings])).toEqual([[1, false], [2, false]]);
  });
  it("treats a failed lookup as not on my streamings", async () => {
    const lookup = vi.fn(async (id: number) => {
      if (id === 2) throw new Error("boom");
      return [8];
    });
    const result = await annotateRecommendations([a, b], [8], lookup);
    expect(result.find((r) => r.id === 2)?.onMyStreamings).toBe(false);
    expect(result.find((r) => r.id === 1)?.onMyStreamings).toBe(true);
  });
});
