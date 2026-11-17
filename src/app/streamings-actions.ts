"use server";

import { parseMyStreamings } from "@/lib/streamings";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export async function saveStreamings(ids: string[]): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const streamings = parseMyStreamings(
    Array.isArray(ids) ? ids.filter((s) => typeof s === "string").join(",") : "",
  );

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, streamings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
