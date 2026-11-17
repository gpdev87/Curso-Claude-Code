/* eslint-disable @next/next/no-img-element -- imagens já vêm redimensionadas do CDN do TMDB */
import Link from "next/link";
import { formatRuntime, imageUrl, movieSlug, releaseYear } from "@/lib/format";
import type { MovieDetail } from "@/lib/tmdb/types";

export function Hero({ movie, kicker, myProviderIds }: { movie: MovieDetail; kicker: string; myProviderIds: number[] }) {
  const backdrop = imageUrl(movie.backdropPath, "w1280") ?? imageUrl(movie.posterPath, "w780");
  const meta = [releaseYear(movie.releaseDate), formatRuntime(movie.runtime), movie.genres.slice(0, 2).join(", ") || null]
    .filter(Boolean)
    .join("  •  ");
  const mine = new Set(myProviderIds);
  const providers = [...movie.providers].sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id))).slice(0, 4);

  return (
    <section aria-labelledby="hero-title" className="relative isolate flex h-[78svh] max-h-[52rem] min-h-[34rem] items-end overflow-hidden md:h-[86svh]">
      {backdrop && (
        <img src={backdrop} alt="" className="hero-backdrop absolute inset-0 -z-20 h-full w-full object-cover object-[70%_20%]" />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-sala via-sala/70 to-transparent md:via-sala/40" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-sala via-sala/60 to-transparent" />

      <div className="hero-copy w-full max-w-xl px-4 pb-24 md:px-12 md:pb-32">
        <p className="flex items-center gap-2 text-sm font-semibold text-projetor">
          <span className="rounded bg-projetor px-1.5 py-0.5 font-display text-base font-black leading-none text-sala">1º</span>
          {kicker}
        </p>
        <h1
          id="hero-title"
          className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-balance md:text-7xl"
        >
          {movie.title}
        </h1>
        {meta && <p className="mt-4 text-sm text-texto/80">{meta}</p>}
        {movie.overview && (
          <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-texto/90 md:text-base">{movie.overview}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/filme/${movieSlug(movie.id, movie.title)}`}
            className="inline-flex items-center gap-2 rounded-md bg-texto px-5 py-2.5 font-semibold text-sala hover:bg-texto/85"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
            </svg>
            Onde assistir
          </Link>
          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-cortina/80 px-5 py-2.5 font-semibold text-texto backdrop-blur hover:bg-cortina"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
              </svg>
              Ver trailer
            </a>
          )}
        </div>

        {providers.length > 0 && (
          <div className="mt-6 flex items-center gap-3 text-sm text-texto/70">
            <span>Disponível em</span>
            <ul className="flex gap-2">
              {providers.map((p) => {
                const logo = imageUrl(p.logoPath, "w185");
                return logo ? (
                  <li key={p.id}>
                    <img
                      src={logo}
                      alt={p.name}
                      title={p.name}
                      className={`h-8 w-8 rounded-md ${mine.has(p.id) ? "ring-2 ring-assina" : ""}`}
                    />
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
