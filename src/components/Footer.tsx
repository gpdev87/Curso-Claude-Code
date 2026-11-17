/* eslint-disable @next/next/no-img-element */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 px-4 py-8 text-xs text-apagado md:px-12">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="font-display text-lg font-black text-texto/60">CineCasa</span>
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="inline-block">
          <img src="/tmdb-logo.svg" alt="TMDB" className="h-3" />
        </a>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p>
          Dados de streaming:{" "}
          <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="underline hover:text-texto">
            JustWatch
          </a>
        </p>
      </div>
    </footer>
  );
}
