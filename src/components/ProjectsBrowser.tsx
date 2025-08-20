import { useMemo, useState } from "react";
import type { Project } from "../data/projects";
import { projects as RAW } from "../data/projects";

type Filters = {
  stacks: Set<string>;
  hosts: Set<string>;
  q: string;
};

function intersect(a: Set<string>, b: string[] = []) {
  if (a.size === 0) return true;
  return b.some((x) => a.has(x));
}

export default function ProjectsBrowser() {
  // Normaliza y ordena por año desc
  const projects = useMemo<Project[]>(() => {
    return [...RAW].sort((a, b) => (b.year || 0) - (a.year || 0));
  }, []);

  // Catálogos
  const allStacks = useMemo<string[]>(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.stack.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const allHosts = useMemo<string[]>(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.hosting && s.add(p.hosting));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  // Estado de filtros
  const [filters, setFilters] = useState<Filters>({
    stacks: new Set<string>(),
    hosts: new Set<string>(),
    q: "",
  });

  const toggleStack = (name: string) =>
    setFilters((f) => {
      const next = new Set(f.stacks);
      next.has(name) ? next.delete(name) : next.add(name);
      return { ...f, stacks: next };
    });

  const toggleHost = (name: string) =>
    setFilters((f) => {
      const next = new Set(f.hosts);
      next.has(name) ? next.delete(name) : next.add(name);
      return { ...f, hosts: next };
    });

  const clearAll = () =>
    setFilters({ stacks: new Set(), hosts: new Set(), q: "" });

  // Filtrado
  const filtered = projects.filter((p) => {
    const byStack = intersect(filters.stacks, p.stack);
    const byHost =
      filters.hosts.size === 0 || (p.hosting && filters.hosts.has(p.hosting));
    const byQuery =
      !filters.q ||
      [p.title, p.description, ...(p.stack || []), p.hosting || ""]
        .join(" ")
        .toLowerCase()
        .includes(filters.q.toLowerCase());
    return byStack && byHost && byQuery;
  });

  return (
    <section className="space-y-5">
      {/* Barra de filtros */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-3">
          {/* Búsqueda */}
          <div className="flex items-center gap-3">
            <input
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Buscar por título, stack o hosting…"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 outline-none focus:border-accent"
              aria-label="Buscar proyectos"
            />
            <button
              onClick={clearAll}
              className="shrink-0 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20"
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          </div>

          {/* Stacks */}
          <div>
            <div className="text-sm text-zinc-400 mb-2">Tecnologías</div>
            <div className="flex flex-wrap gap-2">
              {allStacks.map((s) => {
                const on = filters.stacks.has(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleStack(s)}
                    className={`chip chip--filter ${on ? "chip--on" : ""}`}
                    aria-pressed={on}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hosting */}
          {allHosts.length > 0 && (
            <div>
              <div className="text-sm text-zinc-400 mb-2">Hosting</div>
              <div className="flex flex-wrap gap-2">
                {allHosts.map((h) => {
                  const on = filters.hosts.has(h);
                  return (
                    <button
                      key={h}
                      onClick={() => toggleHost(h)}
                      className={`chip chip--filter ${on ? "chip--on" : ""}`}
                      aria-pressed={on}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((p) => (
          <article key={p.title} className="card hover:border-accent transition flex flex-col">
            {p.cover && (
              <img
                src={p.cover}
                alt={p.title}
                loading="lazy"
                className="mb-4 rounded-xl border border-white/10 w-full object-cover aspect-[16/9]"
              />
            )}

            <header className="flex items-start justify-between gap-3">
              <h3 className="card-title">{p.title}</h3>
              {p.year && <span className="text-xs text-zinc-400">{p.year}</span>}
            </header>

            <p className="mt-2 text-zinc-400">{p.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
              {p.hosting && <span className="chip">Hosting: {p.hosting}</span>}
            </div>

            <div className="mt-5 flex gap-2">
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener"
                  className="px-3 py-2 rounded-lg bg-accent text-black text-sm font-medium hover:opacity-90 transition"
                >
                  Ver sitio
                </a>
              )}
              {p.repo && (
                <a
                  href={p.repo}
                  target="_blank"
                  rel="noopener"
                  className="px-3 py-2 rounded-lg border border-white/10 text-sm hover:border-white/20 transition"
                >
                  Código
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-zinc-400 text-sm">No hay proyectos que coincidan con los filtros.</div>
      )}
    </section>
  );
}
