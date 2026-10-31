/**
 * Purpose-built page headers for the inner marketing pages.
 * Each page group gets its own composition (see AGENTS.md) so no two
 * page types open the same way. All colours come from theme tokens.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type HeroCta = { label: string; href: string; external?: boolean };
export type HeroPoint = { value: string; label: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE, delay },
});

const go = (cta: HeroCta, node: ReactNode) =>
  cta.external ? (
    <a href={cta.href} target="_blank" rel="noopener noreferrer">{node}</a>
  ) : (
    <Link to={cta.href}>{node}</Link>
  );

const Ctas = ({ primary, secondary }: { primary?: HeroCta; secondary?: HeroCta }) =>
  primary || secondary ? (
    <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
      {primary &&
        go(
          primary,
          <Button size="lg" className="gap-2 rounded-sm px-7">
            {primary.label} <ArrowRight className="h-4 w-4" />
          </Button>,
        )}
      {secondary &&
        go(
          secondary,
          <span className="inline-flex items-center gap-1.5 border-b border-foreground/30 pb-0.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
            {secondary.label} <ArrowUpRight className="h-3.5 w-3.5" />
          </span>,
        )}
    </div>
  ) : null;

const Frame = ({ src, alt, className = "" }: { src: string; alt: string; className?: string }) => (
  <div className={`overflow-hidden rounded-md border border-border bg-card ${className}`}>
    <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
    </div>
    <img src={src} alt={alt} className="block w-full" loading="eager" />
  </div>
);

/* 1 ── Specialty pages: practitioner story + real product screens ─────── */
export const NarrativeHero = ({
  kicker, title, description, primary, secondary, points, main, inset,
}: {
  kicker: string; title: string; description: string;
  primary?: HeroCta; secondary?: HeroCta; points: HeroPoint[];
  main: { src: string; alt: string }; inset: { src: string; alt: string };
}) => (
  <section className="site-section-tint relative overflow-hidden pt-16 md:pt-24">
    <div className="container">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <motion.div {...rise()} className="lg:col-span-6 lg:pt-6">
          <p className="text-sm font-medium text-primary">{kicker}</p>
          <h1 className="mt-4 text-[2.15rem] leading-[1.06] text-foreground md:text-5xl lg:text-[3.4rem]">{title}</h1>
          <p className="mt-7 max-w-xl border-l-2 border-primary/60 pl-5 text-base leading-relaxed text-muted-foreground">{description}</p>
          <Ctas primary={primary} secondary={secondary} />
        </motion.div>
        <motion.div {...rise(0.15)} className="relative pb-16 lg:col-span-6 lg:pb-24">
          <Frame src={main.src} alt={main.alt} className="lg:translate-x-8" />
          <Frame src={inset.src} alt={inset.alt} className="absolute -bottom-2 left-0 w-[58%] md:-left-6 lg:-left-10" />
        </motion.div>
      </div>
    </div>
    <dl className="relative border-t border-border bg-background/60">
      <div className="container grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {points.map((p) => (
          <div key={p.label} className="flex items-baseline gap-4 py-6 sm:px-6 first:sm:pl-0">
            <dt className="text-3xl font-semibold tracking-tight text-foreground">{p.value}</dt>
            <dd className="text-sm leading-snug text-muted-foreground">{p.label}</dd>
          </div>
        ))}
      </div>
    </dl>
  </section>
);

