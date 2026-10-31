import type { PageTour } from "@/components/dashboard/tour/types";

/**
 * Dentist "Walk through a visit" — a cross-page tour that follows the real
 * visit flow driven by the Active Visit bar: Waiting room → Consent → Chart →
 * Plan → Rx → Notes → Finish. Each step opens the real page, spotlights the
 * real widget, and says exactly what to click and what happens next.
 */
const BAR_NEXT = '[data-tour="visit-bar-next"], [data-tour="visit-bar"]';
const BAR_JUMP = '[data-tour="visit-bar-jump"], [data-tour="visit-bar-jump-menu"], [data-tour="visit-bar"]';

export const dentistVisitTour: PageTour = {
  title: "Patient visit",
  steps: [
    // ── Dashboard ──
    {
      path: "",
      target: '[data-tour="dentist-waiting-room"]',
      title: "1. Call your next patient",
      body: "This is your waiting room. Patients appear here once the front desk checks them in. Click \"Call & Start\" beside the patient's name — your chair is marked busy and the visit opens on their chart. For this tour we've opened a demo patient for you.",
    },

    // ── Consent ──
    {
      path: "consent-forms",
      target: '[data-tour="visit-bar"]',
      title: "2. Meet the Active Visit bar",
      body: "Once a visit starts, this bar stays at the top of every clinical page. It shows who you're treating and walks you through the visit in order: Consent → Chart → Plan → Rx → Finish. You never have to re-pick the patient.",
    },
    {
      path: "consent-forms",
      target: BAR_JUMP,
      title: "3. Jump anywhere in the visit",
      body: "Tap the ☰ menu (or the buttons on a wide screen) to jump straight to Consent, Chart, Plan, Rx, Lab, Estimate or Notes for this patient. A tick means that step is already done today.",
    },
    {
      path: "consent-forms",
      target: '[data-tour="consent-forms-create"], [data-tour="consent-forms-actions"]',
      title: "4. Get consent signed",
      body: "Click \"New consent form\". The right template is filled in for this patient — hand the device to the patient to sign on screen, then click Save. If consent was already signed today, this step is skipped automatically.",
    },
    {
      path: "consent-forms",
      target: BAR_NEXT,
      title: "5. Go to the next step",
      body: "When consent is signed, click \"Next: Chart\" in the visit bar. It always shows the next step in the visit, so you can simply keep clicking Next.",
    },

    // ── Chart ──
    {
      path: "dental-charts",
      target: '[data-tour="dental-charts-patient-select"]',
      title: "6. The patient's tooth chart",
      body: "You're now on the Dental Chart, already open for this patient. Leave this dropdown alone during a visit — it's only for opening a different patient's chart.",
    },
    {
      path: "dental-charts",
      target: '[data-tour="dental-charts-legend"]',
      title: "7. Read the colours",
      body: "Each colour means a condition — green Healthy, red Decayed, blue Treated, grey Missing and so on. The small dots above show the plan: orange In plan, green Done not billed, blue Billed.",
    },
    {
      path: "dental-charts",
      target: '[data-tour="dental-charts-chart"]',
      title: "8. Click a tooth to chart it",
      body: "Examine the patient, then click the tooth with a problem (e.g. 16). A detail card opens below the chart. Click \"Add Procedure\", pick the condition (Decayed, Fractured…), the surfaces and material, then Save. The tooth changes colour.",
    },
    {
      path: "dental-charts",
      target: '[data-tour="dental-charts-chart"]',
      title: "9. Several teeth at once",
      body: "Same problem on many teeth? Click \"Select several teeth\", tap each tooth, choose the condition, then click \"Add to plan\". The treatment and its price are added to the plan for every tooth in one go.",
    },
    {
      path: "dental-charts",
      target: '[data-tour="dental-charts-tooth-detail"], [data-tour="dental-charts-chart"]',
      title: "10. Send findings to the plan",
      body: "When you save a finding, the matching treatment and catalogue price go to the treatment plan for you — no typing it twice. Need a crown or denture made? Click \"Order lab case\" on the tooth card.",
    },
    {
      path: "dental-charts",
      target: BAR_NEXT,
      title: "11. Next: Plan",
      body: "Done charting? Click \"Next: Plan\" in the visit bar to review the treatment plan.",
    },

    // ── Plan ──
    {
      path: "treatments",
      target: '[data-tour="treatments-plans-list"], [data-tour="treatments-new-plan"]',
      title: "12. Review the treatment plan",
      body: "Everything you charted is listed here with prices. Open the plan to add or remove items, and tick each item as Done once you've carried it out today — done items become the bill and their materials come off stock.",
    },
    {
      path: "treatments",
      target: '[data-tour="treatments-new-plan"]',
      title: "13. Add extra treatment",
      body: "Doing something that wasn't on the chart (e.g. scaling)? Click \"New plan\" or add a line item, pick the treatment from the catalogue and save. The patient can also get an estimate from this plan.",
    },
    {
      path: "treatments",
      target: BAR_NEXT,
      title: "14. Next: Rx",
      body: "Plan reviewed and today's work ticked? Click \"Next: Rx\" in the visit bar.",
    },

    // ── Prescriptions ──
    {
      path: "prescriptions",
      target: '[data-tour="prescriptions-new"]',
      title: "15. Prescribe if needed",
      body: "Click \"New prescription\". The patient and diagnosis are filled in — pick a preset or add each drug with dose, frequency and duration, then Save. You'll be warned if a drug clashes with the patient's allergies. No medication needed? Skip this step.",
    },
    {
      path: "prescriptions",
      target: '[data-tour="prescriptions-list"], [data-tour="prescriptions-new"]',
      title: "16. Print it",
      body: "Saved prescriptions appear here. Use the print icon on a prescription to hand the patient a copy.",
    },
    {
      path: "prescriptions",
      target: BAR_JUMP,
      title: "17. Write your visit notes",
      body: "Open the ☰ menu and tap \"Notes\". Fill in Complaint, Findings, Diagnosis and Plan — they save as you type and are filed with the visit when you finish.",
    },

    // ── Finish ──
    {
      path: "prescriptions",
      target: '[data-tour="visit-bar-finish"], [data-tour="visit-bar"]',
      title: "18. Finish the visit",
      body: "Click \"Finish\". Check the list of work done and extra materials used, attach the prescription, book the next appointment if needed, then confirm. The bill goes to reception as \"Ready for payment\" and your chair is freed.",
    },
    {
      path: "",
      target: '[data-tour="dentist-waiting-room"]',
      title: "19. Call the next patient",
      body: "You're back on your dashboard. The finished patient has left your queue — click \"Call & Start\" on the next one and repeat. That's a full visit!",
    },
  ],
};
