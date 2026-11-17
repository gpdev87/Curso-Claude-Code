import type { Metadata } from "next";
import { PosterCard } from "@/components/PosterCard";
import { searchMovies } from "@/lib/tmdb/search";

export const metadata: Metadata = { title: "Buscar filme" };

export default async function SearchPage({ searchParams }: PageProps<"/busca">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const results = await searchMovies(query);

  return (
    <div className="px-4">
      <form action="/busca" method="get" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar filme…"
          autoFocus
          className="w-full rounded-md bg-neutral-800 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-red-600"
        />
      </form>

      {query && results.length === 0 && (
        <p className="mt-6 text-sm text-neutral-400">Nenhum filme encontrado para &quot;{query}&quot;</p>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 [&>a]:w-auto">
          {results.map((movie) => (
            <PosterCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
