"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-36 text-center">
      <p className="font-display text-5xl font-black uppercase text-projetor">Tela apagada</p>
      <p className="mt-4">Não conseguimos carregar os filmes agora. Tente de novo em instantes.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 rounded-md bg-texto px-5 py-2.5 font-semibold text-sala hover:bg-texto/85"
      >
        Tentar de novo
      </button>
    </div>
  );
}
