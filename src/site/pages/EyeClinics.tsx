import Layout from "@/site/components/Layout";
import { ClinicalHero } from "@/site/components/heroes";
import heroPhoto from "@/assets/site/hero-eye.jpg";
import { motion } from "framer-motion";
import { Check, ClipboardCheck, Eye, Glasses, Microscope, Receipt, ScanEye, Stethoscope, UserRound, Users, CalendarClock, Gauge, Contact } from "lucide-react";
import shotDashboardAsset from "@/assets/current-dashboard/eye-dashboard.png.asset.json";
import shotOverviewAsset from "@/assets/current-dashboard/eye-overview.png.asset.json";
import shotExamsAsset from "@/assets/current-dashboard/eye-exams.png.asset.json";
import shotChartsAsset from "@/assets/current-dashboard/eye-charts.png.asset.json";
import shotOrdersAsset from "@/assets/current-dashboard/eye-orders.png.asset.json";
import shotContactLensesAsset from "@/assets/current-dashboard/eye-contact-lenses.png.asset.json";
import shotAppointmentsAsset from "@/assets/current-dashboard/eye-appointments.png.asset.json";
import { LocalSeo } from "@/site/components/LocalSeo";
import { ClosingBanner, PricingEstimator } from "@/site/components/industry/IndustrySections";

const WHATSAPP = "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus";
const EASE = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-70px" };
const reveal = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };

const Screenshot = ({ src, alt, fixed = false }: { src: string; alt: string; fixed?: boolean }) => (
  <div className="overflow-hidden rounded-2xl border border-primary/15 bg-background">
    <div className="flex items-center gap-1.5 border-b border-primary/10 bg-muted/40 px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-primary/25" />
      <span className="h-2 w-2 rounded-full bg-primary/25" />
      <span className="h-2 w-2 rounded-full bg-primary/25" />
    </div>
    <img src={src} alt={alt} loading="lazy" className={fixed ? "block aspect-video w-full object-cover object-top md:aspect-auto" : "block w-full"} />
  </div>
);

const flagships = [
  { icon: ScanEye, tag: "Refraction", title: "Every refraction, per eye, on one timeline", body: "Sphere, cylinder, axis, add, prism and PD for distance, reading, progressive and contact lens prescriptions — with issue and expiry dates tracked.", shot: shotExamsAsset.url, alt: "Eye exam records with visual acuity, IOP and refraction values per eye" },
  { icon: Glasses, tag: "Optical dispensary", title: "Frames and lenses tracked from order to collection", body: "Frame, lens type, coatings and lab status move from ordered → at lab → ready → collected, against the date you promised.", shot: shotOrdersAsset.url, alt: "Optical orders tracking frames and lenses through the lab" },
];

const compacts = [
  { icon: Gauge, title: "IOP & slit lamp notes", body: "Pressure, C/D ratio and anterior/posterior findings trend on their own.", shot: shotChartsAsset.url, alt: "Trend charts for IOP and visual field results" },
  { icon: Contact, title: "Contact lens fitting", body: "Brand, curve, diameter, powers and fit, with aftercare booked automatically.", shot: shotContactLensesAsset.url, alt: "Contact lens fittings with base curve and aftercare dates" },
  { icon: CalendarClock, title: "Appointment recall", body: "Glaucoma reviews and annual checks come back on schedule, not by memory.", shot: shotAppointmentsAsset.url, alt: "Appointment schedule for the demo eye clinic" },
  { icon: Receipt, title: "Billing", body: "Exams, frames and lenses invoiced on the same file, with payments tracked.", shot: shotOverviewAsset.url, alt: "Eye care overview with today's patient flow" },
];

const flow = [
  { icon: ClipboardCheck, t: "Check-in", d: "Front desk adds them to today's queue." },
  { icon: Eye, t: "Preliminary tests", d: "Visual acuity and IOP recorded per eye." },
  { icon: Microscope, t: "Slit lamp & retinoscopy", d: "Findings and refraction land on the same record." },
  { icon: Glasses, t: "Frame & lens edging", d: "Optical order created straight from the prescription." },
  { icon: Receipt, t: "Dispensing & payment", d: "Collected, invoiced and paid on one file." },
];

const roles = [
  { icon: ScanEye, role: "Optometrist", points: ["Refraction & visual acuity", "Contact lens fittings", "Prescriptions with expiry"] },
  { icon: Stethoscope, role: "Ophthalmologist", points: ["Diagnostics: OCT, fields, fundus", "Surgery booking & IOL power", "Consent & outcome notes"] },
  { icon: Glasses, role: "Dispensing optician", points: ["Frame & lens orders", "Lab status tracking", "Frame, lens & drop stock"] },
  { icon: Users, role: "Front desk", points: ["Check-in & live queue", "Appointments & recalls", "Invoices & payments"] },
];