/* 2 ── Industries hub: typographic masthead + specialty index ─────────── */
export const IndexHero = ({
  title, description, primary, points, index,
}: { title: string; description: string; primary?: HeroCta; points: HeroPoint[]; index: string[] }) => (
  <section className="site-section-light py-16 md:py-24">
    <div className="container">
      <motion.div {...rise()} className="grid gap-10 border-b border-border pb-12 lg:grid-cols-12">
        <h1 className="text-5xl leading-[0.98] text-foreground md:text-7xl lg:col-span-7 lg:text-[5.5rem]">{title}</h1>
        <div className="lg:col-span-5 lg:self-end">
          <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
          <Ctas primary={primary} />
        </div>
      </motion.div>
      <motion.div {...rise(0.12)} className="grid gap-10 pt-10 lg:grid-cols-12">
        <ol className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
          {index.map((name, i) => (
            <li key={name} className="flex items-baseline gap-3 border-b border-border/70 py-3 text-sm text-foreground">
              <span className="font-mono text-[11px] text-primary">{String(i + 1).padStart(2, "0")}</span>
              {name}
            </li>
          ))}
        </ol>
        <dl className="space-y-5 lg:col-span-4 lg:border-l lg:border-border lg:pl-8">
          {points.map((p) => (
            <div key={p.label}>
              <dt className="text-2xl font-semibold text-foreground">{p.value}</dt>
              <dd className="text-sm text-muted-foreground">{p.label}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </div>
  </section>
);

/* 3 ── Pricing: the number is the hero ────────────────────────────────── */
export const PriceHero = ({
  kicker, title, description, primary, secondary, figure, unit, ledger,
}: {
  kicker: string; title: string; description: string; primary?: HeroCta; secondary?: HeroCta;
  figure: string; unit: string; ledger: { term: string; detail: string }[];
}) => (
  <section className="site-section-light py-16 md:py-24">
    <div className="container grid items-center gap-14 lg:grid-cols-12">
      <motion.div {...rise()} className="lg:col-span-6">
        <p className="font-mono text-xs text-primary">{kicker}</p>
        <h1 className="mt-4 text-4xl leading-[1.05] text-foreground md:text-[3.25rem]">{title}</h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p>
        <Ctas primary={primary} secondary={secondary} />
      </motion.div>
      <motion.div {...rise(0.12)} className="lg:col-span-6">
        <div className="rounded-md border border-border bg-card p-7 md:p-10">
          <div className="flex items-end gap-3 border-b border-border pb-7">
            <span className="text-6xl font-semibold leading-none tracking-tight text-foreground md:text-8xl">{figure}</span>
            <span className="pb-2 text-sm text-muted-foreground">{unit}</span>
          </div>
          <dl className="divide-y divide-border">
            {ledger.map((row) => (
              <div key={row.term} className="grid grid-cols-[8rem_1fr] gap-4 py-4 text-sm">
                <dt className="font-medium text-foreground">{row.term}</dt>
                <dd className="text-muted-foreground">{row.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </div>
  </section>
);

/* 4 ── Contact: talk-to-us desk, channels first ───────────────────────── */
export const ContactHero = ({
  title, description, channels, points,
}: {
  title: string; description: string; points: HeroPoint[];
  channels: { label: string; value: string; href?: string }[];
}) => (
  <section className="relative border-b border-border py-16 md:py-20">
    <div className="container grid gap-12 lg:grid-cols-2">
      <motion.div {...rise()}>
        <h1 className="text-4xl leading-[1.05] text-foreground md:text-[3.25rem]">{title}</h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {points.map((p) => (
            <span key={p.label}><span className="font-semibold text-foreground">{p.value}</span> · {p.label}</span>
          ))}
        </p>
      </motion.div>
      <motion.ul {...rise(0.12)} className="divide-y divide-border border-y border-border">
        {channels.map((c) => {
          const row = (
            <div className="group flex items-center justify-between gap-6 py-5">
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-lg text-foreground md:text-xl">{c.value}</p>
              </div>
              {c.href && <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />}
            </div>
          );
          return (
            <li key={c.label}>
              {c.href ? <a href={c.href} target="_blank" rel="noopener noreferrer">{row}</a> : row}
            </li>
          );
        })}
      </motion.ul>
    </div>
  </section>
);

/* 5 ── About: editorial statement + real photo ────────────────────────── */
export const ManifestoHero = ({
  kicker, title, description, primary, points, photo,
}: {
  kicker: string; title: string; description: string; primary?: HeroCta; points: HeroPoint[];
  photo: { src: string; alt: string };
}) => (
  <section className="site-section-light pt-16 md:pt-24">
    <div className="container">
      <motion.div {...rise()} className="max-w-5xl">
        <p className="text-sm text-muted-foreground">{kicker}</p>
        <h1 className="mt-5 text-[2.6rem] leading-[1.02] text-foreground md:text-7xl">{title}</h1>
      </motion.div>
      <motion.div {...rise(0.12)} className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
          <Ctas primary={primary} />
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6 lg:grid-cols-1 lg:gap-6">
            {points.map((p) => (
              <div key={p.label}>
                <dt className="text-2xl font-semibold text-foreground md:text-3xl">{p.value}</dt>
                <dd className="text-xs text-muted-foreground md:text-sm">{p.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lg:col-span-8">
          <img src={photo.src} alt={photo.alt} className="aspect-[16/10] w-full rounded-t-md object-cover" />
        </div>
      </motion.div>
    </div>
  </section>
);

/* 6 ── Tutorials: compact documentation header ────────────────────────── */
export const DocsHero = ({
  trail, title, description, chips,
}: { trail: string; title: string; description: string; chips?: { label: string; href: string }[] }) => (
  <section className="border-b border-border py-12 md:py-16">
    <div className="container max-w-6xl">
      <motion.div {...rise()}>
        <p className="font-mono text-xs text-muted-foreground">{trail}</p>
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight text-foreground md:text-[2.75rem]">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
        {chips && chips.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2">
            {chips.map((c) => (
              <Link key={c.href} to={c.href} className="rounded-sm border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary">
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  </section>
);

/* 7 ── Updates: release log masthead ──────────────────────────────────── */
export const ChangelogHero = ({
  title, description, latest, total,
}: {
  title: string; description: string; total: number;
  latest: { version: string; date: string; title: string };
}) => (
  <section className="border-b border-border py-14 md:py-20">
    <div className="container grid gap-10 lg:grid-cols-12 lg:items-end">
      <motion.div {...rise()} className="lg:col-span-7">
        <p className="font-mono text-xs text-primary">clinexus / changelog</p>
        <h1 className="mt-4 text-4xl text-foreground md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p>
      </motion.div>
      <motion.div {...rise(0.12)} className="font-mono text-sm lg:col-span-5">
        <div className="rounded-md border border-border">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted-foreground">
            <span>latest release</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />live</span>
          </div>
          <div className="space-y-2 px-5 py-5">
            <p className="text-2xl text-foreground">{latest.version}</p>
            <p className="font-sans text-foreground">{latest.title}</p>
            <p className="text-xs text-muted-foreground">{latest.date} · {total} releases logged</p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

/* 8 ── Legal: calm document header ────────────────────────────────────── */
export const LegalHero = ({
  kind, title, updated, description, points = [],
}: { kind: string; title: string; updated: string; description: string; points?: HeroPoint[] }) => (
  <section className="site-section-light py-14 md:py-20">
    <div className="container max-w-4xl">
      <motion.div {...rise()}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{kind}</span>
          <span>Last updated {updated}</span>
        </div>
        <h1 className="mt-10 text-4xl leading-[1.08] text-foreground md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
        {points.length > 0 && (
          <dl className="mt-10 grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
            {points.map((p) => (
              <div key={p.label}>
                <dt className="font-semibold text-foreground">{p.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{p.label}</dd>
              </div>
            ))}
          </dl>
        )}
      </motion.div>
    </div>
  </section>
);

/* 6 ── Industry pages: clinic photo backdrop + floating product card ───── */
export const ClinicalHero = ({
  kicker, title, description, primary, secondary, photo, card, aside, points = [],
}: {
  kicker: string; title: string; description: string;
  primary?: HeroCta; secondary?: HeroCta;
  photo: { src: string; alt: string };
  card?: { src: string; alt: string; caption: string };
  aside?: ReactNode;
  points?: HeroPoint[];
}) => (
  <section className="relative isolate overflow-hidden bg-medical-navy">
    <img
      src={photo.src}
      alt={photo.alt}
      width={1920}
      height={1088}
      loading="eager"
      fetchPriority="high"
      className="absolute inset-0 -z-20 h-full w-full object-cover object-[72%_center]"
    />
    <div className="hero-scrim absolute inset-0 -z-10" />
    <div className="container grid items-center gap-10 py-14 md:py-20 lg:min-h-[620px] lg:grid-cols-12 lg:gap-12 lg:py-24">
      <motion.div {...rise()} className="lg:col-span-6">
        <p className="inline-flex items-center rounded-full border border-hero-on px-3 py-1 text-xs font-medium text-hero-on">{kicker}</p>
        <h1 className="mt-5 text-[2rem] leading-[1.08] text-hero-on sm:text-4xl md:text-5xl lg:text-[3.25rem]" style={{ textWrap: "balance" }}>{title}</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-hero-on-muted md:text-lg">{description}</p>
        {(primary || secondary) && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {primary && go(primary, <Button size="lg" className="h-12 w-full gap-2 rounded-md px-7 sm:w-auto">{primary.label} <ArrowRight className="h-4 w-4" /></Button>)}
            {secondary && go(secondary, <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-hero-on underline-offset-4 hover:underline">{secondary.label} <ArrowUpRight className="h-3.5 w-3.5" /></span>)}
          </div>
        )}
      </motion.div>
      {(card || aside) && (
        <motion.div {...rise(0.15)} className="lg:col-span-6">
          {aside ?? (card && (
            <figure className="rounded-xl border border-hero-on bg-background/95 p-1.5 shadow-2xl backdrop-blur lg:translate-x-6">
              <img src={card.src} alt={card.alt} className="block w-full rounded-lg" loading="eager" />
              <figcaption className="px-3 py-2.5 text-xs text-muted-foreground">{card.caption}</figcaption>
            </figure>
          ))}
        </motion.div>
      )}
    </div>
    {points.length > 0 && (
      <dl className="border-t border-hero-on">
        <div className="container grid grid-cols-3 divide-x divide-[hsl(var(--hero-on)/0.22)]">
          {points.map((p) => (
            <div key={p.label} className="px-3 py-5 first:pl-0 sm:px-6 md:py-6">
              <dt className="text-xl font-semibold tracking-tight text-hero-on md:text-3xl">{p.value}</dt>
              <dd className="mt-1 text-xs leading-snug text-hero-on-muted md:text-sm">{p.label}</dd>
            </div>
          ))}
        </div>
      </dl>
    )}
  </section>
);

/* Glass figure panel for pricing pages, used as ClinicalHero `aside`. */
export const FigurePanel = ({ figure, unit, ledger }: { figure: string; unit: string; ledger: { term: string; detail: string }[] }) => (
  <div className="rounded-xl border border-hero-on bg-background/95 p-6 shadow-2xl backdrop-blur md:p-9">
    <div className="flex items-end gap-3 border-b border-border pb-6">
      <span className="text-5xl font-semibold leading-none tracking-tight text-foreground md:text-7xl">{figure}</span>
      <span className="pb-1.5 text-sm text-muted-foreground">{unit}</span>
    </div>
    <dl className="divide-y divide-border">
      {ledger.map((row) => (
        <div key={row.term} className="grid grid-cols-[6.5rem_1fr] gap-3 py-3.5 text-sm">
          <dt className="font-medium text-foreground">{row.term}</dt>
          <dd className="text-muted-foreground">{row.detail}</dd>
        </div>
      ))}
    </dl>
  </div>
);
