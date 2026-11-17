export type CategoryOrder = "alta" | "nota";

export type Category = { slug: string; name: string; genreId: number | null };

const c = (slug: string, name: string, genreId: number | null): Category => ({ slug, name, genreId });

// "Todas", depois as 8 categorias da tela inicial, depois os demais gêneros de filme do TMDB.
export const CATEGORIES: Category[] = [
  c("todas", "Todas", null),
  c("comedia", "Comédia", 35),
  c("acao", "Ação", 28),
  c("terror", "Terror", 27),
  c("familia", "Família", 10751),
  c("drama", "Drama", 18),
  c("animacao", "Animação", 16),
  c("romance", "Romance", 10749),
  c("ficcao-cientifica", "Ficção científica", 878),
  c("aventura", "Aventura", 12),
  c("crime", "Crime", 80),
  c("documentario", "Documentário", 99),
  c("fantasia", "Fantasia", 14),
  c("historia", "História", 36),
  c("musica", "Música", 10402),
  c("misterio", "Mistério", 9648),
  c("suspense", "Suspense", 53),
  c("guerra", "Guerra", 10752),
  c("faroeste", "Faroeste", 37),
  c("filme-de-tv", "Filme de TV", 10770),
];

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}

export function parseOrder(value: string | string[] | undefined): CategoryOrder {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "nota" ? "nota" : "alta";
}

export function categoryHref(slug: string, order: CategoryOrder): string {
  return order === "nota" ? `/categoria/${slug}?ordem=nota` : `/categoria/${slug}`;
}
