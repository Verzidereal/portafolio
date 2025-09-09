import React, { useMemo, useState } from "react";

/**
 * Solo Leveling — Recomendador con OCR (8 piezas + Builds + Escalado por personaje)
 *
 * • Basado en tus capturas: soporta efectos como Ataque/Defensa/PS adicionales, (%)
 *   Aumento de daño, Índice de golpe crítico, Reducción de daño, Penetración de defensa,
 *   PM adicionales, Reducción de consumo de PM, Aumento de índice de recuperación de PM (%),
 *   y Daño elemental (agua/fuego/luz/oscuridad/viento).
 * • Selecciona Personaje, Elemento, Rol, Escenario y Tipo de Escalado del daño (ATK / DEF / PS).
 * • Sube las 8 piezas: yelmo, armadura, guantes, botas, collar, pulsera, anillo, pendientes.
 * • OCR (eng+spa) por pieza, edición manual, puntuación por pieza y del conjunto (0–100, S/A/B/C/D).
 * • Recomendaciones por slot y pesos generados por el build + escalado.
 */

// ===================== Tipos y constantes =====================
export type SlotName =
  | "Yelmo"
  | "Armadura"
  | "Guantes"
  | "Botas"
  | "Collar"
  | "Pulsera"
  | "Anillo"
  | "Pendientes";

const SLOTS: SlotName[] = [
  "Yelmo",
  "Armadura",
  "Guantes",
  "Botas",
  "Collar",
  "Pulsera",
  "Anillo",
  "Pendientes",
];

// Stats soportadas (incluye las de tus screenshots)
const ALL_STATS = [
  "atkPct",
  "atkFlat",
  "defPct",
  "defFlat",
  "hpPct", // PS (%)
  "hpFlat", // PS adicionales
  "critRate", // Índice de golpe crítico
  "critDmg",
  "speed",
  "elemDmg", // Daño elemental (agua/fuego/luz/oscuridad/viento)
  "dmgBoost", // Aumento de daño
  "defPen", // Penetración de defensa
  "damageReductionPct", // Reducción de daño
  "mpFlat", // PM adicionales
  "mpCostReductionPct", // Reducción de consumo de PM
  "mpRecoveryPct", // Aumento índice recuperación de PM (%)
] as const;

type StatKey = typeof ALL_STATS[number];

const LABELS: Record<StatKey, string> = {
  atkPct: "Ataque (%)",
  atkFlat: "Ataque adicional",
  defPct: "Defensa (%)",
  defFlat: "Defensa adicional",
  hpPct: "PS (%)",
  hpFlat: "PS adicionales",
  critRate: "Índice de golpe crítico",
  critDmg: "Daño crítico",
  speed: "Velocidad (SPD)",
  elemDmg: "Daño elemental",
  dmgBoost: "Aumento de daño",
  defPen: "Penetración de defensa",
  damageReductionPct: "Reducción de daño",
  mpFlat: "PM adicionales",
  mpCostReductionPct: "Reducción de consumo de PM",
  mpRecoveryPct: "Recuperación de PM (%)",
};

