"use client";

import { useState } from "react";
import { loadCategoryPage } from "@/app/categoria/actions";
import type { CategoryOrder } from "@/lib/categories";
import type { MovieSummary } from "@/lib/tmdb/types";
import { PosterCard } from "./PosterCard";

type LoadPage = typeof loadCategoryPage;

export function CategoryGrid({
  slug,
  order,
  initialMovies,
  initialHasMore,
  load = loadCategoryPage,
}: {
  slug: string;
  order: CategoryOrder;
  initialMovies: MovieSummary[];
  initialHasMore: boolean;
  load?: LoadPage;
}) {
  const [movies, setMovies] = useState(initialMovies);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextPage, setNextPage] = useState(2);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function loadMore() {
    setStatus("loading");
    try {
      const result = await load(slug, order, nextPage);
      setMovies((current) => {
        const seen = new Set(current.map((m) => m.id));
        return [...current, ...result.movies.filter((m) => !seen.has(m.id))];
      });
      setHasMore(result.hasMore);
      setNextPage((p) => p + 1);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 [&>a]:w-auto">
        {movies.map((movie) => (
          <PosterCard key={movie.id} movie={movie} showRating />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={status === "loading"}
            className="rounded-md border border-white/20 px-6 py-2.5 font-semibold text-texto hover:border-projetor hover:text-projetor disabled:opacity-60"
          >
            {status === "loading" ? "Carregando…" : status === "error" ? "Tentar de novo" : "Carregar mais"}
          </button>
        </div>
      )}
    </>
  );
}
