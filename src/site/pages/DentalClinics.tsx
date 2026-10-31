import Layout from "@/site/components/Layout";
import { ClinicalHero } from "@/site/components/heroes";
import heroPhoto from "@/assets/site/hero-dental.jpg";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  Check,
  ClipboardList,
  FileBarChart,
  MessageCircle,
  ShieldCheck,
  Smile,
  Users,
  Wallet,
  Sparkles,
  FileText,
  Pill,
  Receipt,
} from "lucide-react";
import shotPatients from "@/assets/dashboard-shots/dental-patients.png";
import shotAppointments from "@/assets/dashboard-shots/dental-appointments.png";
import shotCharts from "@/assets/dashboard-shots/dental-charts.png";
import shotBilling from "@/assets/dashboard-shots/dental-billing.png";
import shotInventory from "@/assets/dashboard-shots/dental-inventory.png";
import shotDashboard from "@/assets/dashboard-shots/dental-dashboard.png";
import shotTreatments from "@/assets/dashboard-shots/dental-treatments.png";
import { LocalSeo } from "@/site/components/LocalSeo";
import { CapabilityMatrix, ClosingBanner, PricingEstimator, type CapabilityGroup } from "@/site/components/industry/IndustrySections";
import { DentalSavings, DentalTrust } from "@/site/components/industry/DentalSavings";

const matrixGroups: CapabilityGroup[] = [
  { tab: "Clinical", icon: Smile, tag: "Clinical & Charting", title: "Chart by tooth, plan by patient", benefit: "Everything you record in the chair stays attached to the same patient.", points: ["Tooth-by-tooth charting", "Treatment plans", "SOAP notes", "Prescriptions", "Digital consent forms", "Tooth-tagged imaging"] },
  { tab: "Admin", icon: CalendarClock, tag: "Front Desk & Scheduling", title: "A front desk that finally breathes", benefit: "Fewer no-shows, shorter waits, no double-booked chairs.", points: ["Chair & dentist booking", "Live waiting list", "Walk-in queue", "Invoices & estimates", "Payment plans"] },
  { tab: "Operations", icon: Boxes, tag: "Back Office & Inventory", title: "Facts, not guesswork", benefit: "Stock, staff and money reconciled from the work itself.", points: ["Stock linked to treatments", "Suppliers & purchase orders", "Commissions & expenses", "Profit per treatment", "Audit trail"] },
];

const WHATSAPP = "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus";
const EASE = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-70px" };
const reveal = { hidden: { opacity: 0, y: 34 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };
const slide = (dir: "left" | "right" | "up") => ({ hidden: { opacity: 0, x: dir === "left" ? -70 : dir === "right" ? 70 : 0, y: dir === "up" ? 60 : 0 }, show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.8, ease: EASE } } });

const Screenshot = ({ src, alt }: { src: string; alt: string }) => (
  <div className="mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-background">
    <div className="flex items-center gap-1.5 border-b border-primary/10 bg-muted/40 px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-primary/25" />
      <span className="h-2 w-2 rounded-full bg-primary/25" />
      <span className="h-2 w-2 rounded-full bg-primary/25" />
    </div>
    <img src={src} alt={alt} loading="lazy" className="block w-full" />
  </div>
);

