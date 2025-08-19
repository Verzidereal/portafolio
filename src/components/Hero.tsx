export default function Hero() {
  return (
    <section className="py-16 md:py-24">
      <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
        Portafolio <span className="text-accent">oscuro</span> y profesional
      </h1>
      <p className="mt-4 text-zinc-300 max-w-2xl">
        Diseño limpio, microinteracciones suaves y rendimiento.
      </p>
      <div className="mt-8 flex gap-3">
        <a href="#proyectos" className="px-5 py-3 rounded-xl bg-accent text-black font-medium hover:opacity-90 transition">Ver proyectos</a>
        <a href="#contacto" className="px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 transition">Contacto</a>
      </div>
    </section>
  );
}
