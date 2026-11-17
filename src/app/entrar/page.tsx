import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/auth/next";
import { getCurrentUser } from "@/lib/supabase/server";
import { requestPasswordReset, signIn, signUp } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { next, erro } = await searchParams;
  const target = safeNext(next);
  if (await getCurrentUser()) redirect(target);
  const initialError = erro === "link" ? "Esse link expirou ou já foi usado. Peça um novo." : undefined;

  return (
    <div className="px-4 pt-24 md:px-12 md:pt-28">
      <AuthForm
        next={target}
        initialError={initialError}
        signInAction={signIn}
        signUpAction={signUp}
        resetAction={requestPasswordReset}
      />
    </div>
  );
}
