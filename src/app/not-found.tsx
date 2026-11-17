import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Filme não encontrado</h1>
      <p className="mt-2 text-sm text-neutral-400">O link pode estar errado ou o filme saiu do catálogo.</p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-neutral-800 px-4 py-2 text-sm font-semibold">
        Voltar para o início
      </Link>
    </div>
  );
}
