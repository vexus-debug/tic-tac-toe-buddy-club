import Layout from "@/site/components/Layout";
import { ClinicalHero } from "@/site/components/heroes";
import heroPhoto from "@/assets/site/hero-dental.jpg";
import heroShotAsset from "@/assets/current-dashboard/dental-charts.png.asset.json";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LocalSeo } from "@/site/components/LocalSeo";
import {
  ArrowRight,
  MessageCircle,
  Check,
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarClock,
  ListTodo,
  CalendarDays,
  Star,
  Smile,
  Stethoscope,
  Pill,
  FileCheck,
  FileBarChart,
  Wallet,
  FileText,
  CreditCard,
  Receipt,
  Banknote,
  PieChart,
  TrendingUp,
  Boxes,
  Package,
  Truck,
  ClipboardList,
  ShieldCheck,
  Files,
  Globe,
  Store,
  MessageSquare,
  Bell,
  GraduationCap,
  Settings,
} from "lucide-react";

const WHATSAPP = "https://wa.me/2349017758165?text=Hello%20I%20would%20like%20to%20know%20more%20about%20Clinexus";
const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const slide = (dir: "left" | "right" | "up") => ({
  hidden: {
    opacity: 0,
    x: dir === "left" ? -70 : dir === "right" ? 70 : 0,
    y: dir === "up" ? 60 : 0,
  },
  show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.8, ease: EASE } },
});

const viewport = { once: true, margin: "-70px" };

const dentalModules = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    benefit: "Start the day knowing what's happening without asking anyone.",
    body: "See patient count, today's completion rate, pending payments and monthly revenue. Check who's next, their treatment and chair. Toggle revenue charts between 6-month and 1-year views, scan today's schedule, weekly stats, treatment breakdown and a live activity feed. Jump straight into registering a patient, booking an appointment or creating an invoice. Revenue figures stay hidden from non-financial roles.",
  },
  {
    icon: Users,
    name: "Patients",
    benefit: "Find any patient in seconds, however they phoned in.",
    body: "Search by name, ID or phone; filter active and inactive records; switch between table and card views. Register a patient with personal details, emergency contact and medical history. Call or WhatsApp them in one click, or quick-book an appointment from the row menu. Phone and email are only visible to admins and receptionists.",
  },
  {
    icon: UserCircle,
    name: "Patient Profile",
    benefit: "Everything about one patient, in one place.",
    body: "Treatment plans, prescriptions and visit history live in tabs. Write SOAP-format clinical notes, upload and tag X-rays and images to specific teeth, create invoices and see the outstanding balance, and keep allergies and medical alerts flagged up top. Documents are categorised so nothing scatters.",
  },
  {
    icon: CalendarClock,
    name: "Appointments",
    benefit: "No more double-booked chairs or clinicians who aren't in.",
    body: "Day, week and month calendar views. Book by patient, clinician, treatment and chair. A walk-in queue handles unplanned arrivals. Change appointment status live from Scheduled to In-Progress to Completed. Jump to any date and see chair availability at a glance.",
  },
  {
    icon: ListTodo,
    name: "Waiting List",
    benefit: "Turn walk-ins into an orderly queue instead of a crowd.",
    body: "Check patients in with a clinician and reason, watch live wait times, call or start the next patient and mark them done, see queue stats, and leave notes for the clinical team so handovers don't happen in the corridor.",
  },
  {
    icon: CalendarDays,
    name: "Schedules",
    benefit: "Clinician availability the system actually respects.",
    body: "Set each clinician's weekly working hours, day-on and day-off toggles, shift start and end times and breaks, so appointments can't be booked over lunch, days off or leave.",
  },
  {
    icon: Star,
    name: "Reviews",
    benefit: "Patient feedback that improves the practice, not just scores.",
    body: "Log feedback with a 1–5 rating and comments, tag it by Cleanliness, Professionalism, Wait Time or Communication, track average score and positive share, and search history by patient or clinician.",
  },
  {
    icon: Smile,
    name: "Dental Charts",
    benefit: "See the mouth, not a paragraph.",
    body: "Chart tooth-by-tooth conditions and treatments on an interactive adult chart. Tie work to the right tooth so the next clinician, patient or auditor can see exactly what was done where.",
  },
  {
    icon: Stethoscope,
    name: "Treatments",
    benefit: "Treatment plans that connect straight to billing and stock.",
    body: "Plan procedures, assign teeth, estimate costs and record what was actually delivered. Treatment plans flow into invoices, profitability and inventory so the clinical work and the money side agree.",
  },
  {
    icon: Pill,
    name: "Prescriptions",
    benefit: "Prescriptions written once, visible everywhere.",
    body: "Create and track prescriptions from the patient profile with medicines, dosage and duration, linked to the visit that prompted them.",
  },
  {
    icon: FileCheck,
    name: "Consent Forms",
    benefit: "Signed consent, captured properly.",
    body: "Generate consent forms tied to treatments, capture signatures digitally and keep them against the patient record for audits or disputes.",
  },
  {
    icon: FileBarChart,
    name: "Reports",
    benefit: "Know the clinic's story without spreadsheet nights.",
    body: "Standard clinic reports plus Advanced Analytics dashboards across clinical, financial and operational activity, so decisions are made on numbers rather than impressions.",
  },
];

