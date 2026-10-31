/**
 * Clinexus articles (blog). Add new articles to `articles` below.
 * Body is a list of simple blocks so posts render consistently.
 */
import { articleExtensions, estimateReadMinutes } from "./articleExtensions";
import dentalRecall from "@/assets/articles/dental-recall.jpg";
import eyeDispensary from "@/assets/articles/eye-dispensary.jpg";
import frontDesk from "@/assets/articles/front-desk.jpg";
import clinicOwner from "@/assets/articles/clinic-owner.jpg";
import dentalTech from "@/assets/dental-technology.jpg";
import clinicInterior from "@/assets/clinic-interior.jpg";
import dentistPatient from "@/assets/dentist-patient.jpg";
import hereSmile from "@/assets/hero-smile.jpg";
import aDentalCharts from "@/assets/current-dashboard/dental-charts.png.asset.json";
import aDentalTreatments from "@/assets/current-dashboard/dental-treatments.png.asset.json";
import aDentalProfit from "@/assets/current-dashboard/dental-profitability.png.asset.json";
import aDentalBilling from "@/assets/current-dashboard/dental-billing.png.asset.json";
import aDentalInventory from "@/assets/current-dashboard/dental-inventory.png.asset.json";
import aDentalAppointments from "@/assets/current-dashboard/dental-appointments.png.asset.json";
import aDentalDashboard from "@/assets/current-dashboard/dental-dashboard.png.asset.json";
import aDentalPatients from "@/assets/current-dashboard/dental-patients.png.asset.json";
import aEyeOrders from "@/assets/current-dashboard/eye-orders.png.asset.json";
import aEyePrescriptions from "@/assets/current-dashboard/eye-prescriptions.png.asset.json";
import aEyeExams from "@/assets/current-dashboard/eye-exams.png.asset.json";
import aEyeSurgery from "@/assets/current-dashboard/eye-surgery.png.asset.json";
import aEyeContacts from "@/assets/current-dashboard/eye-contact-lenses.png.asset.json";

const dentalCharts = aDentalCharts.url;
const dentalTreatments = aDentalTreatments.url;
const dentalProfit = aDentalProfit.url;
const dentalBilling = aDentalBilling.url;
const dentalInventory = aDentalInventory.url;
const dentalAppointments = aDentalAppointments.url;
const dentalDashboard = aDentalDashboard.url;
const dentalPatients = aDentalPatients.url;
const eyeOrders = aEyeOrders.url;
const eyePrescriptions = aEyePrescriptions.url;
const eyeExams = aEyeExams.url;
const eyeSurgery = aEyeSurgery.url;
const eyeContacts = aEyeContacts.url;


export type ArticleCategorySlug =
  | "practice"
  | "marketing"
  | "dental"
  | "eye-care"
  | "laboratory"
  | "technology";

export interface ArticleCategory {
  slug: ArticleCategorySlug;
  name: string;
  group: "Topics" | "Specialties";
  description: string;
}

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "tip"; title?: string; text: string }
  | { type: "image"; src: string; alt: string; caption?: string };

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategorySlug;
  publishedAt: string; // ISO date
  readMinutes: number;
  author: { name: string; role: string };
  cover?: string;
  featured?: boolean;
  body: ArticleBlock[];
}

export const articleCategories: ArticleCategory[] = [
  { slug: "practice", name: "Practice management", group: "Topics", description: "Running the clinic day to day, scheduling, staff, billing and stock." },
  { slug: "marketing", name: "Marketing", group: "Topics", description: "Finding new patients, keeping existing ones and building a local reputation." },
  { slug: "technology", name: "Technology & compliance", group: "Topics", description: "Records, data protection, consent and going paperless." },
  { slug: "dental", name: "Dental", group: "Specialties", description: "Charting, treatment plans, lab work and the dental chair." },
  { slug: "eye-care", name: "Eye care", group: "Specialties", description: "Exams, optical dispensing, contact lenses and diagnostics." },
  { slug: "laboratory", name: "Laboratory", group: "Specialties", description: "Test menus, sample flow, results and turnaround time." },
];

const team = {
  name: "Clinexus Editorial Team",
  role: "Practice operations, Clinexus",
};
const dentalDesk = { name: "Clinexus Dental Desk", role: "Dental workflow specialists" };
const eyeDesk = { name: "Clinexus Eye Care Desk", role: "Optometry & optical workflow specialists" };

