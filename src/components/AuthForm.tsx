"use client";

import { useActionState, useState } from "react";
import type { AuthState } from "@/app/entrar/actions";

type AuthAction = (prev: AuthState, form: FormData) => Promise<AuthState>;
type Mode = "entrar" | "criar" | "esqueci";

const COPY: Record<Mode, { title: string; button: string }> = {
  entrar: { title: "Entrar", button: "Entrar" },
  criar: { title: "Criar conta", button: "Criar conta" },
  esqueci: { title: "Recuperar senha", button: "Enviar link" },
};

const inputClass =
  "mt-1 w-full rounded-md border border-white/15 bg-poltrona px-4 py-3 outline-none placeholder:text-apagado focus:border-projetor";
const linkClass = "text-sm text-apagado underline-offset-2 hover:text-texto hover:underline";

export function AuthForm({
  next,
  initialError,
  signInAction,
  signUpAction,
  resetAction,
}: {
  next: string;
  initialError?: string;
  signInAction: AuthAction;
  signUpAction: AuthAction;
  resetAction: AuthAction;
}) {
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [switched, setSwitched] = useState(false);
  const action = mode === "entrar" ? signInAction : mode === "criar" ? signUpAction : resetAction;

  function change(m: Mode) {
    setSwitched(true);
    setMode(m);
  }

  // key=mode: cada modo começa com o estado da action zerado.
  return (
    <ModeForm
      key={mode}
      mode={mode}
      action={action}
      next={next}
      email={email}
      onEmailChange={setEmail}
      initialError={switched ? undefined : initialError}
      onModeChange={change}
    />
  );
}

function ModeForm({
  mode,
  action,
  next,
  email,
  onEmailChange,
  initialError,
  onModeChange,
}: {
  mode: Mode;
  action: AuthAction;
  next: string;
  email: string;
  onEmailChange: (email: string) => void;
  initialError?: string;
  onModeChange: (mode: Mode) => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const error = state?.error ?? (state === undefined ? initialError : undefined);
  const { title, button } = COPY[mode];

  return (
    <form action={formAction} className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      <input type="hidden" name="next" value={next} />

      <label className="mt-6 block text-sm font-medium">
        Email
        <input type="email" name="email" required autoComplete="email" value={email} onChange={(e) => onEmailChange(e.target.value)} className={inputClass} />
      </label>

      {mode !== "esqueci" && (
        <label className="mt-4 block text-sm font-medium">
          Senha
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            className={inputClass}
          />
        </label>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}
      {state?.info && (
        <p role="status" className="mt-4 text-sm text-assina">
          {state.info}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-md bg-projetor px-5 py-3 font-semibold text-sala disabled:opacity-60"
      >
        {button}
      </button>

      <div className="mt-5 flex flex-col items-start gap-2">
        {mode === "entrar" && (
          <>
            <button type="button" onClick={() => onModeChange("criar")} className={linkClass}>
              Não tem conta? Criar conta
            </button>
            <button type="button" onClick={() => onModeChange("esqueci")} className={linkClass}>
              Esqueci minha senha
            </button>
          </>
        )}
        {mode !== "entrar" && (
          <button type="button" onClick={() => onModeChange("entrar")} className={linkClass}>
            Já tem conta? Entrar
          </button>
        )}
      </div>
    </form>
  );
}