const modules = [
  { icon: ClipboardList, name: "Patient records", shot: shotPatients, shotAlt: "Patient list with contact details, visit history and status", benefit: "Every patient's whole story, right where you need it.", body: "Picture the patient who walks back in after a year. Instead of flipping through a tired folder, you open their name and their whole story is there — treatments, prescriptions, X-rays, notes. Allergies and emergency contacts sit right at the top, so you can walk into that chair knowing you've missed nothing." },
  { icon: CalendarClock, name: "Scheduling", shot: shotAppointments, shotAlt: "Monthly appointment calendar showing booked patients per day", benefit: "Your day runs itself, instead of running you.", body: "You'll never look up mid-procedure to find the front desk has double-booked a chair again. Book by patient, dentist and chair without clashes. Day, week and month views, a live chair grid, a walk-in queue and a waiting list keep your day moving, even when it's hectic." },
  { icon: Smile, name: "Dental charting", shot: shotCharts, shotAlt: "Interactive adult tooth chart with per-tooth condition colours", benefit: "Chart by tooth, not by memory.", body: "Tap the tooth, record what you found, and turn back to the person in front of you. Treatment plans, prescriptions and consent forms stay attached to the same patient — so six months from now, you'll know exactly what you saw without guessing." },
  { icon: Wallet, name: "Billing", shot: shotBilling, shotAlt: "Billing screen with invoices, amounts owed and payment status", benefit: "You worked for that money. Watch it come home.", body: "There's nothing worse than a month-end total that doesn't match the work you put in. See who owes you, who's on a payment plan, and what each treatment really costs you to deliver — so your numbers finally reflect the care you give." },
  { icon: Boxes, name: "Inventory", shot: shotInventory, shotAlt: "Inventory list showing stock levels and low-stock alerts", benefit: "Never reach for something that isn't there.", body: "You're mid-procedure. The last thing you should be doing is wondering whether that material ran out yesterday. Know what's on the shelf before the patient sits down, not while they're in the chair. Low-stock alerts, suppliers and purchase orders, all in one place." },
  { icon: ShieldCheck, name: "Oversight & access", shot: shotDashboard, shotAlt: "Clinic dashboard with patient count, revenue and today's schedule", benefit: "You see everything. Your staff see only their part.", body: "Patient numbers, today's schedule, pending payments and monthly revenue on one screen — the whole clinic in a single glance, before you even take off your coat. Each person on your team only sees what their job needs, so you can let go without losing control." },
];

const aiFeatures = [
  { icon: FileText, name: "AI SOAP notes", shot: shotCharts, shotAlt: "Dental chart whose findings feed the AI-drafted SOAP note", benefit: "Your notes, drafted before the patient leaves the chair.", points: ["Drafts Subjective, Objective, Assessment and Plan from today's chart", "Flags anything missing as \"clinician to confirm\"", "You edit and sign — nothing saves on its own"] },
  { icon: Pill, name: "Prescription safety", shot: shotTreatments, shotAlt: "Treatment screen where prescriptions are checked by AI", benefit: "A second pair of eyes on every prescription.", points: ["Checks drug interactions against current medications", "Catches allergy conflicts, including cross-reactions", "Rates each concern high, moderate or low with an alternative"] },
  { icon: Receipt, name: "Missed-billing check", shot: shotBilling, shotAlt: "Billing screen where AI suggests unbilled treatments", benefit: "Work you did today doesn't slip off the bill.", points: ["Compares today's charted work against the invoice", "Only suggests items from your own treatment list", "Conservative by design — no guesses, no duplicates"] },
  { icon: CalendarClock, name: "Fast-fill & aftercare", shot: shotAppointments, shotAlt: "Appointment calendar where AI suggests patients for an open slot", benefit: "Empty chairs filled, patients sent home informed.", points: ["Ranks patients with pending treatment for a cancelled slot", "Writes simple post-op instructions from today's procedures", "Tailors consent forms with patient-specific risks"] },
];


const included = ["Full patient records, SOAP notes and tooth-tagged imaging", "Scheduling with chair and clinician conflict prevention", "Dental charting, treatment planning and consent forms", "Billing, payment plans, commissions and profitability reporting", "Inventory linked to treatments, suppliers and purchase orders", "Reports, analytics and role-based access control"];
const roles = ["Owner", "Admin", "Dentist", "Receptionist", "Hygienist", "Assistant", "Accountant", "Lab technician", "Lab assistant"];

const coreGroups = [
  {
    icon: Users,
    title: "Patients & appointments",
    benefit: "Fewer no-shows. Shorter waits. A front desk that finally breathes.",
    points: [
"Every patient's history, files and allergies in one profile",
"Appointments, dentist schedules and a live waiting list",
"Notes, treatment plans, prescriptions and consent forms, all digital",
"Treatments link to the materials they use, so stock and notes agree",
    ],
  },
  {
    icon: Wallet,
    title: "Money & billing",
    benefit: "Know what you earned, what it cost you and who still owes you — without opening a notebook.",
    points: [
"Invoices and estimates before the patient commits to treatment",
"Payment plans for big work like implants and braces",
"Expenses and staff commissions tracked as they happen",
"See profit per treatment and per dentist, not just month-end totals",
    ],
  },
  {
    icon: Boxes,
    title: "Stock & suppliers",
    benefit: "Never have to cancel a procedure because something ran out on your watch.",
    points: [
"Every material tracked with its real cost and value",
"Treatments link straight to the materials they consume",
"Suppliers and purchase orders stay with the items they deliver",
"Check what's on the shelf in seconds, before the next patient",
    ],
  },
  {
    icon: FileBarChart,
    title: "Reports & admin",
    benefit: "Run your clinic on facts, not on the nagging feeling that something's slipping.",
    points: [
"Clear reports on patients, money and daily activity",
"Staff records, documents and clinic settings in one place",
"An audit trail showing who changed what, and when",
"A live feed, so you always know what's happening without asking",
    ],
  },
];

