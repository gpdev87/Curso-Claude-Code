import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/next";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const TYPES = ["recovery", "email"] as const;
type OtpType = (typeof TYPES)[number];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const failure = NextResponse.redirect(new URL("/entrar?erro=link", request.url));

  if (!tokenHash || !type || !TYPES.includes(type as OtpType) || !isSupabaseConfigured()) return failure;

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: type as OtpType, token_hash: tokenHash });
  if (error) return failure;

  return NextResponse.redirect(new URL(safeNext(params.get("next")), request.url));
}
