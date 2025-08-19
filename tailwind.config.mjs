/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0b0f',
        card: '#11131a',
        accent: '#6ea8fe'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,.25)'
      }
    }
  },
  plugins: []
};