export const articles: Article[] = [
  // ───────────────────────── DENTAL ─────────────────────────
  {
    slug: "how-case-credits-work",
    title: "Pay per case: how Clinexus case credits work",
    excerpt: "No fixed subscription. You pay ₦1,000 per patient case. Here is exactly when a credit is used, what it covers, and examples.",
    category: "dental",
    publishedAt: "2026-10-25",
    readMinutes: 5,
    author: dentalDesk,
    cover: dentalBilling,
    body: [
      { type: "p", text: "Instead of a fixed monthly fee, your clinic only pays for the patients you actually treat. Quiet month, small bill. Busy month, you pay for the work you did." },
      { type: "h2", text: "The short version" },
      { type: "list", items: [
        "1 case = 1 credit = ₦1,000.",
        "A case is one patient's care for 30 days, up to 3 visits.",
        "You buy credits in advance and they are used as you go.",
        "At zero credits, old records stay open but new cases are blocked until you top up.",
      ] },
      { type: "h2", text: "When is a credit used?" },
      { type: "p", text: "A credit is used the first time you do any clinical work for a patient who has no open case. That includes booking an appointment, checking in a walk-in, or adding a note, treatment plan, chart entry, X-ray or photo, prescription, lab order or invoice." },
      { type: "p", text: "After that, everything for that patient is covered for 30 days, up to 3 visits." },
      { type: "h2", text: "What is free?" },
      { type: "list", items: [
        "Registering a new patient.",
        "Viewing old records, charts and reports.",
        "Editing anything inside an open case.",
      ] },
      { type: "h2", text: "Examples" },
      { type: "h3", text: "1. Routine check-up" },
      { type: "p", text: "Ada comes for scaling and polishing, then returns 2 weeks later for a review. Both visits fall in one case: 1 credit, ₦1,000." },
      { type: "h3", text: "2. Root canal and crown" },
      { type: "p", text: "Emeka has 3 root canal visits within 30 days: 1 credit. He returns on day 40 for his crown, so a new case opens: 2 credits in total, ₦2,000." },
      { type: "h3", text: "3. Walk-in who returns later" },
      { type: "p", text: "Fatima walks in with toothache in January and comes back in March for a filling. Two separate cases: 2 credits." },
      { type: "h3", text: "4. Many visits in one month" },
      { type: "p", text: "A patient on a treatment plan visits 4 times in one month. Visits 1–3 use the first case; visit 4 opens a new case: 2 credits." },
      { type: "tip", title: "Budget tip", text: "Count roughly how many different patients you see each month and keep at least that many credits in your wallet." },
      { type: "h2", text: "Fair use rules" },
      { type: "list", items: [
        "Deleting or cancelling a visit does not return the credit.",
        "A patient's name and date of birth are locked after their first case, so one record cannot be reused for someone else.",
        "Moving an old appointment to a new date outside its 30 days opens a new case.",
        "A finished waiting-room ticket cannot be reopened.",
      ] },
      { type: "h2", text: "Checking your balance" },
      { type: "p", text: "Your credit balance shows on the wallet button at the top of the dashboard. It turns red below 5 credits. Tap it and choose 'How credits work' for a quick reminder. To top up, contact Clinexus support." },
    ],
  },
  {
    slug: "why-patients-abandon-root-canal-treatment",
    title: "Why your patients start root canals and never come back to finish",
    excerpt:
      "The pain stops after the first visit, so the patient stops coming. Here is how to close the gap between stage one and the crown, without chasing anyone on your personal phone.",
    category: "dental",
    publishedAt: "2026-10-14",
    readMinutes: 8,
    author: dentalDesk,
    cover: dentalRecall,
    featured: true,
    body: [
      { type: "p", text: "You know this patient. He came in on a Monday with his cheek swollen, barely sleeping. You opened the tooth, cleaned the canals, placed a temporary dressing and told him to come back next week. He said, \"Doctor, I will come, no wahala.\" Then the pain went away, and so did he." },
      { type: "p", text: "Four months later he is back, the tooth has cracked down to the root, and now it is an extraction. He thinks the treatment failed. You know the treatment was never finished." },
      { type: "h2", text: "The real reason they disappear" },
      { type: "p", text: "In most Nigerian practices we speak with, it is rarely about money alone. It is a mix of three things:" },
      { type: "list", items: [
        "Relief removes urgency. Once the pain stops, the second visit competes with school fees, work and Lagos traffic.",
        "Nobody owns the follow-up. The receptionist assumes the dentist will call; the dentist assumes the front desk booked it.",
        "The patient never saw the whole plan. He agreed to 'treatment', not to 'three visits and a crown costing ₦X'.",
      ] },
      { type: "h2", text: "Show the full plan on day one" },
      { type: "p", text: "Patients commit to what they can see. When the whole journey, access and cleaning, obturation, post and core, crown, is laid out on the chart with the cost of each stage, the second visit stops being a surprise and becomes the next step." },
      { type: "image", src: dentalCharts, alt: "Clinexus dental chart with tooth-by-tooth treatment staging", caption: "Each tooth carries its own staged plan, so anyone at the clinic can see what is pending." },
      { type: "tip", title: "Try this tomorrow", text: "Before the patient leaves the chair, book the next stage while he is still holding his jaw. A date on the calendar is ten times stronger than 'call us when you are ready'." },
      { type: "h2", text: "Make the follow-up automatic, not personal" },
      { type: "p", text: "Reminders sent from a receptionist's own WhatsApp disappear when she resigns, changes SIM or simply forgets during a busy Saturday. In Clinexus, unfinished treatment plans surface on the dashboard and recalls go out from the clinic, in the clinic's name." },
      { type: "image", src: dentalTreatments, alt: "Clinexus treatments screen showing pending and completed procedures", caption: "Pending stages stay visible until they are completed or deliberately closed." },
      { type: "h2", text: "Let them pay in steps" },
      { type: "p", text: "A ₦250,000 root canal and crown is a hard 'yes' in one go. Split across a deposit and two instalments tied to each stage, it becomes manageable, and the deposit itself is a commitment to return. Payment plans in Clinexus track what has been paid against each stage so your front desk never has to guess." },
      { type: "quote", text: "The best recall system is the one that still works on the day your best receptionist is on leave." },
      { type: "h2", text: "What to measure" },
      { type: "list", items: [
        "Percentage of multi-visit plans completed within 60 days.",
        "Number of open treatment plans older than 30 days.",
        "Revenue sitting in unfinished stages, the money you already earned clinically but have not collected.",
      ] },
      { type: "p", text: "Once you can see that last number every morning, you will never look at a missed appointment the same way again." },
    ],
  },
  {
    slug: "dental-lab-cases-lost-in-lagos-traffic",
    title: "The crown is not back from the lab, again. Fixing dental lab chaos",
    excerpt:
      "Impressions sent by dispatch rider, no tracking, patients turning up for fitting to an empty tray. A calmer way to run lab work between your clinic and your technician.",
    category: "dental",
    publishedAt: "2026-10-06",
    readMinutes: 6,
    author: dentalDesk,
    cover: dentalTech,
    body: [
      { type: "p", text: "Your patient took permission from work, sat in traffic from Ajah, and arrived on time for her crown fitting. The crown is not there. The technician says the impression 'just came yesterday'. The dispatch rider says he delivered it last week. Everyone is apologising and nobody has a record." },
      { type: "h2", text: "Where lab work actually breaks" },
      { type: "list", items: [
        "No single record of when a case left the clinic and when it was received.",
        "Shade, margin notes and special instructions written on a paper slip that gets lost or smudged.",
        "Fitting appointments booked before anyone confirms the lab's due date.",
        "Lab invoices arriving at month end with no way to match them to patients or treatments.",
      ] },
      { type: "h2", text: "Treat every case like a parcel with a tracking number" },
      { type: "p", text: "In Clinexus, a lab case is created from the patient's treatment, with the tooth, shade, material and due date attached. Sent, received at lab, in progress, returned, fitted, every status change is timestamped. If your lab also uses Clinexus, they see the case on their side the moment you send it." },
      { type: "tip", title: "A simple rule", text: "Never book the fitting until the lab has accepted the case and given a due date. Then book the patient two days after it, not on the day." },
      { type: "h2", text: "Know what each case really cost you" },
      { type: "p", text: "Lab fees are one of the biggest costs in restorative dentistry, yet most clinics only see them as a lump sum. When each lab invoice is tied to the case and the patient, you can finally see the true margin on a zirconia crown versus a PFM, and price accordingly." },
      { type: "image", src: dentalProfit, alt: "Clinexus profitability view by treatment", caption: "Profitability by treatment, with lab and material costs taken into account." },
      { type: "p", text: "The result is fewer embarrassing phone calls, fewer wasted patient trips, and a lab relationship built on records instead of memory." },
    ],
  },
  {
    slug: "stop-front-desk-leakage-dental-clinic",
    title: "Where the money goes: stopping quiet leakage at your dental front desk",
    excerpt:
      "Unconfirmed transfers, cash with no receipt, consumables that vanish. Not accusations, just gaps. Here is how to close them without turning your clinic into a police station.",
    category: "dental",
    publishedAt: "2026-09-25",
    readMinutes: 7,
    author: dentalDesk,
    cover: frontDesk,
    body: [
      { type: "p", text: "Most clinic owners we meet are not worried about one big theft. They are worried about the feeling that the numbers never quite add up. The chair was busy all week, yet the account balance says otherwise." },
      { type: "h2", text: "The usual gaps" },
      { type: "list", items: [
        "\"I have sent it\" transfers that nobody confirms against the bank alert.",
        "Cash payments for scaling and polishing recorded at the end of the day, from memory.",
        "Discounts given verbally with no approval.",
        "Composite, anaesthetic and impression material used with no link to a billed procedure.",
      ] },
      { type: "h2", text: "Every treatment creates a bill. Every bill shows how it was paid." },
      { type: "p", text: "When the dentist marks a procedure done, Clinexus raises the invoice automatically. The front desk records each payment by method, cash, POS, transfer, and partial payments stay open until settled. At close of day, the cash and POS totals are right there to compare." },
      { type: "image", src: dentalBilling, alt: "Clinexus dental billing screen with invoices and payment methods", caption: "Invoices, part-payments and methods in one place." },
      { type: "h2", text: "Let stock follow the treatment" },
      { type: "p", text: "Link the materials a procedure normally uses, and stock goes down when the treatment is done. When the shelf count and the system disagree, you have a specific question to ask, not a vague suspicion." },
      { type: "image", src: dentalInventory, alt: "Clinexus dental inventory with stock levels", caption: "Low-stock alerts arrive before you run out mid-procedure." },
      { type: "tip", title: "Keep it respectful", text: "Tell your team why you are doing this: so that honest staff are never under suspicion. Clear records protect them as much as they protect you." },
    ],
  },

  // ───────────────────────── EYE CARE ─────────────────────────
  {
    slug: "patients-take-prescription-buy-glasses-elsewhere",
    title: "They take your prescription and buy their glasses on the road",
    excerpt:
      "You did a careful refraction. The patient asks for the paper and walks to the optical shop outside. Why it happens, and how to keep dispensing revenue in-house without pressure.",
    category: "eye-care",
    publishedAt: "2026-10-16",
    readMinutes: 7,
    author: eyeDesk,
    cover: eyeDispensary,
    featured: true,
    body: [
      { type: "p", text: "The exam went well. Thirty minutes of careful work, a clear prescription, a patient who thanked you warmly. Then she said, \"Can I have the paper? I will check prices.\" You know exactly where she is going." },
      { type: "p", text: "For many eye clinics in Nigeria, the dispensary should be the steady income that carries the consulting room. Instead it leaks, one handwritten slip at a time." },
      { type: "h2", text: "Why patients walk" },
      { type: "list", items: [
        "The handover from exam room to dispensary is a gap: a slip, a corridor, and a wait.",
        "Nobody explains what the lenses are for, blue-cut for screen work, photochromic for the sun, thinner lenses for a high prescription.",
        "Prices are not visible, so patients assume the clinic is expensive.",
        "There is no follow-up when the order is not placed that day.",
      ] },
      { type: "h2", text: "Close the loop between exam and dispensing" },
      { type: "p", text: "In Clinexus, the prescription goes straight from the exam to the optical order screen. The dispenser already has the Rx when the patient sits down, no retyping, no misread cylinder or axis. The patient still gets a printed copy; they just no longer need it to buy." },
      { type: "image", src: eyeOrders, alt: "Clinexus optical orders screen", caption: "Orders tracked from prescription to collection." },
      { type: "tip", title: "Say it once, clearly", text: "\"Your prescription is ready at our dispensary, they already have it, and you can collect in three days.\" That one sentence keeps more patients than any discount." },
      { type: "h2", text: "Let patients see the options and the price" },
      { type: "p", text: "Show two or three frame-and-lens packages at different price points. A patient who sees a ₦35,000 option next to a ₦120,000 one rarely leaves to 'check prices', they choose." },
      { type: "image", src: eyePrescriptions, alt: "Clinexus eye prescriptions list", caption: "Every prescription stays on the patient's record for repeat orders." },
      { type: "h2", text: "Follow up the ones who did not order" },
      { type: "p", text: "A prescription without an order is a warm lead. A short, polite WhatsApp a few days later, from the clinic, not a personal phone, brings many of them back." },
    ],
  },
  {
    slug: "tracking-glaucoma-patients-over-years",
    title: "Glaucoma patients are for life. Your records should be too.",
    excerpt:
      "IOP readings scattered across paper cards, missed reviews, cataract cases booked on scraps of paper. A practical approach to long-term eye care records.",
    category: "eye-care",
    publishedAt: "2026-10-01",
    readMinutes: 6,
    author: eyeDesk,
    cover: eyeExams,
    body: [
      { type: "p", text: "A glaucoma patient may visit you twice a year for twenty years. Over that time, their file thickens, pages tear, a card is misfiled during a rush, and one day you are trying to compare today's pressure with a reading from three years ago that nobody can find." },
      { type: "h2", text: "What long-term care needs" },
      { type: "list", items: [
        "Visual acuity and IOP for each eye, recorded the same way every visit.",
        "A trend you can see at a glance, not a stack of cards to flip through.",
        "Review dates that remind the clinic, not just the patient.",
        "A clear path from diagnosis to surgery booking when a cataract is ready.",
      ] },
      { type: "image", src: eyeExams, alt: "Clinexus eye exam record", caption: "Structured OD/OS exam records, consistent across every clinician." },
      { type: "h2", text: "From exam to theatre without the paper trail" },
      { type: "p", text: "When surgery is indicated, Clinexus moves the patient into a surgical booking with the pre-op details already attached. Your theatre list, your consent forms and your post-op reviews sit in one place." },
      { type: "image", src: eyeSurgery, alt: "Clinexus eye surgery schedule", caption: "Surgical cases with pre-op and post-op status." },
      { type: "tip", title: "For your team", text: "Agree on one way to record IOP, method and time of day, and stick to it. Good software helps, but consistent habits make the trend trustworthy." },
    ],
  },
  {
    slug: "contact-lens-stock-and-reorders",
    title: "Contact lens patients are your most loyal, if you never run out",
    excerpt:
      "Wrong base curves, expired trial lenses, a toric order that takes a month. How to manage contact lens fittings, stock and reorders calmly.",
    category: "eye-care",
    publishedAt: "2026-09-18",
    readMinutes: 5,
    author: eyeDesk,
    cover: eyeContacts,
    body: [
      { type: "p", text: "A contact lens wearer who trusts you will come back every few months for years. Disappoint them once, wrong parameters, out of stock, 'come back next week', and they will try the pharmacy instead." },
      { type: "h2", text: "Record the full fit, every time" },
      { type: "p", text: "Base curve, diameter, power, cylinder and axis for each eye, plus the brand and wear schedule. When the patient calls for a reorder, anyone on your team can place it correctly without hunting for the original card." },
      { type: "image", src: eyeContacts, alt: "Clinexus contact lens records", caption: "Fitting parameters saved for quick, accurate reorders." },
      { type: "h2", text: "Watch the shelf" },
      { type: "list", items: [
        "Set reorder levels for your fast-moving powers.",
        "Track trial lens expiry so you are not fitting from expired stock.",
        "Raise purchase orders to suppliers from the same system that shows what is low.",
      ] },
      { type: "tip", text: "Look at which powers you reorder most often over three months. Stock those properly and special-order the rest." },
    ],
  },

  // ───────────────────────── PRACTICE ─────────────────────────
  {
    slug: "clinic-whatsapp-on-receptionist-phone",
    title: "Your clinic's WhatsApp lives on your receptionist's phone. That is a problem.",
    excerpt:
      "Patient numbers, appointment chats and reminders on a personal phone. What happens when she resigns, and how to keep patient communication with the clinic.",
    category: "practice",
    publishedAt: "2026-10-10",
    readMinutes: 5,
    author: team,
    cover: frontDesk,
    body: [
      { type: "p", text: "WhatsApp is how Nigerians talk. It makes sense that your clinic uses it. But in many practices, the 'clinic WhatsApp' is really one staff member's phone, and every patient conversation goes wherever that phone goes." },
      { type: "h2", text: "What you are risking" },
      { type: "list", items: [
        "Years of patient contacts leaving with a staff member.",
        "No record of what was promised to a patient, or when.",
        "Reminders that only go out when someone remembers to send them.",
        "Patient privacy on a device you do not control.",
      ] },
      { type: "h2", text: "Keep the conversation, change the source" },
      { type: "p", text: "Clinexus keeps appointments and patient details in the clinic's system and sends reminders and confirmations in the clinic's name. Your team still uses WhatsApp, they just are not the only memory of it." },
      { type: "image", src: dentalAppointments, alt: "Clinexus appointments calendar", caption: "Appointments, confirmations and no-shows in one shared calendar." },
      { type: "tip", title: "Start small", text: "Move your appointment book first. Once the calendar lives in the clinic's system, reminders and follow-ups follow naturally." },
    ],
  },
  {
    slug: "running-multiple-clinic-branches-nigeria",
    title: "Running two branches without living on Third Mainland Bridge",
    excerpt:
      "If you have to be physically present to know what is happening, you do not have a second branch, you have a second job. How owners stay in control remotely.",
    category: "practice",
    publishedAt: "2026-09-29",
    readMinutes: 6,
    author: team,
    cover: clinicOwner,
    body: [
      { type: "p", text: "The second branch was supposed to double your income. Instead, it doubled your driving. You leave Lekki for Ikeja to check the register, then back again before close, and still you are never fully sure what happened on the days you were not there." },
      { type: "h2", text: "What you actually need to see" },
      { type: "list", items: [
        "Patients seen today, per branch.",
        "What was billed and what was collected, by cash, POS and transfer.",
        "Outstanding balances and who is owing.",
        "Stock levels, so one branch is not ordering what the other has spare.",
      ] },
      { type: "image", src: dentalDashboard, alt: "Clinexus clinic dashboard with daily figures", caption: "One dashboard per branch, with leadership seeing all of them." },
      { type: "h2", text: "Give each person only what they need" },
      { type: "p", text: "Your branch manager sees their branch. Your dentists see their schedules. Your accountant sees the numbers. You see everything, from your phone, wherever you are." },
      { type: "quote", text: "Control is not being in every room. It is knowing what happened in every room." },
    ],
  },

  // ───────────────────────── TECHNOLOGY ─────────────────────────
  {
    slug: "patient-data-protection-nigeria-clinics",
    title: "Patient files on the reception counter: a quiet data protection risk",
    excerpt:
      "Nigeria's data protection law applies to clinics too. A plain-language look at what that means for paper folders, staff access and patient trust.",
    category: "technology",
    publishedAt: "2026-10-03",
    readMinutes: 6,
    author: team,
    cover: clinicInterior,
    body: [
      { type: "p", text: "Look at your reception counter right now. Is there a pile of patient folders, names facing up, sitting where anyone in the waiting room can read them? Most clinics have one. It feels normal. It is also exactly the kind of exposure Nigeria's data protection rules are meant to prevent." },
      { type: "p", text: "This is not legal advice, speak to your lawyer for that, but the principles are simple and worth acting on." },
      { type: "h2", text: "Three principles that matter" },
      { type: "list", items: [
        "Collect only what you need, and keep it secure.",
        "Let staff see only what their job requires.",
        "Be able to show who accessed or changed a record.",
      ] },
      { type: "h2", text: "What that looks like in practice" },
      { type: "p", text: "In Clinexus, every staff member has a role. The front desk sees contact details and bills, not clinical notes. Clinicians see the chart. Every change is written to an audit log. Records are stored securely in the cloud, not in a cabinet that floods in the rainy season." },
      { type: "image", src: dentalPatients, alt: "Clinexus patient records list", caption: "Patient records with access based on each staff member's role." },
      { type: "tip", title: "Today", text: "Move the folder pile off the counter. Small change, real difference, and patients notice." },
    ],
  },
  {
    slug: "clinic-software-power-and-network-outages",
    title: "When NEPA takes light mid-consultation: software that keeps up",
    excerpt:
      "Power cuts, inverter switches and network drops are part of running a clinic in Nigeria. What to look for so a consultation never stops halfway.",
    category: "technology",
    publishedAt: "2026-09-12",
    readMinutes: 4,
    author: team,
    cover: dentistPatient,
    body: [
      { type: "p", text: "You are halfway through writing notes when the light goes, the router reboots, and the generator takes its time. With some software, that means starting again. In a clinic, that is not acceptable." },
      { type: "h2", text: "What to expect from clinic software here" },
      { type: "list", items: [
        "Notes that save as drafts while you type, so a dropped connection does not lose them.",
        "Works on a phone or tablet when the desktop is off.",
        "Light enough to load on mobile data, not only on fibre.",
        "Installs like an app on your phone, with notifications.",
      ] },
      { type: "p", text: "Clinexus was built in Nigeria with these realities in mind. It runs in the browser, installs on your phone, and keeps your work-in-progress safe until the connection returns." },
    ],
  },

  // ───────────────────────── MARKETING ─────────────────────────
  {
    slug: "getting-patients-to-leave-google-reviews",
    title: "The patient who loved your clinic but never told anyone",
    excerpt:
      "Most new patients now check reviews before they call. How to ask happy patients for a review, naturally, at the right moment.",
    category: "marketing",
    publishedAt: "2026-09-22",
    readMinutes: 4,
    author: team,
    cover: hereSmile,
    body: [
      { type: "p", text: "Your best marketing is already walking out of your clinic every day, smiling. The problem is that they tell their sister, not the internet. Meanwhile, the one unhappy patient writes a long review." },
      { type: "h2", text: "Ask at the right moment" },
      { type: "p", text: "The right moment is when the patient is happiest: after the whitening, when the new glasses are on, when the pain is gone. A short message from the clinic later that day, with a direct review link, works far better than a sign on the wall." },
      { type: "list", items: [
        "Ask the same day, while the experience is fresh.",
        "Make it one tap, send the link, not instructions.",
        "Reply to every review, good or bad, calmly and without patient details.",
      ] },
      { type: "p", text: "Clinexus can collect patient feedback after visits, so you hear concerns privately first and invite happy patients to share publicly." },
    ],
  },

  // ───────────────────────── LABORATORY ─────────────────────────
  {
    slug: "diagnostic-lab-result-turnaround",
    title: "\"Is my result ready?\" Cutting the calls that clog your lab front desk",
    excerpt:
      "Patients waiting, phones ringing, results lost between the bench and reception. How diagnostic centres speed up turnaround and send results securely.",
    category: "laboratory",
    publishedAt: "2026-09-08",
    readMinutes: 5,
    author: team,
    cover: clinicInterior,
    body: [
      { type: "p", text: "In a busy diagnostic centre, the phone is often the enemy. Half the calls are patients asking whether their result is ready. Each call pulls someone away from the work that would actually make it ready." },
      { type: "h2", text: "Track the sample, not just the patient" },
      { type: "list", items: [
        "Label each sample at collection and record its status as it moves.",
        "Have results reviewed and approved before release, clearly marked.",
        "Notify the patient when the result is ready, with a secure link to view it.",
      ] },
      { type: "p", text: "Clinexus supports diagnostic centres with test menus, sample tracking and secure result links patients can check themselves, so your front desk can get back to the patients in front of them." },
      { type: "tip", text: "Tell patients at collection exactly when to expect results and how they will be notified. Most 'is it ready' calls come from not knowing." },
    ],
  },
];

// Append long-form continuations and recompute reading time.
for (const a of articles) {
  const extra = articleExtensions[a.slug];
  if (extra) a.body.push(...extra);
  a.readMinutes = estimateReadMinutes(a.body);
}

export const getCategory = (slug?: string) => articleCategories.find((c) => c.slug === slug);
export const getArticle = (slug?: string) => articles.find((a) => a.slug === slug);

export const sortedArticles = () =>
  [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const articlesInCategory = (slug: ArticleCategorySlug) =>
  sortedArticles().filter((a) => a.category === slug);

export const relatedArticles = (article: Article, limit = 3) =>
  sortedArticles()
    .filter((a) => a.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, limit);

export const formatArticleDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
