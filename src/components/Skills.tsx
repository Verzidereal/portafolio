// src/components/Skills.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type Skill = {
  name: string;
  level: number; // 0–100
  color: string; // color del relleno de la barra
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

/* ====== ICONOS (livianos) ====== */
const IconAstro: Skill["Icon"] = (props) => (
  <svg viewBox="0 0 256 256" fill="none" {...props}>
    <path d="M128 18l58 178H70L128 18z" fill="#FF5D01" />
    <path
      d="M178 196c0 22-22 40-50 40s-50-18-50-40"
      stroke="#fff"
      strokeWidth={16}
      strokeLinecap="round"
    />
  </svg>
);

const IconReact: Skill["Icon"] = (props) => (
  <svg viewBox="0 0 256 256" fill="none" {...props}>
    <circle cx="128" cy="128" r="18" fill="#61DAFB" />
    <g stroke="#61DAFB" strokeWidth={10} fill="none">
      <ellipse cx="128" cy="128" rx="100" ry="40" />
      <ellipse cx="128" cy="128" rx="100" ry="40" transform="rotate(60 128 128)" />
      <ellipse cx="128" cy="128" rx="100" ry="40" transform="rotate(120 128 128)" />
    </g>
  </svg>
);

const IconTailwind: Skill["Icon"] = (props) => (
  <svg viewBox="0 0 256 256" fill="none" {...props}>
    <path
      d="M128 80c18-24 40-36 66-36 21 0 36 10 46 30-14-12-27-16-40-12-12 4-23 13-33 28-12 18-27 27-46 27-18 0-32-8-42-24 14 12 27 16 40 12 12-4 23-13 33-25Z"
      fill="#38BDF8"
    />
    <path
      d="M74 144c18-24 40-36 66-36 21 0 36 10 46 30-14-12-27-16-40-12-12 4-23 13-33 28-12 18-27 27-46 27-18 0-32-8-42-24 14 12 27 16 40 12 12-4 23-13 33-25Z"
      fill="#38BDF8"
    />
  </svg>
);

const IconTS: Skill["Icon"] = (props) => (
  <svg viewBox="0 0 256 256" {...props}>
    <rect width="256" height="256" rx="28" fill="#3178C6" />
    <path
      d="M60 112h54v20H96v64H78v-64H60v-20Zm146 64c0 18-14 30-36 30-17 0-29-7-35-19l17-10c3 6 9 10 18 10 9 0 14-4 14-10 0-7-6-9-18-12-17-4-28-11-28-27 0-17 14-29 34-29 15 0 26 6 32 17l-16 10c-3-6-8-9-16-9-8 0-12 3-12 8 0 6 5 8 18 11 18 4 30 12 30 30Z"
      fill="#fff"
    />
  </svg>
);

/* ====== DATA ====== */
const SKILLS: Skill[] = [
  { name: "Astro",        level: 90, color: "#FF5D01", Icon: IconAstro },
  { name: "React",        level: 80, color: "#61DAFB", Icon: IconReact },
  { name: "Tailwind CSS", level: 80, color: "#38BDF8", Icon: IconTailwind },
  { name: "TypeScript",   level: 70, color: "#3178C6", Icon: IconTS },
];

/* ====== Hook: in-view (dispara una vez) ====== */
function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ====== Componente ====== */
export default function Skills() {
  const items = useMemo(() => SKILLS, []);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {items.map((s) => (
        <SkillCard key={s.name} skill={s} />
      ))}
    </div>
  );
}

function SkillCard({ skill: s }: { skill: Skill }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <article
      ref={ref}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col items-center"
      aria-label={`Habilidad ${s.name} ${s.level}%`}
    >
      {/* Icono con animación (fade + translate + scale) */}
      <div
        className={[
          "h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center",
          "transform-gpu transition-all duration-700",
          inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-90",
        ].join(" ")}
      >
        <s.Icon className="h-9 w-9" />
      </div>

      {/* Nombre */}
      <div className="mt-3 text-base font-medium text-center">{s.name}</div>

      {/* Barra horizontal con porcentaje dentro */}
      <div
        className="mt-3 w-full h-3 rounded-full bg-white/10 overflow-hidden relative"
        role="progressbar"
        aria-valuenow={s.level}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Nivel en ${s.name}`}
      >
        <span
          className="h-full block rounded-full transition-[width] duration-700 ease-out will-change-[width] relative flex items-center justify-end pr-1"
          style={{ width: inView ? `${s.level}%` : "0%", background: s.color }}
        >
          <span className="text-[10px] leading-none font-semibold text-white drop-shadow">
            {inView ? `${s.level}%` : ""}
          </span>
        </span>
      </div>
    </article>
  );
}
