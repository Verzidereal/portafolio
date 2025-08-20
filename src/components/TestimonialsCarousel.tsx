import { useEffect, useRef, useState } from "react";

type Item = {
  name: string;
  role?: string;
  quote: string;
  avatar?: string; // /assets/testimonials/nombre.jpg (opcional)
  stars?: number;  // 1..5 (default 5)
};

type Props = {
  items: Item[];
  title?: string;
  intervalMs?: number;   // autoplay (default 5000)
  pauseOnHover?: boolean; // default true
};

export default function TestimonialsCarousel({
  items,
  title = "Testimonios",
  intervalMs = 5000,
  pauseOnHover = true,
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const len = items.length;
  const go = (i: number) => setIndex((i + len) % len);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  // autoplay
  useEffect(() => {
    if (len <= 1) return;
    if (paused) return;
    const id = setInterval(next, intervalMs);
    return () => clearInterval(id);
  }, [index, paused, intervalMs, len]);

  // keyboard support (← →)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onTouchStart: React.TouchEventHandler = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd: React.TouchEventHandler = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const THRESHOLD = 40;
    if (dx < -THRESHOLD) next();
    if (dx > THRESHOLD) prev();
    touchStartX.current = null;
  };

  return (
    <section
      id="testimonios"
      aria-roledescription="carousel"
      aria-label="Carrusel de testimonios"
      className="py-10 md:py-14"
    >
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">{title}</h2>

      <div
        className="relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
        onMouseEnter={() => pauseOnHover && setPaused(true)}
        onMouseLeave={() => pauseOnHover && setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live="polite"
        >
          {items.map((t, i) => (
            <div key={i} className="w-full shrink-0 p-5 md:p-6">
              <figure className="card p-5 md:p-6 h-full">
                {/* stars */}
                <div className="mb-3 flex gap-1 text-accent">
                  {Array.from({ length: t.stars ?? 5 }).map((_, s) => (
                    <svg key={s} viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                      <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.8 5.06 16.7 6 11.2l-4-3.9 5.53-.8L10 1.5z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="text-zinc-200 text-base md:text-lg leading-relaxed">
                  “{t.quote}”
                </blockquote>

                <figcaption className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
                  {t.avatar && (
                    <img
                      src={t.avatar}
                      alt={t.name}
                      width="40" height="40"
                      loading="lazy"
                      className="h-10 w-10 rounded-full border border-white/10 object-cover"
                    />
                  )}
                  <div className="leading-tight">
                    <div className="text-white">{t.name}</div>
                    {t.role && <div>{t.role}</div>}
                  </div>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>

        {/* Flechas */}
        {len > 1 && (
          <>
            <button
              aria-label="Anterior"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/40 hover:bg-black/60 border border-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"><path strokeWidth="2" d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              aria-label="Siguiente"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/40 hover:bg-black/60 border border-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"><path strokeWidth="2" d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}

        {/* Dots */}
        {len > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Ir al slide ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === i ? "bg-accent" : "bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
