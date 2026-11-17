"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setMark } from "@/app/filme/actions";
import { toggleStatus, type MarkMovie, type MarkStatus } from "@/lib/marks-rules";

type Save = typeof setMark;

const base = "inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold backdrop-blur";
const off = "bg-cortina/80 text-texto hover:bg-cortina";
const on = "bg-projetor text-sala hover:bg-projetor/90";

export function MarkButtons({
  movie,
  initialStatus,
  loggedIn,
  loginHref,
  save = setMark,
}: {
  movie: MarkMovie;
  initialStatus: MarkStatus | null;
  loggedIn: boolean;
  loginHref: string;
  save?: Save;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MarkStatus | null>(initialStatus);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  async function click(clicked: MarkStatus) {
    if (!loggedIn) {
      router.push(loginHref);
      return;
    }
    if (busy.current) return;
    busy.current = true;
    const previous = status;
    const next = toggleStatus(previous, clicked);
    setError(false);
    setStatus(next);
    try {
      const result = await save(movie, next);
      if (!result.ok) {
        setStatus(previous);
        if (result.reason === "auth") router.push(loginHref);
        else setError(true);
      }
    } catch {
      setStatus(previous);
      setError(true);
    } finally {
      busy.current = false;
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button type="button" aria-pressed={status === "quero"} onClick={() => click("quero")} className={`${base} ${status === "quero" ? on : off}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Quero assistir
      </button>
      <button type="button" aria-pressed={status === "visto"} onClick={() => click("visto")} className={`${base} ${status === "visto" ? on : off}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Já assisti
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-400">
          Não foi possível salvar. Tente de novo.
        </span>
      )}
    </span>
  );
}