// Alias para detectar stats (ES/EN)
const STAT_ALIASES: Record<StatKey, RegExp[]> = {
  atkPct: [/\bATK\s*%\b/i, /\bATQ\s*%\b/i, /Ataque\s*%/i],
  atkFlat: [/\bATK(?!\s*%)/i, /\bATQ(?!\s*%)/i, /Ataque\s+adicional/i],
  defPct: [/\bDEF\s*%\b/i, /Defensa\s*%/i],
  defFlat: [/\bDEF(?!\s*%)/i, /Defensa\s+adicional/i],
  hpPct: [/\bHP\s*%\b/i, /PS\s*%/i, /Vida\s*%/i],
  hpFlat: [/\bHP(?!\s*%)/i, /PS\s+adicionales/i, /Vida(?!\s*%)/i],
  critRate: [/Índice\s+de\s+golpe\s+cr[ií]tico/i, /Prob\.?\s*Cr[ií]tica/i, /Crit\s*Rate/i],
  critDmg: [/Daño\s*Cr[ií]tico/i, /CRIT\s*DMG/i],
  speed: [/Velocidad/i, /\bSPD\b/i, /Speed/i],
  elemDmg: [/Daño\s+elemental\s+de\s+(agua|fuego|luz|oscuridad|viento)/i, /Elemental\s*Damage/i],
  dmgBoost: [/Aumento\s+de\s+dañ[oa]/i, /Damage\s*Increase/i],
  defPen: [/Penetraci[oó]n\s*de\s*defensa/i, /Defense\s*Penetration/i],
  damageReductionPct: [/Reducci[oó]n\s+de\s+dañ[oa]/i, /Damage\s*Reduction/i],
  mpFlat: [/PM\s+adicionales/i, /MP\s+\+?\d+/i],
  mpCostReductionPct: [/Reducci[oó]n\s+de\s+consumo\s+de\s+PM/i, /MP\s*Cost\s*Reduction/i],
  mpRecoveryPct: [/recuperaci[oó]n\s+de\s+PM\s*\(\%\)|Aumento\s+de\s+índice\s+de\s+recuperaci[oó]n\s+de\s+PM\s*\(\%\)/i, /MP\s*Recovery\s*Rate/i],
};

// Benchmarks por pieza (ajusta a tu meta)
const DEFAULT_BENCH: Record<StatKey, number> = {
  atkPct: 10,
  atkFlat: 50,
  defPct: 10,
  defFlat: 20,
  hpPct: 10,
  hpFlat: 200,
  critRate: 10,
  critDmg: 20,
  speed: 5,
  elemDmg: 10,
  dmgBoost: 10,
  defPen: 1000,
  damageReductionPct: 10,
  mpFlat: 50,
  mpCostReductionPct: 10,
  mpRecoveryPct: 10,
};

const ROLES = ["Tanque", "Luchador", "Mago", "Asesino", "Breaker", "Sanador"] as const;
const ELEMENTOS = ["Luz", "Oscuridad", "Agua", "Fuego", "Viento"] as const;
const ESCENARIOS = ["Historia", "Campo de batalla", "Jefe de gremio", "Taller de luz", "PvP", "Otros"] as const;
const SCALINGS = ["ATK", "DEF", "PS"] as const; // cómo escala el daño del personaje

type Rol = typeof ROLES[number];
type Elemento = typeof ELEMENTOS[number];
type Escenario = typeof ESCENARIOS[number];
type Scaling = typeof SCALINGS[number];

// Algunos perfiles de ejemplo (editables):
const CHARACTER_PRESETS: Record<string, { element?: Elemento; defaultRol?: Rol; scaling: Scaling } > = {
  "Seorin": { element: "Agua", defaultRol: "Breaker", scaling: "PS" },
  "Cha Hae-In": { element: "Agua", defaultRol: "Luchador", scaling: "DEF" },
  "Lennart Niermann": { element: "Viento", defaultRol: "Luchador", scaling: "DEF" },
};

// ===================== Utilidades =====================
function normalizeNumber(n: string): number | null {
  if (!n) return null;
  const clean = n.replace(/[^0-9,.-]/g, "").replace(/,(?=\d{1,2}\b)/g, ".");
  const num = parseFloat(clean);
  return isFinite(num) ? num : null;
}

function detectStatKey(line: string): StatKey | null {
  for (const k of ALL_STATS) for (const r of STAT_ALIASES[k]) if (r.test(line)) return k;
  if (/HP|PS/i.test(line) && /%/.test(line)) return "hpPct";
  if (/(ATK|ATQ|Ataque)/i.test(line) && /%/.test(line)) return "atkPct";
  if (/(DEF|Defensa)/i.test(line) && /%/.test(line)) return "defPct";
  return null;
}

function clamp(n:number,a:number,b:number){return Math.max(a,Math.min(b,n));}
function toGrade(s:number):"S"|"A"|"B"|"C"|"D"{return s>=85?"S":s>=70?"A":s>=55?"B":s>=40?"C":"D";}

// ===================== Modelos =====================
export type Artifact = {
  slot: SlotName;
  imageUrl: string | null;
  rawText: string;
  busy: boolean;
  progress: number;
  stats: Partial<Record<StatKey, number>>;
};

