// components/VerzideBadge.tsx
export default function VerzideBadge({ className = "w-full max-w-[420px] mx-auto" }) {
  return (
    <svg viewBox="0 0 220 160" role="img" aria-label="Logo Verzide — Huella con V" className={className}>
      <defs>
        <g id="toe"><path d="M0,-32 C -8,-18 -6,-5 0,10 C 6,-5 8,-18 0,-32 Z"/></g>
        <g id="print">
          <use href="#toe" transform="translate(-22,-6) rotate(-18)"/>
          <use href="#toe" transform="translate(0,-10)"/>
          <use href="#toe" transform="translate(22,-6) rotate(18)"/>
          <ellipse cx="0" cy="18" rx="16" ry="10.5"/>
        </g>
        <path id="v" d="M-28,-22 -6,44 6,44 28,-22 17,-22 0,22 -17,-22 Z"/>
        <mask id="m">
          <rect x="0" y="0" width="220" height="160" fill="#000"/>
          <g transform="translate(110,78) scale(1.05)" fill="#fff"><use href="#print"/></g>
          <g transform="translate(110,84) scale(.95)" fill="#000"><use href="#v"/></g>
        </mask>
      </defs>
      <rect x="12" y="12" width="196" height="136" rx="18" fill="#0B1220"/>
      <g mask="url(#m)">
        {/* usa currentColor para que el acento lo controles con CSS/Tailwind */}
        <rect x="12" y="12" width="196" height="136" rx="18" fill="currentColor"/>
      </g>
    </svg>
  );
}
