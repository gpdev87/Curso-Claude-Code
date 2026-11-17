import Link from "next/link";
import { CATEGORIES, type CategoryOrder, categoryHref } from "@/lib/categories";

const pill = (active: boolean) =>
  `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-projetor bg-projetor text-sala"
      : "border-white/15 bg-poltrona/80 text-texto/80 hover:border-white/40 hover:text-texto"
  }`;

export function CategoryNav({ current, order }: { current: string; order: CategoryOrder }) {
  return (
    <div className="space-y-4">
      <nav aria-label="Categorias" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:-mx-12 md:px-12">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={categoryHref(c.slug, order)}
            aria-current={c.slug === current ? "page" : undefined}
            className={pill(c.slug === current)}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <nav aria-label="Ordenar" className="inline-flex overflow-hidden rounded-md border border-white/15 text-sm">
        {(
          [
            ["alta", "Em alta"],
            ["nota", "★ Mais bem avaliados"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={categoryHref(current, value)}
            aria-current={order === value ? "page" : undefined}
            className={`px-4 py-2 font-medium ${
              order === value ? "bg-cortina text-projetor" : "text-texto/70 hover:text-texto"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