function emptyArtifact(slot: SlotName): Artifact { return { slot, imageUrl: null, rawText: "", busy: false, progress: 0, stats: {} }; }

// ===================== OCR =====================
async function runOCROnUrl(url: string, onProgress?: (p:number)=>void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+spa", 1, { logger: (m:any)=>{ if(m.status==="recognizing text"&&typeof m.progress==="number") onProgress?.(Math.round(m.progress*100)); } });
  try { const { data } = await worker.recognize(url); return data.text||""; } finally { await worker.terminate(); }
}

function parseStatsFromText(text: string): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
  for (const line of lines) {
    const k = detectStatKey(line); if(!k) continue;
    const m = line.match(/([-+]?\d{1,4}(?:[.,]\d{1,2})?)\s*%?/); const v = m? normalizeNumber(m[1]) : null; if(v==null) continue;
    if (out[k]==null || v>(out[k] as number)) out[k]=v; // guarda el mayor por si hay ruido
  }
  return out;
}

// ===================== Pesos recomendados =====================
function mergeWeights(...parts: Array<Partial<Record<StatKey, number>>>): Partial<Record<StatKey, number>> {
  const r: Partial<Record<StatKey, number>> = {}; for (const p of parts) for (const k of Object.keys(p) as StatKey[]) r[k] = (r[k]||0) + (p[k]||0); return r;
}

function scalingWeights(s: Scaling): Partial<Record<StatKey, number>> {
  switch(s){
    case "PS": return { hpPct:1.0, hpFlat:0.7, critRate:0.7, critDmg:0.8, dmgBoost:0.7, speed:0.5 };
    case "DEF": return { defPct:1.0, defFlat:0.6, critRate:0.6, critDmg:0.7, defPen:0.6, dmgBoost:0.5 };
    case "ATK": default: return { atkPct:1.0, atkFlat:0.6, critRate:1.0, critDmg:1.0, dmgBoost:0.7, speed:0.5 };
  }
}

function roleWeights(rol: Rol): Partial<Record<StatKey, number>> {
  switch(rol){
    case "Tanque": return { hpPct:1.0, defPct:1.0, damageReductionPct:0.8, speed:0.6, defFlat:0.3 };
    case "Luchador": return { atkPct:0.9, critRate:1.0, critDmg:1.0, speed:0.6, defPen:0.5, dmgBoost:0.6 };
    case "Mago": return { elemDmg:1.0, skillHaste:0.0 /*placeholder*/, critRate:0.7, critDmg:0.8, atkPct:0.6, mpRecoveryPct:0.6, mpCostReductionPct:0.4 } as any;
    case "Asesino": return { speed:1.0, critRate:1.0, critDmg:1.0, atkPct:0.8, defPen:0.6 };
    case "Breaker": return { defPen:1.1, dmgBoost:0.8, atkPct:0.7, speed:0.5, critRate:0.6, critDmg:0.7 };
    case "Sanador": return { mpRecoveryPct:1.0, hpPct:0.8, speed:0.8, mpCostReductionPct:0.6, dmgBoost:0.3 };
  }
}

function elementWeights(elem: Elemento): Partial<Record<StatKey, number>> {
  return { elemDmg: 0.4 }; // impulso genérico al daño elemental
}

function scenarioWeights(esc: Escenario): Partial<Record<StatKey, number>> {
  switch(esc){
    case "Jefe de gremio": return { critDmg:0.3, atkPct:0.2, defPen:0.3, dmgBoost:0.3 };
    case "Campo de batalla": return { speed:0.4, hpPct:0.2, defPct:0.2, damageReductionPct:0.2 };
    case "Taller de luz": return { elemDmg:0.4, speed:0.1 };
    case "PvP": return { speed:0.4, critRate:0.2, damageReductionPct:0.3 };
    case "Historia": default: return {};
  }
}

function topStatsByWeight(weights: Partial<Record<StatKey, number>>, n=3): StatKey[] { return [...ALL_STATS].sort((a,b)=> (weights[b]||0)-(weights[a]||0)).slice(0,n); }

