import type { AnnotatedMovie, MovieSummary } from "@/lib/tmdb/types";
import { PosterCard } from "./PosterCard";

export function Shelf({ title, movies }: { title: string; movies: (MovieSummary | AnnotatedMovie)[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-4 text-base font-bold">{title}</h2>
      <div className="flex snap-x gap-2 overflow-x-auto px-4 pb-2">
        {movies.map((movie) => (
          <PosterCard
            key={movie.id}
            movie={movie}
            badge={"onMyStreamings" in movie && movie.onMyStreamings ? "✓ nos seus streamings" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
