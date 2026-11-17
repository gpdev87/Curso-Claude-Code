export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function releaseYear(date: string | null): number | null {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

export function movieSlug(id: number, title: string): string {
  const text = title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return text ? `${id}-${text}` : String(id);
}

export function parseMovieSlug(slug: string): number | null {
  const match = /^(\d+)(?:-|$)/.exec(slug);
  if (!match) return null;
  const id = Number(match[1]);
  return id > 0 ? id : null;
}

export type ImageSize = "w185" | "w342" | "w780" | "w1280";

export function imageUrl(path: string | null, size: ImageSize): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
