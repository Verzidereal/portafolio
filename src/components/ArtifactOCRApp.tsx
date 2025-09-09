import React, { useMemo, useState } from "react";
import Tesseract from "tesseract.js";

/**
 * Solo Leveling — Evaluador de Artefactos con OCR (cliente puro)
 *
 * Qué hace:
 * - Permite subir una imagen (screenshot/foto) del artefacto
 * - Extrae texto con OCR (Tesseract.js, eng+spa)
 * - Parsea estadísticas (ATK/ATQ, HP/Vida, DEF/Defensa, CRIT Rate/Prob. Crítica, CRIT DMG/Daño Crítico, Velocidad, Penetración, Celeridad)
 * - Permite editar manualmente lo detectado (porque el OCR nunca es perfecto)
 * - Evalúa el artefacto con perfiles (DPS / Tanque / Soporte / Personalizado) basados en pesos
 * - Muestra una puntuación 0–100 y una calificación (S/A/B/C/D), más sugerencias
 *
 * Notas:
 * - Totalmente cliente: no manda imágenes a servidores
 * - El OCR depende de la calidad / recorte de la imagen. Recomiendo subir un recorte del panel del ítem con buen contraste.
 * - Los benchmarks y pesos son genéricos; ajusta según tu meta/build/personaje.
 */

// ====== Configuración base ======
const STAT_ALIASES: Record<string, RegExp[]> = {
  atkPct: [/\bATK\s*%\b/i, /\bATQ\s*%\b/i, /Ataque\s*%/i],
  atkFlat: [/\bATK\s*[+]?\b/i, /\bATQ\s*[+]?\b/i, /Ataque\s*[+]?/i],
  hpPct: [/\bHP\s*%\b/i, /Vida\s*%/i],
  hpFlat: [/\bHP\s*[+]?\b/i, /Vida\s*[+]?/i],
  defPct: [/\bDEF\s*%\b/i, /Defensa\s*%/i],
  defFlat: [/\bDEF\s*[+]?\b/i, /Defensa\s*[+]?/i],
  critRate: [/CRIT\s*Rate/i, /Prob\.?\s*Cr[ií]tica/i, /Crit\s*Rate/i],
  critDmg: [/CRIT\s*DMG/i, /Daño\s*Cr[ií]tico/i, /Crit\s*DMG/i],
  speed: [/Speed/i, /Velocidad/i, /\bSPD\b/i],
  penetration: [/Penetration/i, /Penetraci[oó]n/i],
  skillHaste: [/Haste/i, /Celeridad/i, /Skill\s*Haste/i],
};

const ALL_STATS = [
  "atkPct",
  "atkFlat",
  "hpPct",
  "hpFlat",
  "defPct",
  "defFlat",
  "critRate",
  "critDmg",
  "speed",
  "penetration",
  "skillHaste",
] as const;

type StatKey = typeof ALL_STATS[number];

// Benchmarks (valor típico "bueno" por substat para normalizar). Ajustables por el usuario.
const DEFAULT_BENCHMARKS: Record<StatKey, number> = {
  atkPct: 10,
  atkFlat: 50,
  hpPct: 10,
  hpFlat: 200,
  defPct: 10,
  defFlat: 20,
  critRate: 10,
  critDmg: 20,
  speed: 5,
  penetration: 8,
  skillHaste: 8,
};

// Perfiles de pesos (ajústalos libremente)
const PRESET_WEIGHTS: Record<string, Partial<Record<StatKey, number>>> = {
  DPS: {
    critRate: 1.0,
    critDmg: 1.1,
    atkPct: 0.9,
    speed: 0.5,
    penetration: 0.6,
    skillHaste: 0.3,
    hpPct: 0.2,
    defPct: 0.2,
  },
  Tanque: {
    hpPct: 1.0,
    defPct: 0.9,
    speed: 0.6,
    atkPct: 0.2,
    critRate: 0.2,
    critDmg: 0.2,
  },
  Soporte: {
    speed: 1.0,
    skillHaste: 1.0,
    hpPct: 0.6,
    atkPct: 0.4,
    defPct: 0.4,
    penetration: 0.4,
    critRate: 0.3,
    critDmg: 0.3,
  },
};

// ====== Utilidades ======
function normalizeNumber(nLike: string): number | null {
  if (!nLike) return null;
  const clean = nLike.replace(/[^0-9,.-]/g, "").replace(/,(?=\d{1,2}\b)/g, ".");
  const num = parseFloat(clean);
  return isFinite(num) ? num : null;
}

function matchStatKey(line: string): StatKey | null {
  for (const key of ALL_STATS) {
    const regs = STAT_ALIASES[key];
    for (const r of regs) if (r.test(line)) return key;
  }
  // Heurística: si contiene "%" y menciona HP/ATK/DEF, prioriza versión %
  if (/HP/i.test(line) && /%/.test(line)) return "hpPct";
  if (/(ATK|ATQ|Ataque)/i.test(line) && /%/.test(line)) return "atkPct";
  if (/(DEF|Defensa)/i.test(line) && /%/.test(line)) return "defPct";
  return null;
}

