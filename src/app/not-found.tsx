import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-36 text-center">
      <p aria-hidden="true" className="rank-numeral font-display text-9xl font-black leading-none">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold">Filme não encontrado</h1>
      <p className="mt-2 text-apagado">O link pode estar errado ou o filme saiu do catálogo.</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-texto px-5 py-2.5 font-semibold text-sala hover:bg-texto/85"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
