export default function Hero() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight">
        Portafolio de trabajos realizados por <span className="text-accent"> Minquiz </span> 
      </h1>
      <p className="mt-3 md:mt-4 text-zinc-300 max-w-2xl">
        Diseño limpio, microinteracciones suaves y rendimiento.
      </p>
      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <a href="#proyectos" className="px-5 py-3 rounded-xl bg-accent text-black font-medium text-center hover:opacity-90 transition">Ver proyectos</a>
        <a href="/assets/cv/Verzide-CV.pdf" download className="px-5 py-3 rounded-xl border border-white/10 text-center hover:border-white/20 transition">Descargar CV</a>
      </div>
    </>
  );
}