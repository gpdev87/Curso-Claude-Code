"use server";

import { isValidMarkMovie, type MarkMovie, type MarkStatus } from "@/lib/marks-rules";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

type SetMarkResult = { ok: true } | { ok: false; reason: "auth" | "invalid" | "error" };

export async function setMark(movie: MarkMovie, status: MarkStatus | null): Promise<SetMarkResult> {
  if (!isValidMarkMovie(movie) || (status !== null && status !== "quero" && status !== "visto")) {
    return { ok: false, reason: "invalid" };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };

  try {
    const supabase = await createClient();
    const { error } =
      status === null
        ? await supabase.from("movie_marks").delete().eq("user_id", user.id).eq("movie_id", movie.movieId)
        : await supabase.from("movie_marks").upsert(
            {
              user_id: user.id,
              movie_id: movie.movieId,
              status,
              title: movie.title,
              poster_path: movie.posterPath,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,movie_id" },
          );
    return error ? { ok: false, reason: "error" } : { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
