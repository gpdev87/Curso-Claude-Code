"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/busca", label: "Buscar" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          {NAV.map((item) => {
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
      </div>
    </header>
  );
}
