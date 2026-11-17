import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CategoryGrid } from "@/components/CategoryGrid";
import { CategoryNav } from "@/components/CategoryNav";
import { categoryBySlug, parseOrder } from "@/lib/categories";
import { COOKIE_NAME, parseMyStreamings, providerIdsFor, serializeMyStreamings } from "@/lib/streamings";
import { getCategoryPage } from "@/lib/tmdb/discover";

const heading = (slug: string, name: string) => (slug === "todas" ? "Todos os filmes" : name);

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return { title: "Categoria não encontrada" };
  const order = parseOrder((await searchParams).ordem);
  const title = heading(slug, category.name);
  return { title: order === "nota" ? `${title} — mais bem avaliados` : title };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  const order = parseOrder((await searchParams).ordem);
  const cookieStore = await cookies();
  const selected = parseMyStreamings(cookieStore.get(COOKIE_NAME)?.value);
  const providerIds = providerIdsFor(selected);
  const { movies, hasMore } = await getCategoryPage(category.genreId, order, providerIds, 1);

  return (
    <div className="px-4 pt-24 md:px-12 md:pt-28">
      <h1 className="font-display text-4xl font-black uppercase tracking-tight md:text-5xl">
        {heading(slug, category.name)}
      </h1>
      <p className="mt-1 text-sm text-apagado">
        {providerIds.length > 0 ? "Nos seus streamings" : "Em todos os streamings por assinatura do Brasil"}
      </p>

      <div className="mt-6">
        <CategoryNav current={slug} order={order} />
      </div>

      <div className="mt-8">
        {movies.length === 0 ? (
          <p className="text-apagado">Nenhum filme desta categoria nos seus streamings.</p>
        ) : (
          <CategoryGrid
            key={`${slug}-${order}`}
            slug={slug}
            order={order}
            initialMovies={movies}
            initialHasMore={hasMore}
            streamings={serializeMyStreamings(selected)}
          />
        )}
      </div>
    </div>
  );
}
