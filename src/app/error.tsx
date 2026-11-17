"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 py-16 text-center">
      <p className="text-base">Não conseguimos carregar os filmes agora. Tente de novo em instantes.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-md bg-neutral-800 px-4 py-2 text-sm font-semibold"
      >
        Tentar de novo
      </button>
    </div>
  );
}
