/* eslint-disable @typescript-eslint/no-explicit-any */
import { REVALIDATE_LISTS, TmdbError, tmdbFetch, toMovieSummary } from "./client";
import type { AnnotatedMovie, MovieDetail, MovieSummary, Provider } from "./types";

const NO_OVERVIEW = "Sinopse não disponível em português.";

function brFlatrate(watchProviders: any): any[] {
  return watchProviders?.results?.BR?.flatrate ?? [];
}

function pickTrailer(videos: any[]): string | null {
  const trailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const chosen = trailers.find((v) => v.iso_639_1 === "pt") ?? trailers[0];
  return chosen ? `https://www.youtube.com/watch?v=${chosen.key}` : null;
}

function brCertification(releaseDates: any[]): string | null {
  const br = releaseDates.find((r) => r.iso_3166_1 === "BR");
  const found = (br?.release_dates ?? []).find((d: any) => d.certification);
  return found ? found.certification : null;
}

export function mapMovieDetail(raw: any): MovieDetail {
  const providers: Provider[] = brFlatrate(raw["watch/providers"]).map((p) => ({
    id: p.provider_id,
    name: p.provider_name,
    logoPath: p.logo_path ?? null,
  }));

  return {
    ...toMovieSummary(raw),
    overview: raw.overview?.trim() ? raw.overview : NO_OVERVIEW,
    backdropPath: raw.backdrop_path ?? null,
    runtime: raw.runtime ?? null,
    genres: (raw.genres ?? []).map((g: any) => g.name),
    certification: brCertification(raw.release_dates?.results ?? []),
    providers,
    trailerUrl: pickTrailer(raw.videos?.results ?? []),
    cast: (raw.credits?.cast ?? []).slice(0, 10).map((c: any) => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ?? null,
    })),
    recommendations: (raw.recommendations?.results ?? []).slice(0, 20).map(toMovieSummary),
  };
}

export async function getMovieDetail(id: number): Promise<MovieDetail | null> {
  try {
    const raw = await tmdbFetch<any>(
      `/movie/${id}`,
      {
        append_to_response: "watch/providers,videos,credits,release_dates,recommendations",
        include_video_language: "pt-BR,en",
      },
      REVALIDATE_LISTS,
    );
    return mapMovieDetail(raw);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}

export async function getMovieProviderIds(id: number): Promise<number[]> {
  const data = await tmdbFetch<any>(`/movie/${id}/watch/providers`, {}, REVALIDATE_LISTS);
  return brFlatrate(data).map((p) => p.provider_id);
}

export async function annotateRecommendations(
  recs: MovieSummary[],
  myProviderIds: number[],
  lookup: (id: number) => Promise<number[]> = getMovieProviderIds,
): Promise<AnnotatedMovie[]> {
  if (myProviderIds.length === 0) return recs.map((r) => ({ ...r, onMyStreamings: false }));

  const mine = new Set(myProviderIds);
  const annotated = await Promise.all(
    recs.map(async (r) => {
      const ids = await lookup(r.id).catch(() => [] as number[]);
      return { ...r, onMyStreamings: ids.some((id) => mine.has(id)) };
    }),
  );
  return [...annotated.filter((r) => r.onMyStreamings), ...annotated.filter((r) => !r.onMyStreamings)];
}
