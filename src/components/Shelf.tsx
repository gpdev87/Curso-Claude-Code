import Link from "next/link";
import type { AnnotatedMovie, MovieSummary } from "@/lib/tmdb/types";
import { PosterCard } from "./PosterCard";
import { ShelfRow } from "./ShelfRow";

export function Shelf({
  title,
  movies,
  ranked = false,
  seeAllHref,
}: {
  title: string;
  movies: (MovieSummary | AnnotatedMovie)[];
  ranked?: boolean;
  seeAllHref?: string;
}) {
  if (movies.length === 0) return null;
  const list = ranked ? movies.slice(0, 10) : movies;
  return (
    <section className="mt-8 first:mt-0">
      <div className="flex items-baseline gap-4 px-4 md:px-12">
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-sm font-semibold text-projetor hover:underline">
            Ver tudo ›
          </Link>
        )}
      </div>
      <ShelfRow>
        {list.map((movie, i) => (
          <PosterCard
            key={movie.id}
            movie={movie}
            rank={ranked ? i + 1 : undefined}
            badge={"onMyStreamings" in movie && movie.onMyStreamings ? "✓ nos seus streamings" : undefined}
          />
        ))}
      </ShelfRow>
    </section>
  );
}
