"use server";

import { cookies } from "next/headers";
import { type CategoryOrder, categoryBySlug } from "@/lib/categories";
import { COOKIE_NAME, parseMyStreamings, providerIdsFor } from "@/lib/streamings";
import { getCategoryPage } from "@/lib/tmdb/discover";
import type { MovieSummary } from "@/lib/tmdb/types";

/** Próxima página da categoria ("Carregar mais"). A página 1 vem renderizada pelo servidor. */
export async function loadCategoryPage(
  slug: string,
  order: CategoryOrder,
  page: number,
): Promise<{ movies: MovieSummary[]; hasMore: boolean }> {
  const category = categoryBySlug(slug);
  const validOrder = order === "alta" || order === "nota";
  if (!category || !validOrder || !Number.isInteger(page) || page < 2 || page > 500) {
    throw new Error("Página inválida");
  }

  const cookieStore = await cookies();
  const providerIds = providerIdsFor(parseMyStreamings(cookieStore.get(COOKIE_NAME)?.value));
  return getCategoryPage(category.genreId, order, providerIds, page);
}
