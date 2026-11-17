import type { AnnotatedMovie, MovieSummary } from "@/lib/tmdb/types";
import { PosterCard } from "./PosterCard";
import { ShelfRow } from "./ShelfRow";

export function Shelf({
  title,
  movies,
  ranked = false,
}: {
  title: string;
  movies: (MovieSummary | AnnotatedMovie)[];
  ranked?: boolean;
}) {
  if (movies.length === 0) return null;
  const list = ranked ? movies.slice(0, 10) : movies;
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="px-4 font-display text-2xl font-bold tracking-tight md:px-12 md:text-[1.75rem]">{title}</h2>
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
