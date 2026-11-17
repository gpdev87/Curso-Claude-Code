"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/busca", label: "Buscar" },
  { href: "/minhas-listas", label: "Minhas listas" },
];

type Props = { userEmail: string | null; signOutAction: () => Promise<void>; accountsEnabled?: boolean };

export function SiteHeader({ userEmail, signOutAction, accountsEnabled = true }: Props) {
  const nav = accountsEnabled ? NAV : NAV.filter((i) => i.href !== "/minhas-listas");
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  // O menu guarda a rota em que foi aberto: ao navegar, fecha sozinho.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === pathname;
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenPath(null);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenPath(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-sala/95 shadow-[0_1px_0_#ffffff10] backdrop-blur" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex h-16 items-center gap-6 px-4 md:px-12">
        <Link href="/" className="font-display text-[1.75rem] font-black leading-none tracking-tight text-projetor">
          CineCasa
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-5 text-sm sm:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? "font-semibold text-texto" : "text-texto/70 hover:text-texto"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/busca"
          aria-label="Buscar filme"
          className="ml-auto grid h-10 w-10 place-items-center rounded-full text-texto hover:bg-white/10"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </Link>

        {accountsEnabled && (
          <Link
            href="/minhas-listas"
            aria-label="Minhas listas"
            className="grid h-10 w-10 place-items-center rounded-full text-texto hover:bg-white/10 sm:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
            </svg>
          </Link>
        )}

        {!accountsEnabled ? null : userEmail ? (
          <div ref={menuRef} className="relative">
            <button
              ref={buttonRef}
              type="button"
              aria-label="Conta"
              aria-expanded={menuOpen}
              onClick={() => setOpenPath(menuOpen ? null : pathname)}
              className="grid h-10 w-10 place-items-center rounded-full text-texto hover:bg-white/10"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-lg bg-sala p-3 text-sm shadow-lg ring-1 ring-white/10">
                <p className="truncate pb-3 text-texto/70">{userEmail}</p>
                <form action={signOutAction}>
                  <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-texto hover:bg-white/10">
                    Sair
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link href="/entrar" className="rounded-full px-4 py-2 text-sm font-semibold text-texto hover:bg-white/10">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
