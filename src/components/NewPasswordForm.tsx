"use client";

import { useActionState } from "react";

type AuthState = { error?: string; info?: string; email?: string } | undefined;

export function NewPasswordForm({ action }: { action: (prev: AuthState, form: FormData) => Promise<AuthState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-3xl font-bold tracking-tight">Nova senha</h1>
      <label className="mt-6 block text-sm font-medium">
        Nova senha
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-white/15 bg-poltrona px-4 py-3 outline-none placeholder:text-apagado focus:border-projetor"
        />
      </label>
      {state?.error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-md bg-projetor px-5 py-3 font-semibold text-sala disabled:opacity-60"
      >
        Salvar nova senha
      </button>
    </form>
  );
}
