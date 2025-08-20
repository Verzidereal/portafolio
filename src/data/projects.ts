export type Project = {
  title: string;
  description: string;
  year?: number;
  stack: string[];      // lenguajes / frameworks / plataformas
  hosting?: string;     // proveedor / plataforma
  link?: string;        // Demo / producción
  repo?: string;        // GitHub (si aplica)
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
    repo: "https://github.com/Verzidereal/portafolio",
    // cover: "/assets/projects/portafolio.jpg"
  },
  {
    title: "Jultz · Impresión DTF",
    description: "E-commerce para impresión DTF por metro, con sección de tienda, carrito y FAQ.",
    year: 2025,
    stack: ["WordPress", "WooCommerce"], // si usaste otro, lo cambiamos
    hosting: "—",                        // si recuerdas el proveedor, lo ponemos
    link: "https://jultz.com.mx",
    // repo: "—",
    // cover: "/assets/projects/jultz.jpg"
  },
  {
    title: "Green World Group (App educativa)",
    description: "App móvil de aprendizaje (Android/iOS). *Si te refieres a otra ‘Greenworld’, dime y la adaptamos*.",
    year: 2024,
    stack: ["Android", "iOS"], // si fue Flutter/React Native/otra, me dices y lo afino
    hosting: "Stores",
    link: "https://play.google.com/store/apps/details?id=com.moodle.greenworld",
    // repo: "—",
    // cover: "/assets/projects/greenworld.jpg"
  },
];
