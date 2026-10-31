import { useMemo, useState } from "react";
import Layout from "@/site/components/Layout";
import { ClinicalHero } from "@/site/components/heroes";
import heroClinic from "@/assets/site/hero-clinic.jpg";
import hubShotAsset from "@/assets/current-dashboard/dental-dashboard.png.asset.json";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type Specialty = {
  code: string;
  title: string;
  group: "Outpatient" | "Diagnostic" | "Surgical";
  summary: string;
  pills: string[];
  href?: string;
};

const flagships = [
  {
    code: "SPEC-01",
    module: "MODULE: DENTAL",
    title: "Dental Clinics",
    summary:
      "Charting, multi-visit billing and recall automation built around how a busy chair actually runs.",
    pills: ["Perio & tooth charting", "Multi-visit billing", "X-ray / imaging vault", "Recall automation"],
    href: "/industries/dental-clinics",
    preview: (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          <span>Tooth chart</span>
          <span className="tabular-nums">32 / 32</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`h-7 rounded-[4px] border ${
                [3, 9, 12].includes(i)
                  ? "border-primary/40 bg-primary/25"
                  : [5].includes(i)
                    ? "border-destructive/40 bg-destructive/20"
                    : "border-border/70 bg-muted/50"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Treated</span>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Caries</span>
          <span className="rounded-full bg-muted px-2 py-0.5">Healthy</span>
        </div>
      </div>
    ),
  },
  {
    code: "SPEC-02",
    module: "MODULE: OPTOMETRY",
    title: "Eye Care & Optometry",
    summary:
      "Refraction records, lens and frame stock, and referral loops kept in one continuous patient file.",
    pills: ["Refraction & acuity", "Lens & frame stock", "OCT / retinal scans", "Reorder cycles"],
    href: "/industries/eye-clinics",
    preview: (
      <div className="space-y-3">
        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Prescription
        </div>
        <div className="overflow-hidden rounded-lg border border-border/70">
          <div className="grid grid-cols-4 bg-muted/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
            <span>Eye</span>
            <span>SPH</span>
            <span>CYL</span>
            <span>AXIS</span>
          </div>
          {[
            ["OD", "-2.25", "-0.75", "180"],
            ["OS", "-1.75", "-0.50", "175"],
          ].map((row) => (
            <div
              key={row[0]}
              className="grid grid-cols-4 border-t border-border/60 px-3 py-2 text-sm tabular-nums text-foreground"
            >
              <span className="font-medium text-primary">{row[0]}</span>
              <span>{row[1]}</span>
              <span>{row[2]}</span>
              <span>{row[3]}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground">Next review in 11 months · reminder queued</div>
      </div>
    ),
  },
];

const specialties: Specialty[] = [
  {
    code: "SPEC-03",
    title: "General & Family Practice",
    group: "Outpatient",
    summary: "Walk-ins and booked visits side by side, with labs and prescriptions attached to the note.",
    pills: ["Triage", "E-prescriptions", "Chronic care plans"],
  },
  {
    code: "SPEC-04",
    title: "Pediatrics",
    group: "Outpatient",
    summary: "Immunisation schedules, growth tracking and parent reminders that fire on their own.",
    pills: ["Vaccine schedules", "Growth charts", "Family linking"],
  },
  {
    code: "SPEC-05",
    title: "Orthopedics & Physiotherapy",
    group: "Surgical",
    summary: "Long treatment cycles stay readable: every session, scan and progress note in sequence.",
    pills: ["Session plans", "Imaging compare", "Equipment log"],
  },
  {
    code: "SPEC-06",
    title: "Dermatology & Aesthetics",
    group: "Surgical",
    summary: "Before-and-after imagery, batch-tracked products and signed consent in the same record.",
    pills: ["Photo timeline", "Batch tracking", "E-signatures"],
  },
  {
    code: "SPEC-07",
    title: "Cardiology",
    group: "Diagnostic",
    summary: "ECG and echo results, refill alerts and risk-based follow-up for high-risk patients.",
    pills: ["ECG storage", "Refill alerts", "Risk follow-up"],
  },
  {
    code: "SPEC-08",
    title: "ENT",
    group: "Surgical",
    summary: "Audiometry, allergy schedules and procedure billing without spreadsheets on the side.",
    pills: ["Audiometry", "Pre/post-op", "Procedure billing"],
  },
  {
    code: "SPEC-09",
    title: "Neurology & Psychiatry",
    group: "Outpatient",
    summary: "Long-form notes, assessment scoring and tighter privacy controls for sensitive files.",
    pills: ["Long notes", "Assessment scoring", "Restricted access"],
  },
  {
    code: "SPEC-10",
    title: "Diagnostic & Lab Centers",
    group: "Diagnostic",
    summary: "Samples tracked from collection to delivery, with abnormal values flagged automatically.",
    pills: ["Barcode intake", "Critical flags", "Auto-delivery"],
  },
  {
    code: "SPEC-11",
    title: "Wellness & Integrative",
    group: "Outpatient",
    summary: "Custom modalities, package billing and retention campaigns for non-standard care.",
    pills: ["Custom modalities", "Package billing", "Retention"],
  },
];

const filters = ["All", "Outpatient", "Diagnostic", "Surgical"] as const;

const Industries = () => {
  const [active, setActive] = useState<(typeof filters)[number]>("All");

  const visible = useMemo(
    () => (active === "All" ? specialties : specialties.filter((s) => s.group === active)),
    [active],
  );

  return (
    <Layout>
      <ClinicalHero
        kicker="Industries we serve"
        title="Built for your kind of clinic."
        description="We know every specialty is different. That's why Clinexus adapts to your workflows, not the other way around. Find your practice below."
        photo={{ src: heroClinic, alt: "Receptionist welcoming a patient at a modern clinic front desk" }}
        card={{ src: hubShotAsset.url, alt: "Clinexus clinic dashboard", caption: "One workspace for patients, billing, stock and staff" }}
        primary={{ label: "Get Started", href: "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus", external: true }}
        points={[
          { value: "11+", label: "Specialties supported out of the box" },
          { value: "24 hrs", label: "From signup to a live clinic workspace" },
          { value: "1", label: "System for patients, billing, stock and staff" },
        ]}
      />

      {/* Flagship specialties */}
      <section className="border-b border-border/60 bg-background py-20">
        <div className="container">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                Deep-built verticals
              </p>
              <h2 className="mt-2 text-foreground">Two specialties, fully tooled</h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Dedicated modules, not relabelled forms — charting, stock and billing shaped per specialty.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {flagships.map((f, i) => (
              <motion.article
                key={f.code}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{f.code}</span>
                  <span className="text-primary">{f.module}</span>
                </div>

                <h3 className="mt-4 text-foreground">{f.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{f.summary}</p>

                <div className="mt-6 rounded-xl border border-border/70 bg-background/60 p-4">{f.preview}</div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {f.pills.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <Link
                  to={f.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                >
                  Explore {f.title.split(" ")[0]}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* All specialties */}
      <section className="bg-background py-20">
        <div className="container">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                Every other practice
              </p>
              <h2 className="mt-2 text-foreground">Nine more specialties, same core</h2>
            </div>

            <div className="inline-flex rounded-full border border-border bg-card p-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    active === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s, i) => (
              <motion.article
                key={s.code}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{s.code}</span>
                  <span className="text-primary">MODULE: {s.group}</span>
                </div>

                <h3 className="mt-4 text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.summary}</p>

                <div className="mt-6 flex-1 rounded-xl border border-border/70 bg-background/60 p-4">
                  <div className="mb-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    <span>Specialty workflow</span>
                    <span className="text-primary">Included</span>
                  </div>
                  <div className="space-y-2">
                    {s.pills.map((p, index) => (
                      <div
                        key={p}
                        className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold tabular-nums text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs font-medium text-foreground">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {s.pills.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[hsl(var(--medical-blue-dark))] py-20">
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-4 text-3xl font-bold text-white">Don't see your specialty?</h2>
            <p className="mx-auto mb-8 max-w-xl text-white/60">
              Clinexus is flexible enough to support virtually any healthcare practice. Reach out and we'll
              show you exactly how it fits.
            </p>
            <Link to="/contact">
              <Button size="lg" className="gap-2 rounded-md bg-primary px-10 text-white shadow-lg hover:opacity-90">
                Contact Us <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Industries;
