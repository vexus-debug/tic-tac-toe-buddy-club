import Layout from "@/site/components/Layout";
import { ClinicalHero, FigurePanel } from "@/site/components/heroes";
import heroPhoto from "@/assets/site/hero-dental-desk.jpg";
import { CheckCircle2, XCircle } from "lucide-react";

const WHATSAPP = "https://wa.me/2349017758165?text=Hello%20I%20have%20a%20question%20about%20Clinexus%20per-case%20pricing";

const steps = [
  { n: "1", t: "Start with 10 free cases, then buy credits in advance", d: "Every clinic gets 10 free cases at signup. After that, 1 credit = 1 case = ₦1,000. Credits never expire. Your balance shows on the wallet button in your dashboard." },
  { n: "2", t: "A credit is used on first clinical work", d: "Booking, checking in, or adding a note, plan, chart, X-ray, prescription, lab order or invoice for a patient with no open case." },
  { n: "3", t: "The case covers 30 days, up to 3 visits", d: "Everything for that patient is covered. The 4th visit, or any visit after 30 days, opens a new case." },
];

const counts = [
  "First clinical work for a patient with no open case",
  "A 4th visit within the same 30 days",
  "Any visit after the 30 days are up",
  "Moving an old appointment to a date outside its 30 days",
];
const notCounts = [
  "Registering a new patient",
  "Viewing old records, charts and reports",
  "Editing anything inside an open case",
  "Visits 2 and 3 within the same 30 days",
];

const examples = [
  { who: "Patient A: Scaling today, review in 2 weeks", calc: "1 case — both visits are for the same patient within 14 days, inside the 30-day window and under the 3-visit limit.", cost: "₦1,000" },
  { who: "Patient B: Root canal (3 visits in 3 weeks), crown on day 40", calc: "2 cases — visits 1–3 are covered by the first case. When the same patient returns on day 40, the 30 days have ended, so a 2nd case opens (another 30 days, up to 3 visits).", cost: "₦2,000" },
  { who: "Patient C: Emergency visit in January, filling in March", calc: "2 cases — only 2 visits, but more than 30 days passed for this patient, so the March visit opens a new case.", cost: "₦2,000" },
  { who: "Patient D: 4 visits in 3 weeks", calc: "2 cases — one case covers up to 3 visits for the same patient. The 4th visit opens a 2nd case with a fresh 30 days and 3 visits.", cost: "₦2,000" },
];

const faqs = [
  { q: "When do I pay?", a: "In advance. You start with 10 free cases at signup, then buy credits that are used as you go. To top up, contact Clinexus support." },
  { q: "Do credits expire?", a: "No. Credits last indefinitely until you use them." },
  { q: "What happens at zero credits?", a: "Old records stay open, but new cases are blocked until you top up. The wallet turns red below 5 credits." },
  { q: "Do I get a credit back if I delete a visit?", a: "No. Deleting or cancelling a visit does not return the credit." },
  { q: "Is there a monthly subscription too?", a: "No. Only the one-time setup fee (₦30,000–₦100,000, depending on clinic size) and ₦1,000 per case." },
];

const DentalCasesExplained = () => (
  <Layout>
    <ClinicalHero
      kicker="How per-case pricing works"
      title="₦1,000 per patient case, explained simply."
      description="One case covers one patient for 30 days, up to 3 visits — everything in between is included."
      primary={{ label: "Ask us on WhatsApp", href: WHATSAPP, external: true }}
      secondary={{ label: "Back to pricing", href: "/industries/dental-clinics/pricing" }}
      photo={{ src: heroPhoto, alt: "Patient paying at a dental clinic front desk" }}
      aside={<FigurePanel figure="30" unit="days per case" ledger={[
        { term: "Covers", detail: "One patient" },
        { term: "Visits", detail: "Up to 3 within the 30 days" },
        { term: "Included", detail: "Everything in between those visits" },
      ]} />}
    />
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:px-6">
      <section>
        <h2 className="mb-5 text-lg font-semibold text-foreground">What is a case?</h2>
        <ol className="relative space-y-6 border-l border-border pl-6">
          {steps.map((s) => (
            <li key={s.n} className="relative">
              <span className="absolute -left-[33px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{s.n}</span>
              <p className="text-sm font-medium text-foreground">{s.t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Uses a credit</h3>
          <ul className="divide-y divide-border">{counts.map((c) => <li key={c} className="flex gap-2 py-2 text-[13px] text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{c}</li>)}</ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free</h3>
          <ul className="divide-y divide-border">{notCounts.map((c) => <li key={c} className="flex gap-2 py-2 text-[13px] text-muted-foreground"><XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{c}</li>)}</ul>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-foreground">Examples</h2>
        <p className="mb-4 text-[13px] text-muted-foreground">Cases are counted per patient. One patient's visits never share or use up another patient's case.</p>
        <div className="divide-y divide-border border-y border-border">
          {examples.map((e) => (
            <div key={e.who} className="flex items-start justify-between gap-4 py-4">
              <div><p className="text-sm font-medium text-foreground">{e.who}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{e.calc}</p></div>
              <p className="shrink-0 text-sm font-semibold text-primary">{e.cost}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Quick answers</h2>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">{f.q}<span className="text-primary transition-transform group-open:rotate-45">+</span></summary>
              <p className="mt-2 text-[13px] text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  </Layout>
);

export default DentalCasesExplained;
