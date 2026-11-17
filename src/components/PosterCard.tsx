/* eslint-disable @next/next/no-img-element -- imagens já vêm redimensionadas do CDN do TMDB */
import Link from "next/link";
import { imageUrl, movieSlug } from "@/lib/format";
import type { MovieSummary } from "@/lib/tmdb/types";

export function PosterCard({
  movie,
  badge,
  rank,
  showRating = false,
}: {
  movie: MovieSummary;
  badge?: string;
  rank?: number;
  showRating?: boolean;
}) {
  const src = imageUrl(movie.posterPath, "w342");
  return (
    <Link
      href={`/filme/${movieSlug(movie.id, movie.title)}`}
      className={`group relative flex shrink-0 snap-start items-end ${rank ? "" : "w-32 sm:w-40"}`}
    >
      {rank && (
        <span
          aria-hidden="true"
          className="rank-numeral -mr-4 font-display text-[8.5rem] font-black leading-[0.72] tracking-tighter sm:-mr-5 sm:text-[11rem]"
        >
          {rank}
        </span>
      )}
      <div
        className={`relative aspect-[2/3] shrink-0 overflow-hidden rounded-md bg-poltrona ring-projetor transition duration-200 group-hover:ring-2 group-focus-visible:ring-2 motion-safe:group-hover:-translate-y-1 ${
          rank ? "w-28 sm:w-36" : "w-full"
        }`}
      >
        {src ? (
          <img src={src} alt={movie.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-br from-cortina to-poltrona p-3 font-display text-lg font-bold leading-tight text-texto/80">
            {movie.title}
          </div>
        )}
        {showRating && movie.voteAverage > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded bg-sala/85 px-1.5 py-0.5 text-xs font-semibold text-projetor">
            ★ {movie.voteAverage.toFixed(1)}
          </span>
        )}
        {badge && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-5 text-[11px] font-semibold text-assina">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}
