/* eslint-disable @next/next/no-img-element */
import { imageUrl } from "@/lib/format";
import type { Provider } from "@/lib/tmdb/types";

export function ProviderList({ providers, myProviderIds }: { providers: Provider[]; myProviderIds: number[] }) {
  if (providers.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-poltrona px-4 py-3 text-sm text-apagado">
        Não disponível em streaming por assinatura no Brasil
      </p>
    );
  }

  const mine = new Set(myProviderIds);
  const sorted = [...providers.filter((p) => mine.has(p.id)), ...providers.filter((p) => !mine.has(p.id))];

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((p) => {
        const logo = imageUrl(p.logoPath, "w185");
        const subscribed = mine.has(p.id);
        return (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
              subscribed ? "border-assina/50 bg-assina/10" : "border-white/10 bg-poltrona"
            }`}
          >
            {logo ? (
              <img src={logo} alt="" className="h-10 w-10 rounded-md" />
            ) : (
              <span className="h-10 w-10 rounded-md bg-cortina" />
            )}
            <span className="font-medium">{p.name}</span>
            {subscribed && <span className="ml-auto text-xs font-semibold text-assina">✓ você assina</span>}
          </li>
        );
      })}
    </ul>
  );
}
