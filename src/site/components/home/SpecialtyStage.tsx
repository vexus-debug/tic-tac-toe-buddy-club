import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SpecialtyKey } from "./specialtyScene";

const SPECIALTIES: { key: SpecialtyKey; label: string; code: string; line: string; stats: [string, string][]; chips: string[] }[] = [
  {
    key: "dental",
    label: "Dental",
    code: "01",
    line: "Tooth-level charting, chair scheduling and treatment plans that follow each patient visit.",
    stats: [["32", "Teeth charted per visit"], ["Chair", "Based scheduling"]],
    chips: ["Perio charting", "Lab cases", "Treatment plans"],
  },
  {
    key: "eye",
    label: "Eye care",
    code: "02",
    line: "Refraction, prescriptions and optical orders recorded the way optometrists actually work.",
    stats: [["OD / OS", "Per-eye records"], ["Rx", "To optical order"]],
    chips: ["Refraction", "Lens orders", "Eye charts"],
  },
  {
    key: "lab",
    label: "Laboratory",
    code: "03",
    line: "Samples, test templates and results tracked from collection to the patient's result page.",
    stats: [["Sample", "To result tracking"], ["Online", "Result checks"]],
    chips: ["Test templates", "Sample tracking", "Result pages"],
  },
  {
    key: "general",
    label: "General practice",
    code: "04",
    line: "Consultations, vitals, prescriptions and billing for a clinic that sees a bit of everything.",
    stats: [["Vitals", "On every visit"], ["One", "Patient timeline"]],
    chips: ["Vitals", "Prescriptions", "Billing"],
  },
];

type SceneApi = { setActive: (k: SpecialtyKey) => void; dispose: () => void };

const SpecialtyStage = () => {
  const reduceMotion = !!useReducedMotion();
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const [active, setActive] = useState<SpecialtyKey>("dental");
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const el = mountRef.current;
    if (!el) return;
    import("./specialtyScene")
      .then(({ mountSpecialtyScene }) => {
        if (cancelled) return;
        try {
          apiRef.current = mountSpecialtyScene(el, { reduceMotion });
          setReady(true);
        } catch {
          // WebGL unavailable: the static caption panel still works
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [reduceMotion]);

  useEffect(() => {
    apiRef.current?.setActive(active);
  }, [active, ready]);

  // gentle auto-advance until the visitor picks one
  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(() => {
      setActive((cur) => SPECIALTIES[(SPECIALTIES.findIndex((s) => s.key === cur) + 1) % SPECIALTIES.length].key);
    }, 5200);
    return () => clearInterval(id);
  }, [paused, reduceMotion]);

  const current = SPECIALTIES.find((s) => s.key === active)!;

  return (
    <div className="relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] lg:mt-16 lg:grid lg:grid-cols-12 lg:items-center lg:gap-8 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
      <div className="relative h-64 w-full sm:h-80 lg:order-2 lg:col-span-7 lg:h-auto lg:aspect-[5/4]">
        <div ref={mountRef} className="absolute inset-0" aria-hidden />
        <motion.div
          initial={false}
          animate={{ opacity: ready ? 0 : 1 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.3em] text-white/30"
        >
          Loading model
        </motion.div>
        <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/35 lg:left-0 lg:top-0">
          Specimen {current.code} / 04
        </div>
        <div className="pointer-events-none absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/35 lg:bottom-0 lg:right-0">
          <span className="lg:hidden">Drag to inspect</span>
          <span className="hidden lg:inline">Move cursor to inspect</span>
        </div>
      </div>

      <div className="p-4 pt-0 lg:order-1 lg:col-span-5 lg:p-0">
        <div
          role="tablist"
          aria-label="Choose a specialty"
          className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-black/20 p-1 lg:block lg:rounded-none lg:border-0 lg:border-t lg:bg-transparent lg:p-0"
        >
          {SPECIALTIES.map((s) => {
            const on = s.key === active;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setPaused(true);
                  setActive(s.key);
                }}
                onMouseEnter={() => {
                  setPaused(true);
                  setActive(s.key);
                }}
                className="group relative flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-center lg:flex-row lg:items-baseline lg:gap-5 lg:rounded-none lg:border-b lg:border-white/10 lg:px-0 lg:py-4 lg:text-left"
              >
                {on && (
                  <motion.span
                    layoutId="specialty-pill"
                    className="absolute inset-0 rounded-lg bg-white/10 lg:hidden"
                  />
                )}
                <span className={`relative font-mono text-[10px] transition-colors lg:text-xs ${on ? "text-[hsl(var(--medical-teal))]" : "text-white/30"}`}>
                  {s.code}
                </span>
                <span className={`relative text-xs transition-colors lg:text-2xl ${on ? "text-white" : "text-white/40 group-hover:text-white/70"}`}>
                  <span className="lg:hidden">{s.key === "general" ? "General" : s.key === "eye" ? "Eye" : s.key === "lab" ? "Lab" : s.label}</span>
                  <span className="hidden lg:inline">{s.label}</span>
                </span>
                {on && (
                  <motion.span
                    layoutId="specialty-bar"
                    className="absolute bottom-[-1px] left-0 hidden h-px w-full bg-[hsl(var(--medical-teal))] lg:block"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="relative mt-4 min-h-[8rem] lg:mt-6 lg:min-h-[9rem]">
          {!reduceMotion && !paused && (
            <div className="mb-4 h-px w-full max-w-md overflow-hidden bg-white/10" aria-hidden>
              <motion.div
                key={current.key}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5.2, ease: "linear" }}
                className="h-full bg-[hsl(var(--medical-teal))]"
              />
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <p className="max-w-md text-sm leading-relaxed text-white/60">{current.line}</p>
              <dl className="mt-5 flex gap-8">
                {current.stats.map(([v, l]) => (
                  <div key={l}>
                    <dt className="text-lg text-white">{v}</dt>
                    <dd className="text-xs text-white/40">{l}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Included clinical tools">
                {current.chips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyStage;
