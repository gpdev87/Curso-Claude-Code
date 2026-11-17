import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TmdbError, tmdbFetch, toMovieSummary } from "@/lib/tmdb/client";

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

describe("tmdbFetch", () => {
  it("sends language, params, bearer token and revalidate", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ a: 1 }) });

    const result = await tmdbFetch<{ a: number }>("/discover/movie", { page: 2, x: undefined }, 60);

    expect(result).toEqual({ a: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://api.themoviedb.org/3/discover/movie");
    expect(parsed.searchParams.get("language")).toBe("pt-BR");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.has("x")).toBe(false);
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.next.revalidate).toBe(60);
  });

  it("throws TmdbError with the HTTP status on non-ok responses", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    await expect(tmdbFetch("/x", {}, 60)).rejects.toMatchObject({
      name: "TmdbError",
      status: 401,
    });
  });

  it("throws TmdbError status 0 without calling fetch when the token is missing", async () => {
    vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "");

    const error = (await tmdbFetch("/x", {}, 60).catch((e: unknown) => e)) as TmdbError;

    expect(error).toBeInstanceOf(TmdbError);
    expect(error.status).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws TmdbError status 0 on network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = (await tmdbFetch("/x", {}, 60).catch((e: unknown) => e)) as TmdbError;

    expect(error).toBeInstanceOf(TmdbError);
    expect(error.status).toBe(0);
  });
});

describe("toMovieSummary", () => {
  it("maps raw TMDB results and turns empty dates into null", () => {
    expect(
      toMovieSummary({ id: 1, title: "X", poster_path: null, vote_average: 7.5, release_date: "" }),
    ).toEqual({ id: 1, title: "X", posterPath: null, voteAverage: 7.5, releaseDate: null });
  });
});
