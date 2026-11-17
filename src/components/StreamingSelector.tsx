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
      className={`shrink-0 rounded-full px-3 py-1 text-sm ${on ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-300"}`}
    >
      {label}
    </button>
  );
}

export function StreamingSelector({ selected, others }: { selected: string[]; others: Provider[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(selected);
  const [showOthers, setShowOthers] = useState(false);

  function toggle(id: string) {
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setCurrent(next);
    writeMyStreamingsCookie(next);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2 px-4">
      {STREAMINGS.filter((s) => s.providerIds.length > 0).map((s) => (
        <Chip key={s.id} label={s.name} on={current.includes(s.id)} onClick={() => toggle(s.id)} />
      ))}
      {showOthers &&
        others.map((p) => (
          <Chip key={p.id} label={p.name} on={current.includes(`p${p.id}`)} onClick={() => toggle(`p${p.id}`)} />
        ))}
      {others.length > 0 && (
        <button
          type="button"
          onClick={() => setShowOthers((v) => !v)}
          className="shrink-0 rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-400"
        >
          {showOthers ? "− menos" : "+ outros"}
        </button>
      )}
    </div>
  );
}
