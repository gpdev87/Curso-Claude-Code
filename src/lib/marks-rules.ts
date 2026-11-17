export type MarkStatus = "quero" | "visto";
export type MarkMovie = { movieId: number; title: string; posterPath: string | null };

export function toggleStatus(current: MarkStatus | null, clicked: MarkStatus): MarkStatus | null {
  return current === clicked ? null : clicked;
}

export function isValidMarkMovie(m: unknown): m is MarkMovie {
  if (typeof m !== "object" || m === null) return false;
  const { movieId, title, posterPath } = m as Record<string, unknown>;
  if (typeof movieId !== "number" || !Number.isInteger(movieId) || movieId <= 0) return false;
  if (typeof title !== "string" || title.length < 1 || title.length > 300) return false;
  if (posterPath === null) return true;
  return typeof posterPath === "string" && posterPath.startsWith("/") && posterPath.length <= 200;
}
