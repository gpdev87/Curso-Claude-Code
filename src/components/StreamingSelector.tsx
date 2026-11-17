"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STREAMINGS, writeMyStreamingsCookie } from "@/lib/streamings";
import type { Provider } from "@/lib/tmdb/types";

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        on
          ? "border-projetor bg-projetor text-sala"
          : "border-white/15 bg-poltrona/80 text-texto/80 hover:border-white/40 hover:text-texto"
      }`}
    >
      {on && (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="-ml-0.5 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

export function StreamingSelector({
  selected,
  others,
  saveToAccount,
}: {
  selected: string[];
  others: Provider[];
  saveToAccount?: (ids: string[]) => Promise<unknown>;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(selected);
  const [showOthers, setShowOthers] = useState(false);

  // Extras salvos ficam sempre visíveis, para a pessoa ver e poder desmarcar.
  // Fixados pela seleção inicial, para o chip não sumir ao ser desmarcado.
  const [selectedExtras] = useState<Provider[]>(() =>
    selected
      .filter((id) => /^p\d+$/.test(id))
      .map((id) => {
        const providerId = Number(id.slice(1));
        return others.find((p) => p.id === providerId) ?? { id: providerId, name: `Serviço ${providerId}`, logoPath: null };
      }),
  );

  function toggle(id: string) {
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setCurrent(next);
    writeMyStreamingsCookie(next);
    // O cookie já garante a tela; a conta é salva sem esperar e falhas são ignoradas.
    void Promise.resolve(saveToAccount?.(next)).catch(() => {});
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STREAMINGS.filter((s) => s.providerIds.length > 0).map((s) => (
        <Chip key={s.id} label={s.name} on={current.includes(s.id)} onClick={() => toggle(s.id)} />
      ))}
      {selectedExtras.map((p) => (
        <Chip key={p.id} label={p.name} on={current.includes(`p${p.id}`)} onClick={() => toggle(`p${p.id}`)} />
      ))}
      {showOthers &&
        others
          .filter((p) => !selectedExtras.some((s) => s.id === p.id))
          .map((p) => (
            <Chip key={p.id} label={p.name} on={current.includes(`p${p.id}`)} onClick={() => toggle(`p${p.id}`)} />
          ))}
      {others.length > 0 && (
        <button
          type="button"
          aria-expanded={showOthers}
          onClick={() => setShowOthers((v) => !v)}
          className="shrink-0 rounded-full border border-dashed border-white/25 px-3.5 py-1.5 text-sm text-apagado hover:border-white/50 hover:text-texto"
        >
          {showOthers ? "− menos" : "+ outros"}
        </button>
      )}
    </div>
  );
}
