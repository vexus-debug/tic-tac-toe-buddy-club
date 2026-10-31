import { useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, MessageCircle, ShieldCheck } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-70px" };
const reveal = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

export type CapabilityGroup = {
  tab: string;
  icon: ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  benefit: string;
  points: string[];
};

/* Section: capability matrix — 3 asymmetric columns on desktop, segmented tabs on mobile */
export const CapabilityMatrix = ({ kicker, title, subtitle, intro, groups }: { kicker: string; title: string; subtitle: string; intro: string; groups: CapabilityGroup[] }) => {
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setChecked((c) => ({ ...c, [k]: !c[k] }));
  const spans = ["lg:col-span-5", "lg:col-span-4", "lg:col-span-3"];

  const Group = ({ g, gi }: { g: CapabilityGroup; gi: number }) => (
    <div className="flex h-full flex-col">
      <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground">
        <g.icon className="h-3.5 w-3.5" />
        {g.tag}
      </span>
      <h3 className="mb-2 text-xl font-bold leading-snug text-card-foreground">{g.title}</h3>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{g.benefit}</p>
      <ul className="mt-auto flex flex-wrap gap-2">
        {g.points.map((p, pi) => {
          const k = `${gi}-${pi}`;
          const on = !!checked[k];
          return (
            <li key={p}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(k)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-left text-[13px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${on ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-primary/40"}`}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                {p}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <section className="mb-16 lg:mb-24">
      <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">{kicker}</motion.p>
      <motion.h2 initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
        {title} <span className="text-muted-foreground">{subtitle}</span>
      </motion.h2>
      <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-8 max-w-2xl text-muted-foreground">{intro}</motion.p>
      <p className="mb-6 text-xs text-muted-foreground">Tap what your clinic needs to build your checklist.</p>

      {/* Mobile: segmented control */}
      <div className="lg:hidden">
        <div role="tablist" className="mb-4 grid rounded-full border border-border bg-muted/40 p-1" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0,1fr))` }}>
          {groups.map((g, i) => (
            <button key={g.tab} role="tab" aria-selected={active === i} onClick={() => setActive(i)} className={`min-h-11 rounded-full text-sm font-semibold transition-colors ${active === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {g.tab}
            </button>
          ))}
        </div>
        <div className="eye-panel rounded-2xl p-5">
          <Group g={groups[active]} gi={active} />
        </div>
      </div>

      {/* Desktop: asymmetric 3-column */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-12">
        {groups.map((g, i) => (
          <motion.div key={g.tab} initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className={`eye-panel rounded-3xl p-7 ${spans[i] ?? "lg:col-span-4"} ${i === 1 ? "lg:mt-10" : ""}`}>
            <Group g={g} gi={i} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

/* Section: pricing card with case-volume estimator */
export const PricingEstimator = ({ included, pricingHref, casesHref, perCase = 1000 }: { included: string[]; pricingHref: string; casesHref?: string; perCase?: number }) => {
  const [cases, setCases] = useState(150);
  const monthly = cases * perCase;
  return (
    <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="eye-panel mb-16 rounded-2xl p-5 sm:rounded-[2.5rem] sm:p-8 md:p-12 lg:mb-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Pricing</p>
          <h2 className="mb-4 text-3xl font-bold leading-tight text-card-foreground md:text-4xl">Pay only when you see patients.</h2>
          <p className="mb-8 max-w-md text-muted-foreground">No monthly subscription and no tiers. Every feature is included. A one-time setup fee, then {naira(perCase)} for each patient case.</p>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Everything included</p>
          <ul className="grid gap-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{item}</span></li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background/60 p-5">
              <p className="text-sm font-medium text-muted-foreground">One-time setup</p>
              <p className="mt-2 text-2xl font-bold text-primary">₦30k – ₦100k</p>
              <p className="mt-2 text-xs text-muted-foreground">Depends on clinic size. Paid once.</p>
            </div>
            <div className="eye-panel-accent rounded-2xl p-5">
              <p className="text-sm font-medium opacity-80">Per patient case</p>
              <p className="mt-2 text-2xl font-bold">{naira(perCase)}</p>
              <p className="mt-2 text-xs opacity-80">Only cases you actually handle.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/60 p-5 sm:p-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <label htmlFor="case-volume" className="text-sm font-medium text-foreground">Cases per month</label>
              <span className="text-2xl font-bold tabular-nums text-foreground">{cases}</span>
            </div>
            <input id="case-volume" type="range" min={10} max={1000} step={10} value={cases} onChange={(e) => setCases(Number(e.target.value))} className="h-11 w-full cursor-pointer accent-primary" />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>10</span><span>1,000</span></div>
            <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
              <span className="text-sm text-muted-foreground">Estimated monthly cost</span>
              <span className="text-3xl font-bold tabular-nums text-primary">{naira(monthly)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Quiet month? You pay less. No per-user seats.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={pricingHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-primary px-5 py-3 font-bold text-primary hover:bg-primary/10">Full pricing</Link>
            {casesHref && <Link to={casesHref} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-bold text-primary-foreground hover:bg-foreground">How a case works <ArrowRight className="h-4 w-4" /></Link>}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

/* Section: editorial closing banner */
export const ClosingBanner = ({ title, body, whatsapp, trust }: { title: string; body: string; whatsapp: string; trust: string[] }) => (
  <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="relative overflow-hidden rounded-2xl border border-primary/20 p-6 sm:rounded-[2.5rem] sm:p-10 md:p-14" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--background)) 55%, hsl(var(--primary) / 0.06))" }}>
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Next step</p>
    <h2 className="mb-4 max-w-2xl text-3xl font-bold leading-tight text-foreground md:text-4xl">{title}</h2>
    <p className="mb-8 max-w-2xl leading-relaxed text-muted-foreground">{body}</p>
    <div className="flex flex-col gap-3 sm:flex-row">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 font-bold text-primary-foreground transition-colors hover:bg-foreground"><MessageCircle className="h-5 w-5" />Talk to us on WhatsApp</a>
      <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-primary px-8 py-3 font-bold text-primary transition-colors hover:bg-primary/10">Try the demo <ArrowRight className="h-5 w-5" /></Link>
    </div>
    <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-primary/15 pt-6">
      {trust.map((t) => (
        <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />{t}</li>
      ))}
    </ul>
  </motion.section>
);
