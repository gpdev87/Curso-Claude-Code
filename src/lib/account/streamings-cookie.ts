import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveStreamingsOnLogin } from "@/lib/account/streamings-sync";
import { COOKIE_NAME, parseMyStreamings, serializeMyStreamings } from "@/lib/streamings";

/**
 * Concilia "Meus streamings" da conta com o cookie do aparelho ao entrar.
 * Uma falha aqui não impede o login: o cookie do aparelho fica como está.
 */
export async function syncStreamingsAfterLogin(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const device = parseMyStreamings(cookieStore.get(COOKIE_NAME)?.value);

    const { data, error } = await supabase
      .from("user_settings")
      .select("streamings")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;

    const { cookie, saveToAccount } = resolveStreamingsOnLogin(
      (data?.streamings as string[] | null | undefined) ?? null,
      device,
    );

    if (saveToAccount) {
      const { error: upsertError } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, streamings: saveToAccount, updated_at: new Date().toISOString() });
      if (upsertError) throw upsertError;
    }

    cookieStore.set(COOKIE_NAME, serializeMyStreamings(cookie), {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  } catch {
    // segue sem sincronizar
  }
}
