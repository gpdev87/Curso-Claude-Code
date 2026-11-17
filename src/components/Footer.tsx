/* eslint-disable @next/next/no-img-element */
export function Footer() {
  return (
    <footer className="mt-10 border-t border-neutral-800 px-4 py-6 text-center text-xs text-neutral-500">
      <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="inline-block">
        <img src="/tmdb-logo.svg" alt="TMDB" className="mx-auto h-3" />
      </a>
      <p className="mt-2">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      <p className="mt-1">
        Dados de streaming:{" "}
        <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="underline">
          JustWatch
        </a>
      </p>
    </footer>
  );
}
