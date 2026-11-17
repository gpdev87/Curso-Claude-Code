"use client";

import { useState } from "react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // usuário cancelou o compartilhamento
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={share} className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-semibold">
        ↗ Compartilhar
      </button>
      {copied && <span className="text-sm text-emerald-400">Link copiado!</span>}
    </span>
  );
}
