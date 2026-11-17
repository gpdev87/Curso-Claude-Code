/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MarkButtons } from "@/components/MarkButtons";
import { ProviderList } from "@/components/ProviderList";
import { ShareButton } from "@/components/ShareButton";
import { Shelf } from "@/components/Shelf";
import { formatRuntime, imageUrl, movieSlug, parseMovieSlug, releaseYear } from "@/lib/format";
import { getMarkStatus } from "@/lib/marks";
import { siteUrl } from "@/lib/site";
import { COOKIE_NAME, parseMyStreamings, providerIdsFor } from "@/lib/streamings";
import { getCurrentUser } from "@/lib/supabase/server";
import { annotateRecommendations, getMovieDetail } from "@/lib/tmdb/movie";

const loadMovie = cache(async (slug: string) => {
  const id = parseMovieSlug(slug);
  return id ? getMovieDetail(id) : null;
});

export async function generateMetadata({ params }: PageProps<"/filme/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const movie = await loadMovie(slug);
  if (!movie) return { title: "Filme não encontrado" };

  const year = releaseYear(movie.releaseDate);
  const title = year ? `${movie.title} (${year})` : movie.title;
  const description = movie.overview.length > 160 ? `${movie.overview.slice(0, 157)}…` : movie.overview;
  const poster = imageUrl(movie.posterPath, "w780");
  return {
    title,
    description,
    alternates: { canonical: `/filme/${movieSlug(movie.id, movie.title)}` },
    openGraph: { title, description, type: "video.movie", images: poster ? [poster] : [] },
  };
}

export default async function MoviePage({ params }: PageProps<"/filme/[slug]">) {
  const { slug } = await params;
  const movie = await loadMovie(slug);
  if (!movie) notFound();

  const cookieStore = await cookies();
  const myProviderIds = providerIdsFor(parseMyStreamings(cookieStore.get(COOKIE_NAME)?.value));
  const [recommendations, user, markStatus] = await Promise.all([
    annotateRecommendations(movie.recommendations, myProviderIds),
    getCurrentUser(),
    getMarkStatus(movie.id),
  ]);

  const backdrop = imageUrl(movie.backdropPath, "w1280") ?? imageUrl(movie.posterPath, "w780");
  const poster = imageUrl(movie.posterPath, "w342");
  const meta = [
    releaseYear(movie.releaseDate),
    formatRuntime(movie.runtime),
    movie.certification ? `Classificação ${movie.certification}` : null,
  ].filter(Boolean);
  const loginHref = "/entrar?next=" + encodeURIComponent("/filme/" + slug);
  const shareUrl = `${siteUrl()}/filme/${movieSlug(movie.id, movie.title)}`;

  return (
    <article>
      <div className="relative isolate overflow-hidden">
        {backdrop && (
          <img src={backdrop} alt="" className="hero-backdrop absolute inset-0 -z-20 h-full w-full object-cover object-top opacity-60" />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-sala via-sala/80 to-sala/10" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-sala to-transparent" />

        <div className="flex gap-8 px-4 pb-10 pt-28 md:px-12 md:pb-14 md:pt-36">
          {poster && (
            <img
              src={poster}
              alt=""
              className="hidden w-56 shrink-0 self-start rounded-lg shadow-2xl shadow-black/60 md:block"
            />
          )}

          <div className="hero-copy max-w-2xl">
            <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-balance md:text-7xl">
              {movie.title}
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-texto/80">
              {movie.voteAverage > 0 && (
                <span className="font-semibold text-projetor">★ {movie.voteAverage.toFixed(1)}</span>
              )}
              {meta.map((m) => (
                <span key={String(m)}>{m}</span>
              ))}
            </p>
            {movie.genres.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <li key={g} className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-texto/80">
                    {g}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-texto px-5 py-2.5 font-semibold text-sala hover:bg-texto/85"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
                  </svg>
                  Ver trailer
                </a>
              )}
              <MarkButtons
                movie={{ movieId: movie.id, title: movie.title, posterPath: movie.posterPath }}
                initialStatus={markStatus}
                loggedIn={user !== null}
                loginHref={loginHref}
              />
              <ShareButton title={movie.title} url={shareUrl} />
            </div>

            {movie.overview && (
              <p className="mt-6 max-w-[62ch] leading-relaxed text-texto/90">{movie.overview}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-10 px-4 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:px-12">
        <section aria-labelledby="onde-assistir">
          <h2 id="onde-assistir" className="font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
            Onde assistir
          </h2>
          <div className="mt-3">
            <ProviderList providers={movie.providers} myProviderIds={myProviderIds} />
          </div>
        </section>

        {movie.cast.length > 0 && (
          <section aria-labelledby="elenco">
            <h2 id="elenco" className="font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
              Elenco
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {movie.cast.map((c) => (
                <li key={c.name + c.character} className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.character && <p className="truncate text-xs text-apagado">{c.character}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="mt-12">
        <Shelf title="Se gostou, veja também" movies={recommendations} />
      </div>
    </article>
  );
}
