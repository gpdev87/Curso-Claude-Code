"use server";

import { redirect } from "next/navigation";
import { syncStreamingsAfterLogin } from "@/lib/account/streamings-cookie";
import { authErrorMessage } from "@/lib/auth/messages";
import { safeNext } from "@/lib/auth/next";
import { siteUrl } from "@/lib/site";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string; email?: string } | undefined;

const UNAVAILABLE = "Contas indisponíveis no momento.";

function text(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v : "";
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = text(form, "email").trim();
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE, email };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: text(form, "password") });
  if (error || !data.user) return { error: authErrorMessage(error?.code), email };
  await syncStreamingsAfterLogin(supabase, data.user.id);
  redirect(safeNext(text(form, "next")));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = text(form, "email").trim();
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE, email };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password: text(form, "password") });
  if (error || !data.user) return { error: authErrorMessage(error?.code), email };
  await syncStreamingsAfterLogin(supabase, data.user.id);
  redirect(safeNext(text(form, "next")));
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = text(form, "email").trim();
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE, email };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/redefinir-senha`,
  });
  if (error && (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit")) {
    return { error: authErrorMessage(error.code), email };
  }
  // Mesma resposta exista a conta ou não, para não revelar quais emails têm conta.
  return { info: "Se existir uma conta com esse email, enviamos um link para criar uma nova senha.", email };
}

export async function updatePassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE, email: "" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: text(form, "password") });
  if (error) return { error: authErrorMessage(error.code) };
  const { data } = await supabase.auth.getUser();
  if (data.user) await syncStreamingsAfterLogin(supabase, data.user.id);
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
