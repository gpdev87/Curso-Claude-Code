import type { MarkMovie, MarkStatus } from "@/lib/marks-rules";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type Mark = MarkMovie & { status: MarkStatus; updatedAt: string };

export async function getMarkStatus(movieId: number): Promise<MarkStatus | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("movie_marks")
      .select("status")
      .eq("user_id", user.id)
      .eq("movie_id", movieId)
      .maybeSingle();
    if (error || !data) return null;
    return data.status === "quero" || data.status === "visto" ? data.status : null;
  } catch {
    return null;
  }
}

export async function listMarks(): Promise<Mark[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("movie_marks")
      .select("movie_id, status, title, poster_path, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r) => ({
      movieId: r.movie_id,
      status: r.status,
      title: r.title,
      posterPath: r.poster_path,
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}