const coreGroups = [
  {
    icon: Wallet,
    title: "Finance & billing",
    benefit: "Know what you earned, what it cost and what's still owed.",
    points: [
"Billing and invoicing with payment recording",
"Estimates before the patient commits to treatment",
"Payment plans for higher-value work like implants and orthodontics",
"Expenses tracked against the clinic",
"Staff commission payouts and revenue allocation",
"Profitability reporting by treatment and clinician",
    ],
  },
  {
    icon: Boxes,
    title: "Inventory & supply chain",
    benefit: "Never lose a procedure to an empty shelf or a forgotten reorder.",
    points: [
"Inventory and real-time stock levels",
"Inventory costs and valuation",
"Treatment materials linked directly to the treatments that consume them",
"Suppliers and purchase orders kept against the items they deliver",
"Stock levels visible before the next patient is in the chair",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Administration",
    benefit: "Run the clinic on evidence, and prove what happened.",
    points: [
"Staff records and role management",
"Documents stored and categorised",
"Audit log showing who changed what and when",
"Website settings for the public clinic site",
"Shop management for products patients can buy online",
    ],
  },
  {
    icon: MessageSquare,
    title: "Communication & everywhere features",
    benefit: "Less shouting across the corridor, fewer dropped handovers.",
    points: [
"Internal messages between staff",
"Notifications that surface what needs action",
"In-app tutorials to get new staff productive quickly",
"Settings, subscription and profile in one place",
"Access per screen set by clinic role",
    ],
  },
];

const publicPoints = [
"A public microsite for the clinic at its own address, with an online shop attached",
"Patients can look up their results without an account or a phone call to reception",
"Everything the public sees is driven by the same records staff already maintain",
];

const roles = [
"Owner",
"Admin",
"Dentist",
"Receptionist",
"Hygienist",
"Assistant",
"Accountant",
"Lab technician",
"Lab assistant",
];

const DentalClinicFeatures = () => {
  return (
    <Layout>
      <ClinicalHero
        kicker="Clinexus for dental clinics, Features"
        title="Everything your dental practice runs on, in one workspace."
        description="Clinexus is a multi-clinic platform, dental, eye care and diagnostic centres. A dental practice gets its own workspace with a sidebar built around dentistry, plus every part of running a practice underneath it. Here's what that gives you, day to day."
        photo={{ src: heroPhoto, alt: "Dentist treating a smiling patient in a modern dental operatory" }}
        card={{ src: heroShotAsset.url, alt: "Per-tooth charting with condition colours", caption: "Per-tooth charting with condition colours" }}
        primary={{ label: "Talk to us on WhatsApp", href: WHATSAPP, external: true }}
        secondary={{ label: "See the dental clinic overview", href: "/industries/dental-clinics" }}
        points={[
          { value: "30+", label: "Modules covering every part of the practice" },
          { value: "1", label: "Workspace for clinical work and the money side" },
          { value: "9", label: "Staff roles with their own access" },
        ]}
      />
      <div className="eye-theme">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-16">

          {/* Dental-specific modules */}
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={reveal}
            className="mb-4 text-2xl font-bold text-foreground md:text-3xl"
          >
            The dental workflow -{" "}
            <span className="text-muted-foreground">what it saves you from</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={reveal}
            className="mb-10 max-w-2xl text-muted-foreground"
          >
            These are the screens in your sidebar. Each one exists because something in a busy dental
            practice usually gets lost, a chart, a wait time, a payment plan, a stock level.
          </motion.p>

          <div className="mb-24 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dentalModules.map((m, i) => (
              <motion.article
                key={m.name}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={slide(i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up")}
                transition={{ delay: (i % 3) * 0.08 }}
                whileHover={{ y: -5 }}
                className="eye-panel flex flex-col rounded-3xl p-7"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-display text-3xl font-bold text-primary/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-card-foreground">{m.name}</h3>
                <p className="mb-3 font-medium text-primary">{m.benefit}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{m.body}</p>
              </motion.article>
            ))}
          </div>

          {/* Core clinic features */}
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={reveal}
            className="mb-4 text-2xl font-bold text-foreground md:text-3xl"
          >
            The rest of the clinic -{" "}
            <span className="text-muted-foreground">included, not a separate product</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={reveal}
            className="mb-10 max-w-2xl text-muted-foreground"
          >
            Clinical work is only half of a practice. The other half, money, stock, staff and patients you
            haven't seen in a year, sits in the same system, using the same records.
          </motion.p>

          <div className="mb-24 grid gap-4 md:grid-cols-2">
            {coreGroups.map((g, i) => (
              <motion.article
                key={g.title}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                variants={slide(i % 2 === 0 ? "left" : "right")}
                whileHover={{ y: -5 }}
                className={
                  i === 1
                    ? "eye-panel-light rounded-3xl p-8"
                    : i === 3
                      ? "eye-panel-accent rounded-3xl p-8"
                      : "eye-panel rounded-3xl p-8"
                }
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <g.icon className={i === 1 || i === 3 ? "h-5 w-5" : "h-5 w-5 text-primary"} />
                </div>
                <h3 className="mb-2 text-xl font-bold">{g.title}</h3>
                <p
                  className={
                    i === 1 || i === 3 ? "mb-5 font-medium opacity-80" : "mb-5 font-medium text-primary"
                  }
                >
                  {g.benefit}
                </p>
                <ul className="space-y-2.5">
                  {g.points.map((p) => (
                    <li
                      key={p}
                      className={
                        i === 1 || i === 3
                          ? "flex items-start gap-2.5 text-sm leading-relaxed opacity-90"
                          : "flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                      }
                    >
                      <Check
                        className={
                          i === 1 || i === 3
                            ? "mt-0.5 h-4 w-4 shrink-0"
                            : "mt-0.5 h-4 w-4 shrink-0 text-primary"
                        }
                      />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>

          {/* Public-facing */}
          <div className="mb-24 grid gap-4 md:grid-cols-12">
            <motion.section
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={slide("left")}
              className="eye-panel col-span-12 rounded-3xl p-8 md:col-span-7"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-card-foreground">
                A public face for the clinic, kept up to date by itself
              </h3>
              <p className="mb-5 font-medium text-primary">
                Patients can find you, buy from you and check results without tying up reception.
              </p>
              <ul className="space-y-2.5">
                {publicPoints.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

            <motion.section
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={slide("right")}
              className="eye-panel col-span-12 rounded-3xl p-8 md:col-span-5"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-card-foreground">
                Everyone sees their own job, and only their own job
              </h3>
              <p className="mb-5 font-medium text-primary">
                Staff aren't trusted with everything by default, and nobody wastes time in screens that
                aren't theirs.
              </p>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                Access follows the role. Owners and admins see everything; narrower roles lose finance,
                staff, audit and settings screens. Billing opens for owners, admins, reception and accounts;
                clinical records stay with clinicians.
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-primary/20 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </motion.section>
          </div>

          {/* CTA */}
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={reveal}
            className="eye-panel rounded-[3rem] p-8 text-center md:p-12"
            style={{ borderColor: "hsl(var(--primary) / 0.3)" }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Next step</p>
            <h2 className="mb-5 text-3xl font-bold text-card-foreground">
              See these features against your own clinic
            </h2>
            <p className="mx-auto mb-10 max-w-2xl leading-relaxed text-muted-foreground">
              Tell us how your clinic handles charting, scheduling, billing and the money side today, and
              we'll walk through exactly which of these replaces what you're doing now.
            </p>
            <div className="inline-flex flex-col gap-4 md:flex-row">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-10 py-4 font-bold text-primary-foreground transition-colors hover:bg-foreground"
              >
                <MessageCircle className="h-5 w-5" />
                Talk to us on WhatsApp
              </a>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-primary px-10 py-4 font-bold text-primary transition-colors hover:bg-primary/10"
              >
                Try demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <LocalSeo specialty="Dental clinic features" />
      </div>
    </Layout>
  );
};

export default DentalClinicFeatures;
