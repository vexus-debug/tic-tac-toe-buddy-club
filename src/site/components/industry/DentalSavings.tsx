import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, DatabaseBackup, FileSpreadsheet, Download, Users, Building2, TrendingUp } from "lucide-react";

const trust = [
  { icon: FileSpreadsheet, t: "Easy move from Excel or paper", d: "Send us your Excel sheets, patient cards or old system export — we bring your patients, treatments and stock into Clinexus for you." },
  { icon: DatabaseBackup, t: "Automatic daily backups", d: "Your patient records are backed up every day in the cloud — safe from power cuts, crashed laptops or theft." },
  { icon: Download, t: "Your data stays yours", d: "Export your patients, charts and billing whenever you want. No lock-in." },
];

export const DentalTrust = () => (
  <section aria-label="Moving to Clinexus is safe" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
    <div className="eye-panel rounded-2xl p-5 sm:rounded-3xl sm:p-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Switching is safe</p>
      <h2 className="mb-6 text-xl font-bold text-card-foreground md:text-2xl">Moving from Excel or paper? We do the heavy lifting.</h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {trust.map((b) => (
          <li key={b.t} className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><b.icon className="h-5 w-5 text-primary" /></div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-card-foreground">{b.t}</h3>
              <p className="text-sm leading-snug text-muted-foreground">{b.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const groups = [
  {
    id: "internal", icon: Users, title: "Staff roles you won't need to hire", total: "₦3.9M – ₦6.5M / year",
    rows: [
      ["HMO & claims officer", "₦1.8M – ₦3.0M", "Claims are tracked from draft to paid, and paid claims reduce the invoice balance automatically."],
      ["Extra front desk / booking clerk", "₦1.2M – ₦1.9M", "Chair booking, walk-in queue and waiting list let one person run the desk."],
      ["Records / filing clerk", "₦960k – ₦1.6M", "Charts, notes, X-rays and consent forms are digital — no folders to fetch."],
    ],
  },
  {
    id: "external", icon: Building2, title: "Outside services & tools replaced", total: "₦2.0M – ₦4.0M / year",
    rows: [
      ["Outsourced bookkeeping / audits", "₦1.2M – ₦2.4M", "Revenue per treatment, commissions, expenses and lab statements add up on their own."],
      ["Bulk SMS & reminder tools", "₦360k – ₦840k", "Reminders and messages are built in."],
      ["Printed cards, receipts & lab pads", "₦420k – ₦780k", "Receipts, prescriptions and lab orders are printed or shared only when needed."],
    ],
  },
  {
    id: "recovered", icon: TrendingUp, title: "Money you stop losing", total: "₦3.8M – ₦10M+ / year",
    rows: [
      ["Forgotten or expired HMO claims", "8–15% of HMO billing", "Every claim has a status, so none sits unsubmitted or unpaid."],
      ["Work done but not billed", "Varies", "Today's charted work is checked against the invoice before the patient leaves."],
      ["Unbilled materials & lab costs", "Varies", "Materials and lab orders link to the treatment and the bill."],
    ],
  },
];

export const DentalSavings = () => (
  <section id="savings" className="mb-16 scroll-mt-24 lg:mb-24">
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">What your clinic saves</p>
    <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
      How much Clinexus saves a Nigerian dental clinic, <span className="text-muted-foreground">every year</span>
    </h2>
    <p className="mb-6 max-w-2xl text-muted-foreground">Typical figures for a 2–4 chair clinic in Lagos, Abuja or Port Harcourt. Tap each section to see the roles and costs.</p>
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <div className="eye-panel rounded-2xl p-5">
        <p className="text-2xl font-bold text-primary md:text-3xl">₦5.9M – ₦10.5M</p>
        <p className="text-sm text-muted-foreground">Saved on salaries, services and stationery per branch, per year</p>
      </div>
      <div className="eye-panel rounded-2xl p-5">
        <p className="text-2xl font-bold text-primary md:text-3xl">+ ₦3.8M – ₦10M</p>
        <p className="text-sm text-muted-foreground">Recovered from missed HMO claims and unbilled work</p>
      </div>
    </div>
    <Accordion type="single" collapsible defaultValue="internal" className="eye-panel rounded-2xl px-5 sm:rounded-3xl sm:px-6">
      {groups.map((g) => (
        <AccordionItem key={g.id} value={g.id} className="border-primary/10 last:border-b-0">
          <AccordionTrigger className="gap-3 text-left hover:no-underline">
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10"><g.icon className="h-4 w-4 text-primary" /></span>
              <span className="font-semibold text-card-foreground">{g.title}</span>
              <span className="text-sm font-semibold text-primary">{g.total}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3">
              {g.rows.map(([role, cost, how]) => (
                <li key={role} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-card-foreground">{role} <span className="text-primary">· {cost}</span></p>
                    <p className="leading-snug text-muted-foreground">{how}</p>
                  </div>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
    <p className="mt-3 text-xs text-muted-foreground">Estimates based on typical Nigerian private clinic salaries and costs in 2026. Your clinic's numbers will vary.</p>
  </section>
);
