import type { MovieSummary } from "./types";

const BASE_URL = "https://api.themoviedb.org/3";

export const REVALIDATE_LISTS = 21600; // 6h
export const REVALIDATE_STATIC = 86400; // 24h

export class TmdbError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

export type TmdbParams = Record<string, string | number | undefined>;

export async function tmdbFetch<T>(path: string, params: TmdbParams, revalidate: number): Promise<T> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) throw new TmdbError("TMDB_READ_ACCESS_TOKEN não configurado", 0);

  const url = new URL(BASE_URL + path);
  url.searchParams.set("language", "pt-BR");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate },
    } as RequestInit);
  } catch (error) {
    throw new TmdbError(`Falha de rede ao chamar o TMDB: ${String(error)}`, 0);
  }

  if (!response.ok) throw new TmdbError(`TMDB respondeu ${response.status} para ${path}`, response.status);
  return (await response.json()) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toMovieSummary(raw: any): MovieSummary {
  return {
    id: raw.id,
    title: raw.title,
    posterPath: raw.poster_path ?? null,
    voteAverage: raw.vote_average ?? 0,
    releaseDate: raw.release_date || null,
  };
}
