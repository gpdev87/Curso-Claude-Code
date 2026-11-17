/* eslint-disable @typescript-eslint/no-explicit-any */
import { curatedProviderIds } from "@/lib/streamings";
import { REVALIDATE_LISTS, REVALIDATE_STATIC, tmdbFetch, toMovieSummary } from "./client";
import type { MovieSummary, Provider } from "./types";

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await tmdbFetch<{ results: unknown[] }>(
    "/search/movie",
    { query: q, region: "BR", include_adult: "false", page: 1 },
    REVALIDATE_LISTS,
  );
  return data.results.map(toMovieSummary);
}

export async function getOtherBrProviders(): Promise<Provider[]> {
  const data = await tmdbFetch<{ results: any[] }>("/watch/providers/movie", { watch_region: "BR" }, REVALIDATE_STATIC);
  const curated = curatedProviderIds();
  const priority = (p: any) => p.display_priorities?.BR ?? p.display_priority ?? 999;
  return data.results
    .filter((p) => !curated.has(p.provider_id))
    .sort((a, b) => priority(a) - priority(b))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null }));
}
