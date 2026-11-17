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
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-md bg-cortina/80 px-5 py-2.5 font-semibold text-texto backdrop-blur hover:bg-cortina"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Compartilhar
      </button>
      {copied && (
        <span role="status" className="text-sm text-assina">
          Link copiado!
        </span>
      )}
    </span>
  );
}
