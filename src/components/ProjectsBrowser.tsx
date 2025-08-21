import { useMemo, useState } from "react";
import type { Project } from "../data/projects";
import { projects as RAW } from "../data/projects";

type SortKey = "year_desc" | "year_asc" | "title_asc" | "title_desc";

type Filters = {
  stacks: Set<string>;
  hosts: Set<string>;
  years: Set<number>;
  q: string;
  sort: SortKey;
};

function intersect<T>(active: Set<T>, values: T[] = []) {
  if (active.size === 0) return true;
  return values.some((v) => active.has(v));
}

export default function ProjectsBrowser() {
  // Lista base
  const projects = useMemo<Project[]>(() => [...RAW], []);

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

  const allYears = useMemo<number[]>(() => {
    const s = new Set<number>();
    projects.forEach((p) => typeof p.year === "number" && s.add(p.year));
    return Array.from(s).sort((a, b) => b - a); // recientes primero
  }, [projects]);

  // Estado de filtros
  const [filters, setFilters] = useState<Filters>({
    stacks: new Set<string>(),
    hosts: new Set<string>(),
    years: new Set<number>(),
    q: "",
    sort: "year_desc",
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

  const toggleYear = (y: number) =>
    setFilters((f) => {
      const next = new Set(f.years);
      next.has(y) ? next.delete(y) : next.add(y);
      return { ...f, years: next };
    });

  const clearAll = () =>
    setFilters({ stacks: new Set(), hosts: new Set(), years: new Set(), q: "", sort: "year_desc" });

  // Filtrado
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const byStack = intersect(filters.stacks, p.stack);
      const byHost =
        filters.hosts.size === 0 || (p.hosting && filters.hosts.has(p.hosting));
      const byYear =
        filters.years.size === 0 || (typeof p.year === "number" && filters.years.has(p.year));
      const byQuery =
        !filters.q ||
        [p.title, p.description, ...(p.stack || []), p.hosting || "", String(p.year ?? "")]
          .join(" ")
          .toLowerCase()
          .includes(filters.q.toLowerCase());
      return byStack && byHost && byYear && byQuery;
    });
  }, [projects, filters]);

  // Orden
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (filters.sort) {
      case "year_asc":
        return list.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
      case "title_asc":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "title_desc":
        return list.sort((a, b) => b.title.localeCompare(a.title));
      case "year_desc":
      default:
        return list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    }
  }, [filtered, filters.sort]);

  return (
    <section className="space-y-5">
      {/* Barra de filtros */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 overflow-hidden">
        <div className="flex flex-col gap-4">
          {/* Búsqueda + Orden (responsive) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Buscar por título, stack, hosting o año…"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 outline-none focus:border-accent"
              aria-label="Buscar proyectos"
            />

            <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                <label className="hidden sm:block text-sm text-zinc-400 whitespace-nowrap">
                  Ordenar:
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortKey })}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-accent w-full sm:w-auto min-w-0"
                  aria-label="Ordenar proyectos"
                >
                  <option value="year_desc">Año (recientes primero)</option>
                  <option value="year_asc">Año (antiguos primero)</option>
                  <option value="title_asc">Título (A–Z)</option>
                  <option value="title_desc">Título (Z–A)</option>
                </select>
              </div>

              <button
                onClick={clearAll}
                className="w-full sm:w-auto shrink-0 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20"
                title="Limpiar filtros"
              >
                Limpiar
              </button>
            </div>
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

          {/* Años */}
          {allYears.length > 0 && (
            <div>
              <div className="text-sm text-zinc-400 mb-2">Año</div>
              <div className="flex flex-wrap gap-2">
                {allYears.map((y) => {
                  const on = filters.years.has(y);
                  return (
                    <button
                      key={y}
                      onClick={() => toggleYear(y)}
                      className={`chip chip--filter ${on ? "chip--on" : ""}`}
                      aria-pressed={on}
                    >
                      {y}
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
        {sorted.map((p) => (
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
              {typeof p.year === "number" && (
                <span className="text-xs text-zinc-400">{p.year}</span>
              )}
            </header>

            <p className="mt-2 text-zinc-400">{p.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
              {p.hosting && <span className="chip">Hosting: {p.hosting}</span>}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {p.slug && (
                <a
                  href={`/proyectos/${p.slug}`}
                  className="px-3 py-2 rounded-lg border border-white/10 text-sm hover:border-white/20 transition"
                >
                  Detalles
                </a>
              )}
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
      {sorted.length === 0 && (
        <div className="text-zinc-400 text-sm">
          No hay proyectos que coincidan con los filtros.
        </div>
      )}
    </section>
  );
}
