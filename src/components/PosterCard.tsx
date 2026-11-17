/* eslint-disable @next/next/no-img-element -- imagens já vêm redimensionadas do CDN do TMDB */
import Link from "next/link";
import { imageUrl, movieSlug } from "@/lib/format";
import type { MovieSummary } from "@/lib/tmdb/types";

export function PosterCard({ movie, badge }: { movie: MovieSummary; badge?: string }) {
  const src = imageUrl(movie.posterPath, "w342");
  return (
    <Link
      href={`/filme/${movieSlug(movie.id, movie.title)}`}
      className="relative block w-28 shrink-0 snap-start sm:w-36"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-md bg-neutral-800">
        {src ? (
          <img src={src} alt={movie.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-2 text-xs font-semibold text-neutral-300">{movie.title}</div>
        )}
      </div>
      {badge && (
        <span className="absolute left-1 top-1 rounded bg-emerald-600 px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
