import type { ShelfDef } from "@/lib/tmdb/discover";
import type { MovieSummary } from "@/lib/tmdb/types";
import { Shelf } from "./Shelf";

export function ShelfList({ shelves }: { shelves: { shelf: ShelfDef; movies: MovieSummary[] }[] }) {
  if (shelves.length === 0) {
    return (
      <p className="mx-4 mt-10 max-w-md text-apagado md:mx-12">
        Nenhum filme encontrado nos streamings marcados. Tente marcar outros serviços.
      </p>
    );
  }
  return (
    <div>
      {shelves.map(({ shelf, movies }) => (
        <Shelf key={shelf.id} title={shelf.title} movies={movies} ranked={shelf.id === "em-alta"} seeAllHref={shelf.seeAllHref} />
      ))}
    </div>
  );
}
