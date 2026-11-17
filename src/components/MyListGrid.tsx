import Link from "next/link";
import type { Mark } from "@/lib/marks";
import type { MarkStatus } from "@/lib/marks-rules";
import { PosterCard } from "./PosterCard";

export function MyListGrid({ marks, tab }: { marks: Mark[]; tab: MarkStatus }) {
  if (marks.length === 0) {
    return (
      <div>
        <p className="text-apagado">
          {tab === "quero"
            ? "Nenhum filme em Quero assistir ainda. Marque filmes na página de cada um."
            : "Nenhum filme em Já assisti ainda."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md border border-white/20 px-6 py-2.5 font-semibold text-texto hover:border-projetor hover:text-projetor"
        >
          Ver filmes
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 [&>a]:w-auto">
      {marks.map((mark) => (
        <PosterCard
          key={mark.movieId}
          movie={{
            id: mark.movieId,
            title: mark.title,
            posterPath: mark.posterPath,
            voteAverage: 0,
            releaseDate: null,
          }}
        />
      ))}
    </div>
  );
}