function toGrade(score: number): "S" | "A" | "B" | "C" | "D" {
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "D";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ====== Componente principal ======
export default function ArtifactOCRApp() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [debug, setDebug] = useState(false);

  // estadísticas detectadas (mapa de stat -> valor numérico)
  const [stats, setStats] = useState<Partial<Record<StatKey, number>>>({});

  // perfiles/ajustes
  const [profileName, setProfileName] = useState<"DPS" | "Tanque" | "Soporte" | "Personalizado">("DPS");
  const [weights, setWeights] = useState<Partial<Record<StatKey, number>>>({ ...PRESET_WEIGHTS["DPS"] });
  const [benchmarks, setBenchmarks] = useState<Record<StatKey, number>>({ ...DEFAULT_BENCHMARKS });

  // Sync preset -> weights
  function applyPreset(name: "DPS" | "Tanque" | "Soporte" | "Personalizado") {
    setProfileName(name);
    if (name === "Personalizado") return;
    setWeights({ ...PRESET_WEIGHTS[name] });
  }

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    runOCR(url);
  }

  async function runOCR(url: string) {
    setBusy(true);
    setProgress(0);
    setRawText("");
    try {
      const result = await Tesseract.recognize(url, "eng+spa", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) setProgress(Math.round(m.progress * 100));
        },
      });
      const text = result.data?.text || "";
      setRawText(text);
      const parsed = parseStatsFromText(text);
      setStats(parsed);
    } catch (e) {
      console.error(e);
      alert("Error al ejecutar OCR. Intenta con otra imagen o recórtala mejor.");
    } finally {
      setBusy(false);
    }
  }

  function parseStatsFromText(text: string): Partial<Record<StatKey, number>> {
    const out: Partial<Record<StatKey, number>> = {};
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const key = matchStatKey(line);
      if (!key) continue;
      // Busca número (con % opcional)
      const numMatch = line.match(/([-+]?\d{1,3}(?:[.,]\d{1,2})?)\s*%?/);
      const value = numMatch ? normalizeNumber(numMatch[1]) : null;
      if (value == null) continue;

      // Si la línea tenía %, asume porcentaje; si el key es flat (ej. atkFlat), deja tal cual
      const isPct = /%/.test(line) || key.endsWith("Pct");
      const final = value; // Guardamos el número puro; la unidad se deduce por el key

      // Mantén el mayor valor visto para la misma stat (por si hay ruido)
      if (out[key] == null || final > (out[key] as number)) {
        out[key] = final;
      }
    }

    return out;
  }

  // Cálculo de puntuación
  const { score, grade, tips } = useMemo(() => {
    // suma ponderada de (valor/benchmark)
    let sumWeighted = 0;
    let sumWeights = 0;

    for (const key of ALL_STATS) {
      const w = weights[key] ?? 0;
      if (w <= 0) continue;
      const v = stats[key];
      const bench = benchmarks[key];
      if (!v || !bench || bench <= 0) continue;
      const norm = clamp(v / bench, 0, 1.25); // permitimos algo >100% por rolls muy altos
      sumWeighted += norm * w;
      sumWeights += w;
    }

    const s = sumWeights > 0 ? clamp((sumWeighted / sumWeights) * 100, 0, 100) : 0;
    const g = toGrade(s);

    // Sugerencias simples (ejemplos)
    const t: string[] = [];
    if ((weights.critRate ?? 0) > 0.6 && (stats.critRate ?? 0) < (benchmarks.critRate * 0.6)) {
      t.push("Tu Prob. Crítica es baja para el perfil seleccionado — busca >= ~60% del benchmark.");
    }
    if ((weights.critDmg ?? 0) > 0.6 && (stats.critDmg ?? 0) < (benchmarks.critDmg * 0.6)) {
      t.push("Tu Daño Crítico podría subir — intenta llegar al benchmark.");
    }
    if ((weights.speed ?? 0) > 0.6 && (stats.speed ?? 0) < (benchmarks.speed * 0.6)) {
      t.push("Te falta Velocidad para el rol — considera piezas con más SPD.");
    }
    if ((weights.skillHaste ?? 0) > 0.6 && (stats.skillHaste ?? 0) < (benchmarks.skillHaste * 0.6)) {
      t.push("La Celeridad es clave en soporte — busca rolls más altos.");
    }

    return { score: Math.round(s), grade: g, tips: t };
  }, [stats, weights, benchmarks]);

  // ====== Render ======
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Evaluador de Artefactos — Solo Leveling (OCR)</h1>
          <p className="text-slate-300 mt-2">Sube una imagen del artefacto para extraer stats y evaluarlo según tu objetivo (DPS, Tanque, Soporte o personalizado).</p>
        </header>

        {/* Uploader */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-semibold mb-3">1) Sube tu imagen</h2>
            <label
              htmlFor="file"
              className="block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer border-slate-700 hover:border-slate-500 transition"
            >
              <input
                id="file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="space-y-2">
                <div className="text-lg">Arrastra y suelta o haz click para elegir</div>
                <div className="text-sm text-slate-400">PNG / JPG — Ideal: recortar solo el panel del artefacto</div>
              </div>
            </label>

            {imageUrl && (
              <div className="mt-4">
                <img src={imageUrl} alt="preview" className="rounded-xl max-h-[360px] object-contain w-full bg-black/20" />
              </div>
            )}

            {busy && (
              <div className="mt-4">
                <div className="text-sm text-slate-300 mb-2">Reconociendo texto… {progress}%</div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <input id="debug" type="checkbox" className="accent-slate-300" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
              <label htmlFor="debug" className="text-sm text-slate-300">Mostrar texto crudo del OCR (debug)</label>
            </div>

            {debug && (
              <pre className="mt-3 max-h-56 overflow-auto text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-3 whitespace-pre-wrap">{rawText || "(sin texto aún)"}</pre>
            )}
          </div>

          {/* Stats detectadas y edición */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-semibold mb-3">2) Revisa y corrige las estadísticas</h2>
            <p className="text-sm text-slate-400 mb-4">El OCR puede fallar; edita manualmente para una evaluación precisa.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_STATS.map((k) => (
                <div key={k} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">{labelFor(k)}</div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={stats[k] ?? ""}
                    onChange={(e) => setStats((s) => ({ ...s, [k]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="mt-1 w-full bg-transparent outline-none border border-slate-700 focus:border-slate-400 rounded-lg px-2 py-1"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">{k.endsWith("Pct") || k === "critRate" || k === "critDmg" ? "%" : "plano"}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Perfiles y pesos */}
        <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 xl:col-span-2">
            <h2 className="text-xl font-semibold mb-3">3) Objetivo y pesos</h2>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {(["DPS", "Tanque", "Soporte", "Personalizado"] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => applyPreset(n)}
                  className={`px-3 py-1.5 rounded-lg border ${profileName === n ? "bg-slate-200 text-slate-900 border-slate-200" : "border-slate-700 hover:border-slate-500"}`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_STATS.map((k) => (
                <div key={k} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-slate-300">{labelFor(k)}</div>
                    <div className="text-xs text-slate-500">Peso: {weights[k] ?? 0}</div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.1}
                    value={weights[k] ?? 0}
                    onChange={(e) => setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-semibold mb-3">4) Resultado</h2>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-6xl font-black tracking-tight mb-2">{score}</div>
              <div className="text-sm uppercase tracking-wide text-slate-400">Puntuación</div>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="text-lg font-bold">Rango {grade}</span>
              </div>
              {tips.length > 0 && (
                <ul className="text-left text-sm text-slate-300 mt-4 list-disc list-inside space-y-1">
                  {tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Benchmarks */}
            <div className="mt-5">
              <h3 className="font-semibold mb-2">Benchmarks (normalización)</h3>
              <p className="text-xs text-slate-400 mb-3">Se usan para convertir cada stat en 0–100% antes de aplicar el peso. Ajusta a tu juego/parche/meta.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_STATS.map((k) => (
                  <div key={k} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{labelFor(k)}</div>
                    <input
                      type="number"
                      step="0.1"
                      value={benchmarks[k]}
                      onChange={(e) => setBenchmarks((b) => ({ ...b, [k]: Number(e.target.value || 0) }))}
                      className="mt-1 w-full bg-transparent outline-none border border-slate-700 focus:border-slate-400 rounded-lg px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Acciones extra */}
        <section className="mt-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-semibold mb-3">Consejos de uso</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-1 text-sm">
              <li>Recorta la imagen al panel del artefacto para mejorar el OCR.</li>
              <li>Si un valor salió mal, corrígelo en los campos; la puntuación se actualiza al instante.</li>
              <li>Ajusta los <em>benchmarks</em> y los pesos según tu personaje y contenido (historia, jefes, PvP, etc.).</li>
              <li>Para resultados pro: guarda tus perfiles por personaje (se puede extender con localStorage).</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function labelFor(k: StatKey): string {
  switch (k) {
    case "atkPct":
      return "ATK% / ATQ%";
    case "atkFlat":
      return "ATK Plano";
    case "hpPct":
      return "HP% / Vida%";
    case "hpFlat":
      return "HP Plano";
    case "defPct":
      return "DEF% / Defensa%";
    case "defFlat":
      return "DEF Plano";
    case "critRate":
      return "Prob. Crítica";
    case "critDmg":
      return "Daño Crítico";
    case "speed":
      return "Velocidad (SPD)";
    case "penetration":
      return "Penetración";
    case "skillHaste":
      return "Celeridad (Haste)";
  }
}
