import Layout from "@/site/components/Layout";
import { ClinicalHero } from "@/site/components/heroes";
import heroPhoto from "@/assets/site/hero-eye.jpg";
import heroShotAsset from "@/assets/current-dashboard/eye-exams.png.asset.json";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LocalSeo } from "@/site/components/LocalSeo";
import {
  ArrowRight,
  MessageCircle,
  Check,
  Eye,
  Glasses,
  ClipboardList,
  Activity,
  LineChart,
  CalendarClock,
  FileBarChart,
  Users,
  Wallet,
  Boxes,
  Megaphone,
  MessageSquare,
  Globe,
  ShieldCheck,
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

const eyeModules = [
  {
    icon: Eye,
    name: "Eye Overview",
    benefit: "Start the day already knowing who needs attention.",
    body: "The eye clinic home screen pulls the day into one view, who's booked, whose pressures are trending the wrong way, which recalls are overdue, so nothing waits for someone to remember it.",
  },
  {
    icon: ClipboardList,
    name: "Eye Exams",
    benefit: "A patient's whole visual history in one scroll.",
    body: "Every examination is recorded against the patient rather than a folder, so when they return in eighteen months you're comparing readings, not reconstructing them from memory.",
  },
  {
    icon: Glasses,
    name: "Optical Prescriptions",
    benefit: "Prescriptions that can't be misread or lost.",
    body: "Glasses and lens prescriptions are written once, per eye, with issue and expiry dates tracked, so dispensing works from the same numbers the clinician wrote, and expired scripts surface before a patient is turned away.",
  },
  {
    icon: Activity,
    name: "Contact Lenses",
    benefit: "Aftercare stops depending on the patient remembering.",
    body: "Fittings hold the brand, modality and fit assessment, and the aftercare check is scheduled from the fitting itself, which keeps wearers safe and keeps them coming back to you for replacements.",
  },
  {
    icon: Boxes,
    name: "Optical Orders",
    benefit: "Answer \"are my glasses ready?\" in two seconds.",
    body: "Frames and lenses move through ordered, at lab, ready and collected with promised dates attached, so front desk can answer without calling the lab and no order quietly stalls for a fortnight.",
  },
  {
    icon: LineChart,
    name: "Eye Diagnostics",
    benefit: "Test results that stay attached to the patient story.",
    body: "OCT, fields, fundus imaging and biometry are logged with their files against findings, so results are evidence you can act on later, not attachments buried in a shared drive.",
  },
  {
    icon: FileBarChart,
    name: "Eye Charts",
    benefit: "See slow deterioration while it's still early.",
    body: "Acuity, IOP and diagnostic values plot themselves per eye over time, which turns a series of ordinary visits into a trend a clinician can actually read at a glance.",
  },
  {
    icon: CalendarClock,
    name: "Surgery Bookings",
    benefit: "Nothing about theatre day left to chase.",
    body: "Procedure, eye side, theatre slot, IOL choice, pre-op checks and consent sit on the same booking, so the list is confirmed from one record and post-op outcomes go back to the same place.",
  },
  {
    icon: FileBarChart,
    name: "Eye Reports",
    benefit: "Answers about the clinic, without a spreadsheet night.",
    body: "Eye-specific reporting shows what you're actually doing, exam volumes, dispensing, surgical throughput, so decisions about staffing or stock are made on numbers, not impressions.",
  },
];

const coreGroups = [
  {
    icon: Users,
    title: "Patient care & scheduling",
    benefit: "Fewer no-shows, shorter waits, calmer front desk.",
    points: [
"Full patient profiles that hold history, files and correspondence in one place",
"Appointments, staff schedules and a live waiting list so walk-ins don't derail the day",
"Treatments, prescriptions and consent forms captured digitally and signed on the spot",
"Treatment materials linked to what was used, so stock and clinical notes agree",
    ],
  },
  {
    icon: Wallet,
    title: "Finance & billing",
    benefit: "Know what you earned, what it cost and what's still owed.",
    points: [
"Invoicing and estimates so patients see the price before they commit",
"Payment plans for higher-value work like surgery or premium lenses",
"Expenses, staff commission payouts and revenue allocation tracked as they happen",
"Profitability by service, so you know which parts of the clinic actually pay",
"Your own Clinexus subscription managed from inside the clinic",
    ],
  },
  {
    icon: Boxes,
    title: "Inventory & supply chain",
    benefit: "Never lose a sale to an empty shelf or a forgotten reorder.",
    points: [
"Frames, lenses, drops and consumables tracked with real cost, not guesswork",
"Suppliers and purchase orders kept against the items they deliver",
"Shop management so the clinic sells product through its own public storefront",
    ],
  },
  {
    icon: Megaphone,
    title: "Marketing suite",
    benefit: "Bring back the patients you already earned.",
    points: [
"Email and SMS blasts for recalls, promotions and seasonal checks",
"Social content and promotions planned in the same system that holds the patient list",
"Reviews and referrals turned into a repeatable source of new patients",
"Recall and reactivation campaigns for lapsed patients, with analytics on what worked",
    ],
    note: "Currently behind a maintenance flag while it's finished.",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    benefit: "Less shouting across the corridor, fewer dropped handovers.",
    points: [
"Internal messages between staff kept next to the patient they concern",
"Notifications that surface what needs action rather than burying it",
"Patient reviews collected and answered in one thread",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Reports & admin",
    benefit: "Run the clinic on evidence, and prove what happened.",
    points: [
"Reports and advanced analytics across clinical, financial and operational activity",
"Staff management, documents and clinic settings in one administrative home",
"Audit log showing who did what and when, useful long before anyone disputes it",
"Automation for routine steps, plus tutorials so new staff get productive quickly",
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
"Doctor / optometrist",
"Receptionist",
"Hygienist",
"Assistant",
"Accountant",
"Lab technician",
"Lab assistant",
];

const EyeClinicFeatures = () => {
  return (
    <Layout>
      <ClinicalHero
        kicker="Clinexus for eye clinics, Features"
        title="Everything your eye clinic runs on, in one workspace."
        description="Clinexus is a multi-clinic platform, dental, eye care and diagnostic centres. An eye clinic gets its own workspace with a sidebar built around eye care, plus every part of running a practice underneath it. Here's what that gives you, day to day."
        photo={{ src: heroPhoto, alt: "Optometrist examining a patient at a slit lamp" }}
        card={{ src: heroShotAsset.url, alt: "Eye exams with refraction and findings", caption: "Eye exams with refraction and findings" }}
        primary={{ label: "Talk to us on WhatsApp", href: WHATSAPP, external: true }}
        secondary={{ label: "See the eye clinic overview", href: "/industries/eye-clinics" }}
        points={[
          { value: "20+", label: "Modules covering every part of the practice" },
          { value: "1", label: "Workspace for clinical work and the money side" },
          { value: "9", label: "Staff roles with their own access" },
        ]}
      />
      <div className="eye-theme">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-16">

          {/* Eye-specific modules */}
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={reveal}
            className="mb-4 text-2xl font-bold text-foreground md:text-3xl"
          >
            The eye care modules -{" "}
            <span className="text-muted-foreground">what they save you from</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={reveal}
            className="mb-10 max-w-2xl text-muted-foreground"
          >
            These are the screens in your sidebar. Each one exists because something in a busy eye clinic
            usually gets lost, a trend, an aftercare date, an order at the lab.
          </motion.p>

          <div className="mb-24 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eyeModules.map((m, i) => (
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
            Clinical work is only half of a practice. The other half, money, stock, staff, patients you
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
                    : i === 4
                      ? "eye-panel-accent rounded-3xl p-8"
                      : "eye-panel rounded-3xl p-8"
                }
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <g.icon className={i === 1 || i === 4 ? "h-5 w-5" : "h-5 w-5 text-primary"} />
                </div>
                <h3 className="mb-2 text-xl font-bold">{g.title}</h3>
                <p
                  className={
                    i === 1 || i === 4 ? "mb-5 font-medium opacity-80" : "mb-5 font-medium text-primary"
                  }
                >
                  {g.benefit}
                </p>
                <ul className="space-y-2.5">
                  {g.points.map((p) => (
                    <li
                      key={p}
                      className={
                        i === 1 || i === 4
                          ? "flex items-start gap-2.5 text-sm leading-relaxed opacity-90"
                          : "flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                      }
                    >
                      <Check
                        className={
                          i === 1 || i === 4
                            ? "mt-0.5 h-4 w-4 shrink-0"
                            : "mt-0.5 h-4 w-4 shrink-0 text-primary"
                        }
                      />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                {g.note && (
                  <p
                    className={
                      i === 1 || i === 4
                        ? "mt-5 text-xs opacity-70"
                        : "mt-5 text-xs text-muted-foreground/60"
                    }
                  >
                    {g.note}
                  </p>
                )}
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
                Access follows the role. Staff management stays with owners and admins, billing opens for
                owners, admins, reception and accounts, clinical records stay with clinicians.
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
              Tell us how your clinic handles exams, dispensing, surgery and the money side today, and we'll
              walk through exactly which of these replaces what you're doing now.
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
        <LocalSeo specialty="Eye clinic features" />
      </div>
    </Layout>
  );
};

export default EyeClinicFeatures;
