"use client";

import { useRef } from "react";

function Arrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
      className={`absolute inset-y-0 z-10 hidden w-12 items-center justify-center bg-sala/60 text-texto opacity-0 transition-opacity group-hover/row:opacity-100 hover:bg-sala/80 md:flex ${
        dir === "left" ? "left-0" : "right-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d={dir === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Trilho horizontal: arrasta no celular, setas no desktop. */
export function ShelfRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (sign: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: sign * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="group/row relative">
      <Arrow dir="left" onClick={() => scroll(-1)} />
      <div ref={ref} className="no-scrollbar flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 py-2 md:scroll-px-12 md:px-12">
        {children}
      </div>
      <Arrow dir="right" onClick={() => scroll(1)} />
    </div>
  );
}
