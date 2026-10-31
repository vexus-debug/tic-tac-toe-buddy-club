import Layout from "@/site/components/Layout";
import { ClinicalHero, FigurePanel } from "@/site/components/heroes";
import heroPhoto from "@/assets/site/hero-dental-desk.jpg";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import CaseCalculator from "@/site/components/CaseCalculator";

const WHATSAPP = "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus%20dental%20pricing";

const rows = [
  { label: "Setup (one time)", value: "₦30,000 – ₦100,000", note: "Based on clinic size, branches, chairs and staff" },
  { label: "Per patient case", value: "₦1,000", note: "30 days, up to 3 visits" },
  { label: "Free at signup", value: "10 cases", note: "Credits never expire" },
  { label: "Monthly fee", value: "₦0", note: "No subscription, no tiers" },
];

const included = ["Setup, training and data import", "Every feature, no add-ons", "Pay in advance with credits", "Unused credits stay forever"];

const DentalPricing = () => (
  <Layout>
    <ClinicalHero
      kicker="Dental clinic pricing"
      title="Simple pricing. You only pay when you see patients."
      description="A one-time setup fee, then ₦1,000 per patient case. No monthly subscription."
      primary={{ label: "Talk to us on WhatsApp", href: WHATSAPP, external: true }}
      secondary={{ label: "How a case works", href: "/industries/dental-clinics/pricing/cases" }}
      photo={{ src: heroPhoto, alt: "Patient paying at a dental clinic front desk" }}
      aside={<FigurePanel figure="₦1,000" unit="per patient case" ledger={[
        { term: "Setup", detail: "One-time fee to get your clinic live" },
        { term: "Monthly fee", detail: "None — no subscription" },
        { term: "One case", detail: "One patient, 30 days, up to 3 visits" },
      ]} />}
    />
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:px-6">
      <section>
        <dl className="divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 py-4">
              <div>
                <dt className="text-sm font-medium text-foreground">{r.label}</dt>
                <p className="text-xs text-muted-foreground">{r.note}</p>
              </div>
              <dd className="text-lg font-semibold text-primary">{r.value}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {included.map((t) => (
            <li key={t} className="flex items-center gap-2 text-[13px] text-muted-foreground"><Check className="h-3.5 w-3.5 text-primary" />{t}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-foreground">Try it with one patient</h2>
        <p className="mb-4 text-[13px] text-muted-foreground">Enter visit dates to see how many cases they use.</p>
        <CaseCalculator />
      </section>

      <Link to="/industries/dental-clinics/how-cases-work" className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">How does ₦1,000 per case work? →</Link>
    </div>
  </Layout>
);

export default DentalPricing;
