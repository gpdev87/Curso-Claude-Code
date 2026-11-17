import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOtherBrProviders, searchMovies } from "@/lib/tmdb/search";

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

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("searchMovies", () => {
  it("returns empty for blank queries without calling TMDB", async () => {
    expect(await searchMovies("   ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("searches BR without adult titles", async () => {
    fetchMock.mockResolvedValue(
      ok({ results: [{ id: 1, title: "Duna", poster_path: null, vote_average: 7, release_date: "2021-10-21" }] }),
    );
    const results = await searchMovies(" duna ");
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/3/search/movie");
    expect(url.searchParams.get("query")).toBe("duna");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(url.searchParams.get("region")).toBe("BR");
    expect(results.map((r) => r.title)).toEqual(["Duna"]);
  });
});

describe("getOtherBrProviders", () => {
  it("excludes curated services and sorts by BR priority", async () => {
    fetchMock.mockResolvedValue(
      ok({
        results: [
          { provider_id: 300, provider_name: "Pluto", logo_path: "/b.jpg", display_priority: 9, display_priorities: { BR: 9 } },
          { provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg", display_priority: 1, display_priorities: { BR: 1 } },
          { provider_id: 190, provider_name: "Curiosity", logo_path: "/a.jpg", display_priority: 5, display_priorities: { BR: 3 } },
        ],
      }),
    );
    const providers = await getOtherBrProviders();
    expect(providers).toEqual([
      { id: 190, name: "Curiosity", logoPath: "/a.jpg" },
      { id: 300, name: "Pluto", logoPath: "/b.jpg" },
    ]);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("watch_region")).toBe("BR");
  });
});
