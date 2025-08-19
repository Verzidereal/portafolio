import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-bg/70 border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/assets/img/avatar.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-semibold tracking-wide">Verzide</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-zinc-300">
          <a className="hover:text-white transition" href="#proyectos">Proyectos</a>
          <a className="hover:text-white transition" href="#sobre-mi">Sobre mí</a>
          <a className="hover:text-white transition" href="#contacto">Contacto</a>
        </nav>

        {/* Hamburger (mobile) */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-white/5"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {open ? (
              <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeWidth="2" strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden border-t border-white/5 ${open ? "block" : "hidden"}`}>
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 text-zinc-300">
          <a className="hover:text-white transition" href="#proyectos" onClick={() => setOpen(false)}>Proyectos</a>
          <a className="hover:text-white transition" href="#sobre-mi" onClick={() => setOpen(false)}>Sobre mí</a>
          <a className="hover:text-white transition" href="#contacto" onClick={() => setOpen(false)}>Contacto</a>
        </nav>
      </div>
    </header>
  );
}