const DentalClinics = () => {
  return (
    <Layout>
      <ClinicalHero
        kicker="Clinexus for dental clinics"
        title="You didn't spend years learning to heal teeth so you could chase folders all evening."
        description="You know the feeling — a full waiting room, a patient in the chair who needs all of you, and a stack of files daring you to fall behind. We built Clinexus sitting with dental clinics like yours, listening to the days you actually have."
        primary={{ label: "Talk to us on WhatsApp", href: WHATSAPP, external: true }}
        secondary={{ label: "See pricing", href: "/industries/dental-clinics/pricing" }}
        photo={{ src: heroPhoto, alt: "Dentist treating a smiling patient in a modern dental operatory" }}
        card={{ src: shotDashboard, alt: "Clinexus dental dashboard with today's schedule and revenue", caption: "Today's schedule and revenue, live" }}
        points={[
          { value: "3–4 hrs", label: "Admin time given back each day" },
          { value: "40%", label: "Fewer no-shows with automatic reminders" },
          { value: "9", label: "Staff roles with their own access" },
        ]}
      />
      <div className="eye-theme overflow-x-hidden">
        <section aria-label="Industry-standard, enterprise-grade" className="border-y border-primary/10 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.25em] text-primary">Industry-standard. Enterprise-grade.</p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Smile, t: "Standard dental nomenclature", d: "FDI & Universal tooth numbering with MODBL surface precision." },
                { icon: Users, t: "Enterprise role security", d: "9 role-based access tiers — staff see only what their job needs." },
                { icon: FileBarChart, t: "Full audit trail", d: "Timestamped change logs on clinical, billing and prescription entries." },
                { icon: ShieldCheck, t: "Secure cloud infrastructure", d: "Encrypted connections and automatic cloud backups — no local server to fail." },
              ].map((b) => (
                <li key={b.t} className="eye-panel flex gap-3 rounded-2xl p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10"><b.icon className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-card-foreground">{b.t}</h3>
                    <p className="text-xs leading-snug text-muted-foreground">{b.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <DentalTrust />
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 lg:pb-24">


          <section id="features" className="scroll-mt-24">
            <motion.h2 initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              What you get, <span className="text-muted-foreground">in plain words</span>
            </motion.h2>
            <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-10 max-w-2xl text-muted-foreground">
              One simple place for your patients, your appointments, your money and your stock — instead of the folders, notebooks and endless chats that eat your evenings.
            </motion.p>
            <div className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-6 lg:mb-24">
              {modules.map((item, i) => {
                const span = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4", "md:col-span-3", "md:col-span-3"][i];
                const wide = i === 0 || i === 3;
                return (
                  <motion.article key={item.name} initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className={`eye-panel group min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl ${span} ${wide ? "lg:grid lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-6" : "flex flex-col"} p-5 sm:p-6`}>
                    <div className={wide ? "lg:order-2" : ""}>
                      <Screenshot src={item.shot} alt={item.shotAlt} />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><item.icon className="h-5 w-5 text-primary" /></div>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{String(i + 1).padStart(2, "0")} · {item.name}</span>
                      </div>
                      <h3 className="mb-2 text-lg font-bold leading-snug text-card-foreground sm:text-xl">{item.benefit}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <DentalSavings />

          <section className="mb-16 lg:mb-24">
            <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">A patient's visit</motion.p>
            <motion.h2 initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-8 text-2xl font-bold text-foreground md:text-3xl">
              From the front door to the payment, <span className="text-muted-foreground">one record the whole way</span>
            </motion.h2>
            <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
              {[
                { icon: CalendarClock, t: "Booked", d: "Chair and dentist reserved, reminder sent." },
                { icon: Users, t: "Checked in", d: "Front desk sees them join the queue." },
                { icon: Smile, t: "In the chair", d: "Tooth chart, notes and X-rays open together." },
                { icon: Boxes, t: "Materials used", d: "Stock updates from the treatment itself." },
                { icon: Wallet, t: "Paid", d: "Invoice or payment plan, on the same file." },
              ].map((s, i) => (
                <motion.li key={s.t} initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="eye-panel relative w-[72%] shrink-0 snap-start rounded-2xl p-5 sm:w-[45%] md:w-auto">
                  <span className="mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <s.icon className="h-4 w-4 text-primary" />
                  </span>
                  <h3 className="mb-1 text-base font-semibold text-card-foreground">{s.t}</h3>
                  <p className="text-sm leading-snug text-muted-foreground">{s.d}</p>
                </motion.li>
              ))}
            </ol>
          </section>

          <section id="ai" className="mb-16 scroll-mt-24 lg:mb-24">
            <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary"><Sparkles className="h-4 w-4" /> AI in your clinical workflow</motion.p>
            <motion.h2 initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              An assistant beside the chair, <span className="text-muted-foreground">not another screen to learn</span>
            </motion.h2>
            <motion.p initial="hidden" whileInView="show" viewport={viewport} variants={reveal} className="mb-10 max-w-2xl text-muted-foreground">
              Clinexus AI reads the patient's own history and chart — it never invents facts, and it never changes a record without you. You review, edit and approve every suggestion.
            </motion.p>
            <div className="grid gap-4 md:grid-cols-2">
              {aiFeatures.map((f, i) => (
                <motion.article key={f.name} initial="hidden" whileInView="show" viewport={viewport} variants={slide(i % 2 ? "right" : "left")} className="eye-panel min-w-0 overflow-hidden rounded-2xl p-5 sm:rounded-3xl sm:p-6">
                  <Screenshot src={f.shot} alt={f.shotAlt} />
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><f.icon className="h-5 w-5 text-primary" /></div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{f.name}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold leading-snug text-card-foreground">{f.benefit}</h3>
                  <ul className="space-y-2">{f.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{p}</span></li>)}</ul>
                </motion.article>
              ))}
            </div>
          </section>

          <CapabilityMatrix
            kicker="The rest of the clinic"
            title="Already in there,"
            subtitle="not another product to buy"
            intro="Seeing patients is only half your job. The money, the stock, the staff — it all lives in the same system, using the same records."
            groups={matrixGroups}
          />

          <div className="mb-16 grid gap-4 md:grid-cols-12 lg:mb-24">
            <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={slide("left")} className="eye-panel col-span-12 min-w-0 rounded-2xl p-5 sm:rounded-3xl sm:p-8 md:col-span-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <h3 className="mb-2 text-xl font-bold text-card-foreground">Know what's happening, every day</h3>
              <p className="mb-5 font-medium text-primary">Without chasing anyone for an update.</p>
              <ul className="space-y-2.5">{["Patient count, pending payments and this month's revenue, right up front", "Today's schedule and who's next, plus a live activity feed", "Reports that answer the questions you actually ask"].map((point) => <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{point}</span></li>)}</ul>
            </motion.section>
            <motion.section initial="hidden" whileInView="show" viewport={viewport} variants={slide("right")} className="eye-panel col-span-12 min-w-0 rounded-2xl p-5 sm:rounded-3xl sm:p-8 md:col-span-5">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><ShieldCheck className="h-5 w-5 text-primary" /></div>
              <h3 className="mb-2 text-xl font-bold text-card-foreground">Everyone sees only what they should</h3>
              <p className="mb-5 font-medium text-primary">Reception doesn't see your finances. Simple.</p>
              <div className="flex flex-wrap gap-2">{roles.map((role) => <span key={role} className="rounded-full border border-primary/20 px-3 py-1 text-xs text-muted-foreground">{role}</span>)}</div>
            </motion.section>
          </div>

          <PricingEstimator included={included} pricingHref="/industries/dental-clinics/pricing" casesHref="/industries/dental-clinics/how-cases-work" />

          <ClosingBanner
            title="See it with your own patients"
            body="Tell us how your clinic handles booking, charting and billing — and the part that frustrates you most — and we'll show you Clinexus doing exactly that, not a generic demo."
            whatsapp={WHATSAPP}
            trust={["Every feature included", "No monthly subscription", "Role-based access for 9 staff roles", "Audit trail on every change"]}
          />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
        <LocalSeo specialty="Dental clinics" />
      </div>
    </Layout>
  );
};

export default DentalClinics;
