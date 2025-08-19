type Skill = { name: string; level: number }; // 0..100

const skills: Skill[] = [
  { name: "HTML/CSS", level: 90 },
  { name: "Tailwind CSS", level: 85 },
  { name: "JavaScript/TypeScript", level: 80 },
  { name: "React", level: 78 },
  { name: "Astro", level: 82 },
  { name: "UI/Animaciones", level: 88 },
];

export default function Skills() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skills.map((s) => (
        <div key={s.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{s.name}</span>
            <span className="text-zinc-400 text-sm">{s.level}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-2 bg-accent" style={{ width: `${s.level}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
