"use server";

import { type CategoryOrder, categoryBySlug } from "@/lib/categories";
import { parseMyStreamings, providerIdsFor } from "@/lib/streamings";
import { getCategoryPage } from "@/lib/tmdb/discover";
import type { MovieSummary } from "@/lib/tmdb/types";

/**
 * Próxima página da categoria ("Carregar mais"). A página 1 vem renderizada pelo servidor.
 * `streamings` é o filtro com que a página 1 foi montada (valor do cookie naquele momento),
 * para não misturar listas se a pessoa trocar os streamings em outra aba. Vem do navegador,
 * por isso é revalidado por `parseMyStreamings`.
 */
export async function loadCategoryPage(
  slug: string,
  order: CategoryOrder,
  page: number,
  streamings: string,
): Promise<{ movies: MovieSummary[]; hasMore: boolean }> {
  const category = categoryBySlug(slug);
  const validOrder = order === "alta" || order === "nota";
  if (!category || !validOrder || !Number.isInteger(page) || page < 2 || page > 500) {
    throw new Error("Página inválida");
  }

  const providerIds = providerIdsFor(parseMyStreamings(typeof streamings === "string" ? streamings : ""));
  return getCategoryPage(category.genreId, order, providerIds, page);
}
