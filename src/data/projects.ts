export type Project = {
  slug?: string;
  title: string;
  description: string;
  year?: number;
  stack: string[];
  hosting?: string;
  link?: string;
  repo?: string;
  cover?: string;
};

export const projects: Project[] = [
  {
    slug: "portafolio-verzide",
    title: "Portafolio Verzide",
    description: "Sitio personal con Astro + React + Tailwind. Animaciones y SEO básico.",
    year: 2025,
    stack: ["Astro", "React", "Tailwind"],
    hosting: "Cloudflare Pages",
    link: "https://verzide.com",
    repo: "https://github.com/Verzidereal/portafolio",
    // cover: "/assets/projects/portafolio.jpg"
  },
  {
    slug: "jultz-dtf",
    title: "Jultz · Impresión DTF",
    description: "E-commerce para impresión DTF por metro; tienda, carrito y FAQ.",
    year: 2025,
    stack: ["WordPress", "WooCommerce"], // ajústalo si usaste otra cosa
    hosting: "Hostinger Cloud Startup",
    link: "https://jultz.com.mx",
    // cover: "/assets/projects/jultz.jpg"
  },
  {
    slug: "green-world-group",
    title: "Green World (Shop)",
    description: "App de productos naturales (Android/iOS).",
    year: 2024,
    stack: ["Android", "iOS"], // o Flutter/React Native si aplica
    hosting: "Stores",
    link: "https://play.google.com/store/apps/details?id=com.moodle.greenworld",
    // cover: "/assets/projects/greenworld.jpg"
  }
];