const included = [
  "Full clinical exam and refraction records",
  "Diagnostic imaging uploads with automatic trend charts",
  "Contact lens fitting and optical order tracking",
  "Surgery booking, biometry/IOL, consent tracking",
  "Appointments, invoicing, inventory, staff scheduling, analytics",
];

const EyeClinics = () => (
  <Layout>
    <ClinicalHero
      kicker="Clinexus for eye clinics"
      title="You fix eyes all day. The paperwork shouldn't be the thing wearing you down."
      description="You chose this work because a patient's sight depends on you. So the exams, refractions, diagnostics, lens dispensing, surgeries and everyday admin shouldn't be the part that drains you. Clinexus holds it all in one simple place, so nothing slips past you."
      primary={{ label: "Talk to us on WhatsApp", href: WHATSAPP, external: true }}
      photo={{ src: heroPhoto, alt: "Optometrist examining a patient at a slit lamp" }}
      card={{ src: shotDashboardAsset.url, alt: "Clinexus eye clinic dashboard", caption: "Today's patient flow across the clinic" }}
      points={[
        { value: "3–4 hrs", label: "Admin time given back each day" },
        { value: "40%", label: "Fewer no-shows with automatic reminders" },
        { value: "9", label: "Staff roles with their own access" },
      ]}
    />
    <div className="eye-theme overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 lg:pb-24">
        {/* Bento */}
        <section id="features" className="mb-16 scroll-mt-24 lg:mb-24">
          <motion.h2 initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            What you get, <span className="text-muted-foreground">in plain words</span>
          </motion.h2>
          <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-10 max-w-2xl text-muted-foreground">
            Real screens from a working demo eye clinic, not mockups.
          </motion.p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {flagships.map((f, i) => (
              <motion.article key={f.tag} initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className={`eye-panel min-w-0 rounded-2xl p-5 sm:rounded-3xl sm:p-7 ${i === 0 ? "lg:col-span-2" : "lg:col-span-1 lg:row-span-2"}`}>
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground"><f.icon className="h-3.5 w-3.5" />{f.tag}</span>
                <h3 className="mb-2 text-xl font-bold leading-snug text-card-foreground sm:text-2xl">{f.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <Screenshot src={f.shot} alt={f.alt} fixed />
              </motion.article>
            ))}
            {compacts.map((c) => (
              <motion.article key={c.title} initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="eye-panel flex min-w-0 flex-col rounded-2xl p-5 sm:rounded-3xl sm:p-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><c.icon className="h-5 w-5 text-primary" /></div>
                <h3 className="mb-1 text-lg font-bold text-card-foreground">{c.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                <div className="mt-auto"><Screenshot src={c.shot} alt={c.alt} fixed /></div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Flow */}
        <section className="mb-16 lg:mb-24">
          <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Intake to eyewear</motion.p>
          <motion.h2 initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-8 text-2xl font-bold text-foreground md:text-3xl">
            From check-in to new glasses, <span className="text-muted-foreground">one record the whole way</span>
          </motion.h2>
          <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {flow.map((s, i) => (
              <motion.li key={s.t} initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="eye-panel w-[72%] shrink-0 snap-start rounded-2xl p-5 sm:w-[45%] md:w-auto">
                <span className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <s.icon className="h-4 w-4 text-primary" />
                </span>
                <h3 className="mb-1 text-base font-semibold text-card-foreground">{s.t}</h3>
                <p className="text-sm leading-snug text-muted-foreground">{s.d}</p>
              </motion.li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground md:hidden">Swipe to see every step →</p>
        </section>

        {/* Roles */}
        <section className="mb-16 lg:mb-24">
          <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Optometry & optical store</motion.p>
          <motion.h2 initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-8 text-2xl font-bold text-foreground md:text-3xl">
            Built around who does the work, <span className="text-muted-foreground">each with their own access</span>
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <motion.div key={r.role} initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="eye-panel rounded-2xl p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><r.icon className="h-5 w-5 text-primary" /></div>
                  <h3 className="text-base font-bold text-card-foreground">{r.role}</h3>
                </div>
                <ul className="space-y-2">
                  {r.points.map((p) => <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p}</li>)}
                </ul>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" />Plus owner, admin, accountant and more — 9 roles in total.</p>
        </section>

        <PricingEstimator included={included} pricingHref="/industries/dental-clinics/pricing" />

        <ClosingBanner
          title="See it with your own patients"
          body="Tell us how your clinic handles exams, dispensing and surgery today, and we'll show you Clinexus doing exactly that for your workflow, not a generic demo."
          whatsapp={WHATSAPP}
          trust={["Every feature included", "No monthly subscription", "Role-based access for 9 staff roles", "Audit trail on every change"]}
        />
      </div>
    </div>
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <LocalSeo specialty="Eye clinics" />
    </div>
  </Layout>
);

export default EyeClinics;
