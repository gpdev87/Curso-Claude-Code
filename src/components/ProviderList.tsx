/* eslint-disable @next/next/no-img-element */
import { imageUrl } from "@/lib/format";
import type { Provider } from "@/lib/tmdb/types";

export function ProviderList({ providers, myProviderIds }: { providers: Provider[]; myProviderIds: number[] }) {
  if (providers.length === 0) {
    return <p className="text-sm text-neutral-400">Não disponível em streaming por assinatura no Brasil</p>;
  }

  const mine = new Set(myProviderIds);
  const sorted = [...providers.filter((p) => mine.has(p.id)), ...providers.filter((p) => !mine.has(p.id))];

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((p) => {
        const logo = imageUrl(p.logoPath, "w185");
        return (
          <li key={p.id} className="flex items-center gap-3">
            {logo && <img src={logo} alt="" className="h-8 w-8 rounded-md" />}
            <span className="font-medium">{p.name}</span>
            {mine.has(p.id) && (
              <span className="rounded bg-emerald-600 px-1.5 text-xs font-semibold text-white">✓ você assina</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
