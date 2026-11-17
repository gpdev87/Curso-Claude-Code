/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProviderList } from "@/components/ProviderList";
import { ShareButton } from "@/components/ShareButton";
import { Shelf } from "@/components/Shelf";
import { formatRuntime, imageUrl, movieSlug, parseMovieSlug, releaseYear } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { COOKIE_NAME, parseMyStreamings, providerIdsFor } from "@/lib/streamings";
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
  const recommendations = await annotateRecommendations(movie.recommendations, myProviderIds);

  const backdrop = imageUrl(movie.backdropPath, "w1280") ?? imageUrl(movie.posterPath, "w780");
  const meta = [
    releaseYear(movie.releaseDate),
    formatRuntime(movie.runtime),
    movie.genres.join(", ") || null,
    movie.voteAverage ? `★ ${movie.voteAverage.toFixed(1)}` : null,
    movie.certification ? `Classificação: ${movie.certification}` : null,
  ].filter(Boolean);
  const shareUrl = `${siteUrl()}/filme/${movieSlug(movie.id, movie.title)}`;

  return (
    <article>
      <div className="relative aspect-video max-h-80 w-full overflow-hidden bg-neutral-900">
        {backdrop && <img src={backdrop} alt="" className="h-full w-full object-cover opacity-70" />}
        <h1 className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f0f0f] px-4 pb-3 pt-10 text-2xl font-bold">
          {movie.title}
        </h1>
      </div>

      <div className="px-4">
        <p className="mt-2 text-sm text-neutral-400">{meta.join(" · ")}</p>

        <h2 className="mt-5 mb-2 text-base font-bold">Onde assistir</h2>
        <ProviderList providers={movie.providers} myProviderIds={myProviderIds} />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-black"
            >
              ▶ Ver trailer
            </a>
          )}
          <ShareButton title={movie.title} url={shareUrl} />
        </div>

        <h2 className="mt-6 mb-1 text-base font-bold">Sinopse</h2>
        <p className="text-sm leading-relaxed text-neutral-300">{movie.overview}</p>

        {movie.cast.length > 0 && (
          <>
            <h2 className="mt-6 mb-1 text-base font-bold">Elenco</h2>
            <p className="text-sm text-neutral-300">{movie.cast.map((c) => c.name).join(", ")}</p>
          </>
        )}
      </div>

      <Shelf title="Se gostou, veja também" movies={recommendations} />
    </article>
  );
}
