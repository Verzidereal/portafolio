export type Project = {
  title: string;
  description: string;
  year?: number;
  stack: string[];      // lenguajes / frameworks
  hosting?: string;     // Cloudflare Pages, Vultr, etc.
  link?: string;        // Demo / producción
  repo?: string;        // GitHub
  cover?: string;       // /assets/projects/archivo.jpg (opcional)
};

export const projects: Project[] = [
  {
    title: "Portafolio Verzide",
    description: "Sitio personal con Astro + React + Tailwind. Animaciones suaves y SEO básico.",
    year: 2025,
    stack: ["Astro", "React", "Tailwind"],
    hosting: "Cloudflare Pages",
    link: "https://verzide.com",
    repo: "https://github.com/Verzidereal/portafolio"
  },
  {
    title: "Landing de Agencia (oscura)",
    description: "Landing minimalista con microinteracciones y formulario.",
    year: 2024,
    stack: ["HTML", "Tailwind", "JS"],
    hosting: "Cloudflare Pages",
    link: "#",
    repo: "https://github.com/Verzidereal/landing-agencia"
  },
  {
    title: "Dashboard Admin",
    description: "Tableros, gráficas y filtros accesibles.",
    year: 2024,
    stack: ["Vite", "React", "Tailwind"],
    hosting: "Vultr (Nginx)",
    link: "#",
    repo: "https://github.com/Verzidereal/dashboard-admin"
  }
  // ← Agrega aquí más proyectos reales (titulo, desc, stack, hosting, link, repo)
];
