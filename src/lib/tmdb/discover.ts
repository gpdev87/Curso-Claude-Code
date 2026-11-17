import { REVALIDATE_LISTS, type TmdbParams, tmdbFetch, toMovieSummary } from "./client";
import type { CategoryOrder } from "@/lib/categories";
import type { MovieSummary } from "./types";

export type ShelfDef = {
  id: string;
  title: string;
  sort: string;
  genreId?: number;
  minVotes?: number;
  releasedUntilToday?: boolean;
  /** Link "Ver tudo ›" para a página de categoria. */
  seeAllHref?: string;
};

const genre = (id: string, title: string, genreId: number, categorySlug = id): ShelfDef => ({
  id,
  title,
  sort: "popularity.desc",
  genreId,
  seeAllHref: `/categoria/${categorySlug}`,
});

export const SHELVES: ShelfDef[] = [
  { id: "em-alta", title: "Top 10 em alta hoje", sort: "popularity.desc" },
  {
    id: "mais-avaliados",
    title: "Mais bem avaliados",
    sort: "vote_average.desc",
    minVotes: 300,
    seeAllHref: "/categoria/todas?ordem=nota",
  },
  {
    id: "recem-lancados",
    title: "Recém-lançados",
    sort: "primary_release_date.desc",
    releasedUntilToday: true,
    minVotes: 20,
  },
  genre("comedia", "Comédia", 35),
  genre("acao", "Ação", 28),
  genre("terror", "Terror", 27),
  genre("familia", "Família", 10751),
  genre("drama", "Drama", 18),
  genre("animacao", "Animação", 16),
  genre("romance", "Romance", 10749),
  genre("ficcao", "Ficção científica", 878, "ficcao-cientifica"),
];

const MAX_PAGES = 500;
const TOP_RATED_MIN_VOTES = 300;

function streamingParams(providerIds: number[]): TmdbParams {
  return {
    watch_region: "BR",
    with_watch_monetization_types: "flatrate",
    with_watch_providers: providerIds.length ? providerIds.join("|") : undefined,
  };
}

export function buildDiscoverParams(shelf: ShelfDef, providerIds: number[], today: string): TmdbParams {
  return {
    ...streamingParams(providerIds),
    sort_by: shelf.sort,
    with_genres: shelf.genreId,
    "vote_count.gte": shelf.minVotes,
    "primary_release_date.lte": shelf.releasedUntilToday ? today : undefined,
    page: 1,
  };
}

function todayInBrazil(): string {
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function getShelf(shelf: ShelfDef, providerIds: number[]): Promise<MovieSummary[]> {
  const data = await tmdbFetch<{ results: unknown[] }>(
    "/discover/movie",
    buildDiscoverParams(shelf, providerIds, todayInBrazil()),
    REVALIDATE_LISTS,
  );
  return data.results.map(toMovieSummary);
}

export async function getAllShelves(
  providerIds: number[],
): Promise<{ shelf: ShelfDef; movies: MovieSummary[] }[]> {
  const settled = await Promise.allSettled(SHELVES.map((shelf) => getShelf(shelf, providerIds)));
  const failures = settled.filter((r) => r.status === "rejected");
  if (failures.length === settled.length) throw (failures[0] as PromiseRejectedResult).reason;

  return settled.flatMap((result, i) =>
    result.status === "fulfilled" && result.value.length > 0 ? [{ shelf: SHELVES[i], movies: result.value }] : [],
  );
}

export function buildCategoryParams(
  genreId: number | null,
  order: CategoryOrder,
  providerIds: number[],
  page: number,
): TmdbParams {
  return {
    ...streamingParams(providerIds),
    with_genres: genreId ?? undefined,
    sort_by: order === "nota" ? "vote_average.desc" : "popularity.desc",
    "vote_count.gte": order === "nota" ? TOP_RATED_MIN_VOTES : undefined,
    page,
  };
}

export async function getCategoryPage(
  genreId: number | null,
  order: CategoryOrder,
  providerIds: number[],
  page: number,
): Promise<{ movies: MovieSummary[]; hasMore: boolean }> {
  const data = await tmdbFetch<{ results: unknown[]; total_pages: number }>(
    "/discover/movie",
    buildCategoryParams(genreId, order, providerIds, page),
    REVALIDATE_LISTS,
  );
  return {
    movies: data.results.map(toMovieSummary),
    hasMore: page < Math.min(data.total_pages ?? 0, MAX_PAGES),
  };
}
