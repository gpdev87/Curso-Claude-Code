import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { NewPasswordForm } from "@/components/NewPasswordForm";
import { updatePassword } from "@/app/entrar/actions";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nova senha" };

export default async function RedefinirSenhaPage() {
  await connection();
  if (!(await getCurrentUser())) redirect("/entrar?erro=link");
  return (
    <div className="px-4 pt-24 md:px-12 md:pt-28">
      <NewPasswordForm action={updatePassword} />
    </div>
  );
}