function scoreValues(values: Partial<Record<StatKey, number>>, weights: Partial<Record<StatKey, number>>, bench: Record<StatKey, number>, pieces=1){
  let sw=0, sws=0; for (const k of ALL_STATS){ const w=weights[k]||0; if(w<=0) continue; const v=values[k]||0; const b=(bench[k]||0)*pieces; if(b<=0) continue; const norm=clamp(v/b,0,1.25); sw += norm*w; sws += w; } const s = sws>0 ? clamp((sw/sws)*100, 0, 100) : 0; return Math.round(s);
}

// ===================== Componente principal =====================
export default function ArtifactBuildsOCR(){
  // Build actual
  const [character, setCharacter] = useState<string>("");
  const [elemento, setElemento] = useState<Elemento>("Agua");
  const [rol, setRol] = useState<Rol>("Luchador");
  const [escenario, setEscenario] = useState<Escenario>("Historia");
  const [scaling, setScaling] = useState<Scaling>("ATK");

  // Pesos y benchmarks
  const [weights, setWeights] = useState<Partial<Record<StatKey, number>>>(mergeWeights(roleWeights("Luchador"), scalingWeights("ATK")));
  const [bench, setBench] = useState<Record<StatKey, number>>({ ...DEFAULT_BENCH });

  // Piezas
  const [arts, setArts] = useState<Artifact[]>(SLOTS.map(s=>emptyArtifact(s)));
  const [debug, setDebug] = useState<boolean[]>(Array(SLOTS.length).fill(false));

  function applyCharacterPreset(name: string){
    setCharacter(name);
    const p = CHARACTER_PRESETS[name];
    if(!p) return; // personaje libre
    if(p.element) setElemento(p.element);
    if(p.defaultRol) setRol(p.defaultRol);
    setScaling(p.scaling);
  }

  function applyBuild(){ setWeights( mergeWeights( scalingWeights(scaling), roleWeights(rol), elementWeights(elemento), scenarioWeights(escenario) ) ); }

  function updateArt(i:number, patch: Partial<Artifact>){ setArts(arr=> arr.map((a,idx)=> idx===i?{...a,...patch}:a)); }

  function onFile(i:number, file: File){ const url=URL.createObjectURL(file); updateArt(i,{imageUrl:url,busy:true,progress:0,rawText:""}); runOCROnUrl(url,(p)=>updateArt(i,{progress:p})).then(text=>{ const parsed = parseStatsFromText(text); updateArt(i,{rawText:text,stats:parsed}); }).catch(e=>{ console.error(e); alert("Error al ejecutar OCR. Intenta con otra imagen o recórtala mejor."); }).finally(()=> updateArt(i,{busy:false})); }

  // Sumatoria del set
  const aggregate = useMemo(()=>{ const sum: Partial<Record<StatKey, number>> = {}; for(const k of ALL_STATS) sum[k]=0; for(const a of arts) for(const k of ALL_STATS) sum[k]! += a.stats[k]||0; return sum; }, [arts]);

  const setScore = useMemo(()=> scoreValues(aggregate, weights, bench, 8), [aggregate, weights, bench]);
  const setGrade = useMemo(()=> toGrade(setScore), [setScore]);
  const top3 = useMemo(()=> topStatsByWeight(weights,3), [weights]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Builds + OCR — 8 piezas con escalado por personaje</h1>
          <p className="text-slate-300 mt-2">Ejemplo: Seorin escala con PS; Cha Hae-In y Lennart con DEF. Ajusta build y sube tus piezas.</p>
        </header>

        {/* Configuración del build */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="text-sm text-slate-400">Personaje</label>
              <div className="flex gap-2 mt-1">
                <select onChange={(e)=>applyCharacterPreset(e.target.value)} className="w-1/2 bg-transparent border border-slate-700 rounded-lg px-3 py-2">
                  <option className="bg-slate-900" value="">(Personalizado)</option>
                  {Object.keys(CHARACTER_PRESETS).map(n=> (<option key={n} value={n} className="bg-slate-900">{n}</option>))}
                </select>
                <input value={character} onChange={(e)=>setCharacter(e.target.value)} placeholder="o escribe el nombre" className="flex-1 bg-transparent border border-slate-700 rounded-lg px-3 py-2"/>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400">Elemento</label>
              <select value={elemento} onChange={(e)=>setElemento(e.target.value as Elemento)} className="mt-1 w-full bg-transparent border border-slate-700 rounded-lg px-3 py-2">{[...ELEMENTOS].map(x=> <option key={x} value={x} className="bg-slate-900">{x}</option>)}</select>
            </div>
            <div>
              <label className="text-sm text-slate-400">Rol</label>
              <select value={rol} onChange={(e)=>setRol(e.target.value as Rol)} className="mt-1 w-full bg-transparent border border-slate-700 rounded-lg px-3 py-2">{[...ROLES].map(x=> <option key={x} value={x} className="bg-slate-900">{x}</option>)}</select>
            </div>
            <div>
              <label className="text-sm text-slate-400">Escenario</label>
              <select value={escenario} onChange={(e)=>setEscenario(e.target.value as Escenario)} className="mt-1 w-full bg-transparent border border-slate-700 rounded-lg px-3 py-2">{[...ESCENARIOS].map(x=> <option key={x} value={x} className="bg-slate-900">{x}</option>)}</select>
            </div>
            <div>
              <label className="text-sm text-slate-400">Escala con…</label>
              <select value={scaling} onChange={(e)=>setScaling(e.target.value as Scaling)} className="mt-1 w-full bg-transparent border border-slate-700 rounded-lg px-3 py-2">{[...SCALINGS].map(x=> <option key={x} value={x} className="bg-slate-900">{x}</option>)}</select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <button onClick={applyBuild} className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-400">Aplicar recomendaciones</button>
            <div className="text-sm text-slate-400">Top stats sugeridos: <span className="text-slate-200 font-medium ml-1">{top3.map(k=>LABELS[k]).join(', ')}</span></div>
          </div>
        </section>

        {/* Grid de piezas */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {arts.map((a,i)=> (
            <PieceCard key={i} idx={i} art={a} bench={bench} weights={weights}
              debug={debug[i]}
              onDebug={(v)=> setDebug(d=> d.map((x,j)=> j===i? v : x))}
              onPatch={(patch)=> updateArt(i, patch)}
              onFile={(f)=> onFile(i,f)}
            />
          ))}
        </section>

        {/* Resultado del set */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-3">Resultado del conjunto</h2>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-6xl font-black mb-1">{setScore}</div>
              <div className="text-sm uppercase tracking-wide text-slate-400">Puntuación total</div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700"><span className="text-lg font-bold">Rango {setGrade}</span></div>
            </div>
            <div className="mt-5">
              <h3 className="font-semibold mb-2">Stats sumadas (8 piezas)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_STATS.map(k=> (
                  <div key={k} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{LABELS[k]}</div>
                    <div className="text-lg font-semibold">{fmtStat(k, aggregate[k]||0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benchmarks por pieza */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-semibold mb-3">Benchmarks por pieza</h2>
            <p className="text-xs text-slate-400 mb-3">Se multiplican ×8 para evaluar el set.</p>
            <div className="grid grid-cols-2 gap-3">
              {ALL_STATS.map(k=> (
                <div key={k} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">{LABELS[k]}</div>
                  <input type="number" step={0.1} value={bench[k]} onChange={(e)=> setBench(b=> ({...b, [k]: Number(e.target.value||0)}))}
                    className="mt-1 w-full bg-transparent outline-none border border-slate-700 focus:border-slate-400 rounded-lg px-2 py-1"/>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-semibold mb-3">Consejos y siguientes pasos</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
              <li>Para Seorin, prioriza PS%/PS plano + Aumento de daño + CRIT; los pesos ya reflejan el escalado por PS.</li>
              <li>Para escalado por DEF (Hae-In/Lennart), sube DEF%/DEF plano + CRIT y Penetración de defensa.</li>
              <li>Si usas magos o sanadores, mejora PM (recuperación/consumo) y velocidad.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

// ===================== Subcomponente de pieza =====================
function PieceCard({ idx, art, bench, weights, debug, onDebug, onPatch, onFile }:{
  idx: number; art: Artifact; bench: Record<StatKey, number>; weights: Partial<Record<StatKey, number>>; debug: boolean; onDebug: (v:boolean)=>void; onPatch: (p: Partial<Artifact>)=>void; onFile: (f: File)=>void; }){
  const pieceScore = useMemo(()=> scoreValues(art.stats, weights, bench, 1), [art.stats, weights, bench]);
  const grade = useMemo(()=> toGrade(pieceScore), [pieceScore]);
  const isGood = pieceScore >= 70;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{idx+1}) {art.slot}</h2>
        <div className={`text-xs px-2 py-1 rounded border ${isGood? 'border-emerald-400 text-emerald-400':'border-slate-500 text-slate-300'}`}>{isGood? 'BUENO para el build':'Regular'}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uploader */}
        <div>
          <label className="text-sm text-slate-400">Imagen del artefacto</label>
          <label htmlFor={`file-${idx}`} className="mt-1 block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer border-slate-700 hover:border-slate-500 transition">
            <input id={`file-${idx}`} type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onFile(f); }} />
            <div className="space-y-2"><div className="text-lg">Arrastra y suelta o haz click</div><div className="text-sm text-slate-400">PNG/JPG — Ideal: recortar solo el panel</div></div>
          </label>
          {art.imageUrl && (<div className="mt-4"><img src={art.imageUrl} alt={`preview-${idx}`} className="rounded-xl max-h-[320px] object-contain w-full bg-black/20" /></div>)}
          {art.busy && (<div className="mt-4"><div className="text-sm text-slate-300 mb-2">OCR… {art.progress}%</div><div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-slate-300" style={{ width: `${art.progress}%` }} /></div></div>)}
          <div className="mt-4 flex items-center gap-3"><input id={`debug-${idx}`} type="checkbox" className="accent-slate-300" checked={debug} onChange={(e)=>onDebug(e.target.checked)} /><label htmlFor={`debug-${idx}`} className="text-sm text-slate-300">Mostrar texto crudo del OCR</label></div>
          {debug && (<pre className="mt-3 max-h-40 overflow-auto text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-3 whitespace-pre-wrap">{art.rawText || "(sin texto aún)"}</pre>)}
        </div>

        {/* Stats detectadas / edición */}
        <div>
          <div className="flex items-center justify-between mb-2"><h3 className="text-sm text-slate-400">Estadísticas (edita si es necesario)</h3><div className="text-xs text-slate-400">Puntuación: <span className={`font-semibold ${isGood? 'text-emerald-400':'text-slate-200'}`}>{pieceScore}</span> • Rango {grade}</div></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_STATS.map(k=> (
              <div key={k} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">{LABELS[k]}</div>
                <input type="number" step={0.1} placeholder="0" value={art.stats[k] ?? ''} onChange={(e)=> onPatch({ stats: { ...art.stats, [k]: e.target.value===''? undefined : Number(e.target.value) } })} className="mt-1 w-full bg-transparent outline-none border border-slate-700 focus:border-slate-400 rounded-lg px-2 py-1" />
                <div className="text-[10px] text-slate-500 mt-1">{(k.endsWith('Pct') || k==='critRate' || k==='critDmg' || k==='elemDmg' || k==='dmgBoost' || k==='mpCostReductionPct' || k==='mpRecoveryPct' || k==='damageReductionPct') ? '%' : 'plano'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-300"><span className="text-slate-400">Prioriza en esta pieza:</span> {topStatsByWeight(weights).map(k=> LABELS[k]).join(', ')}</div>
    </div>
  );
}

// ===================== Helpers =====================
function fmtStat(k: StatKey, v: number){ if (k.endsWith('Pct') || k==='critRate' || k==='critDmg' || k==='elemDmg' || k==='dmgBoost' || k==='mpCostReductionPct' || k==='mpRecoveryPct' || k==='damageReductionPct') return `${v.toFixed(2)}%`; return `${Math.round(v)}`; }
