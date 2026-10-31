// Product update log. RULE: every new feature, improvement or bug fix shipped
// to users must be added here as a new entry (newest first) — see AGENTS.md.

export type UpdateKind = "feature" | "improvement" | "fix";

export interface UpdateEntry {
  version: string;
  date: string; // e.g. "October 22, 2026"
  title: string;
  kind: UpdateKind;
  items: { kind: UpdateKind; text: string }[];
}

export const updates: UpdateEntry[] = [
  {
    version: "v2.45.0",
    date: "October 31, 2026",
    title: "New dental lab home: Production Command Center",
    kind: "improvement",
    items: [
      { kind: "feature", text: "Headline cards show work-in-progress value, due today, late and rush, on-time rate with average turnaround, and holds. Tap a card to open that list." },
      { kind: "feature", text: "Production pipeline shows how many cases are at each stage, marks the busiest one, and lets you tap a stage to see its cases." },
      { kind: "feature", text: "New charts: cases received vs. finished over 14 days, and the mix of restorations in production." },
      { kind: "improvement", text: "Needs-attention list now has tabs (Late & rush, Due today, On hold, Ready to ship) with doctor, patient, shade and days-late countdown." },
      { kind: "feature", text: "Busiest clients and bench workload per technician, with unassigned cases highlighted." },
    ],
  },
  {
    version: "v2.44.0",
    date: "October 31, 2026",
    title: "Faster lab billing: aging cards, invoice panel and payment allocation",
    kind: "feature",
    items: [
      { kind: "feature", text: "Aging cards (Current, 31–60, 61–90, 90+) at the top of Invoices — click one to filter the list." },
      { kind: "feature", text: "Invoices show due date, balance due and days overdue, with a Collect button on each unpaid invoice." },
      { kind: "feature", text: "Click an invoice to see its cases (patient, doctor, restoration, shade), line items and payment history." },
      { kind: "feature", text: "Record one payment and split it across a clinic's invoices, oldest first or by hand, then print a receipt." },
      { kind: "feature", text: "Select several invoices to print them together; apply leftover credit to open invoices in one click." },
    ],
  },
  {
    version: "v2.43.0",
    date: "October 31, 2026",
    title: "Statements moved into client accounts",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Billing now has two tabs: Invoices & Receivables, and Payments & Credits." },
      { kind: "improvement", text: "Client statements (with print and remittance slip) now live in each client's account panel, Statement tab." },
      { kind: "improvement", text: "Click a clinic in the aging table to open its client account." },
    ],
  },
  {
    version: "v2.42.0",
    date: "October 31, 2026",
    title: "Simpler dental lab billing",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Billing now has three tabs: Receivables (aging + invoices), Payments & Credits, and Statements." },
      { kind: "improvement", text: "The price grid moved to Catalogue → Prices, next to the other price lists." },
    ],
  },
  {
    version: "v2.41.0",
    date: "October 31, 2026",
    title: "Dental lab statements, price books & credit notes",
    kind: "feature",
    items: [
      { kind: "feature", text: "Printed client statements now end with a tear-off remittance advice slip." },
      { kind: "feature", text: "Price Books tab: spreadsheet-style price matrix with tier prices worked out automatically." },
      { kind: "feature", text: "Issue remake or adjustment credit notes linked to an invoice; the invoice balance drops right away." },
    ],
  },
  {
    version: "v2.40.0",
    date: "October 31, 2026",
    title: "Dental lab A/R aging & payment reconciliation",
    kind: "feature",
    items: [
      { kind: "feature", text: "A/R Aging tab in Billing: 0–30/31–60/61–90/90+ buckets per client, clickable filters, risk badges and CSV export." },
      { kind: "feature", text: "Auto credit-hold flag when a client is over their credit limit or has anything 90+ days old." },
      { kind: "feature", text: "Record lump-sum payments across several invoices with 'Apply oldest first' or a manual split; leftovers become credit on account." },
    ],
  },
  {
    version: "v2.39.0",
    date: "October 31, 2026",
    title: "Dental lab itemised & consolidated invoicing",
    kind: "feature",
    items: [
      { kind: "feature", text: "Invoice builder with units × price, add-ons (custom shade, wax-up, Ti-base), rush %, line discounts, CDT codes and tooth numbers." },
      { kind: "feature", text: "Batch invoice: combine all ready cases for a practice (optionally within a date range) into one consolidated invoice." },
      { kind: "feature", text: "Printable tax invoice with per-case itemisation, tax, bank details and a tear-off remittance slip." },
      { kind: "feature", text: "Void unpaid invoices with a required reason; their cases return to Ready to invoice." },
    ],
  },
  {
    version: "v2.38.0",
    date: "October 31, 2026",
    title: "Dental lab client accounts & Account 360",
    kind: "feature",
    items: [
      { kind: "feature", text: "Create client accounts with contact, billing and delivery addresses, tax ID, payment terms, price tier and credit limit." },
      { kind: "feature", text: "Doctor roster per practice with shade guide, margin and contact preferences." },
      { kind: "feature", text: "Clients page is now a dense table with receivables, credit-hold and 30+ day delinquency counters." },
      { kind: "feature", text: "Tap a practice to open Account 360: balance, credit-limit usage, hold switch, cases and a running ledger." },
      { kind: "improvement", text: "Accounts over their credit limit are flagged for credit hold automatically." },
    ],
  },
  {
    version: "v2.37.0",
    date: "October 31, 2026",
    title: "Dental lab CAD/CAM & equipment queues",
    kind: "feature",
    items: [
      { kind: "feature", text: "New CAD/CAM & Equipment page: check incoming scans and mark them verified, margin question, missing bite or rescan." },
      { kind: "feature", text: "Any scan problem puts the case on clinical hold automatically, pausing its due-date clock." },
      { kind: "feature", text: "Batch cases onto milling discs, sintering cycles and 3D print platforms with a capacity meter and the material lot used." },
      { kind: "feature", text: "Speed sintering warns about bridges of 3+ units and mixed sintering curves; runs go staged, running, then completed or failed." },
    ],
  },
  {
    version: "v2.36.0",
    date: "October 31, 2026",
    title: "Dental lab Material Store with reorder alerts",
    kind: "feature",
    items: [
      { kind: "feature", text: "New Material Store page with tabs for milling discs, 3D resins, implant hardware and other consumables." },
      { kind: "feature", text: "Counters for usable lots, low stock, lots expiring within 30 days and quarantined or recalled lots — tap one to filter." },
    ],
  },
  {
    version: "v2.35.0",
    date: "October 31, 2026",
    title: "Dental lab catalogue: services, price tiers and add-ons",
    kind: "feature",
    items: [
      { kind: "feature", text: "New Catalogue page with tabs for Restoration Services, Price Schedules, Add-ons & Surcharges and Shades." },
      { kind: "feature", text: "Restorations are grouped by clinical domain, with bridge pricing rules, minimum units and compatible materials." },
      { kind: "feature", text: "Price tiers (e.g. Tier A 10% off): clinics on a tier get the catalogue price less the discount unless they have a custom price." },
      { kind: "feature", text: "Add-ons & Surcharges library for wax-ups, models, characterisation and rush fees (flat, per unit or percent)." },
    ],
  },
  {
    version: "v2.34.0",
    date: "October 31, 2026",
    title: "Dental lab production: table view and easier navigation",
    kind: "improvement",
    items: [
      { kind: "feature", text: "Case Board now has a Table view with sortable columns and a stage picker on every row." },
      { kind: "improvement", text: "QC Station and Material Store now appear in the lab sidebar." },
      { kind: "improvement", text: "Production Overview shows how many cases are on hold." },
    ],
  },
  {
    version: "v2.33.0",
    date: "October 31, 2026",
    title: "Dental lab cases: stump shade and layered shades",
    kind: "improvement",
    items: [
      { kind: "feature", text: "Record the stump (ND1–ND9) shade and cervical, body and incisal shades on each case." },
      { kind: "improvement", text: "Bench cards now show the case's layered shades plus the Shade Library stain and firing notes." },
      { kind: "fix", text: "Fixed a page warning on the lab calendar's rush cases." },
    ],
  },
  {
    version: "v2.32.0",
    date: "October 31, 2026",
    title: "Dental lab stock: disc, resin and implant specs",
    kind: "improvement",
    items: [
      { kind: "feature", text: "Record disc thickness, translucency, resin wavelength and volume, biocompatibility class and implant platform/interface on each material lot." },
      { kind: "improvement", text: "Choosing a lot from stock on a case now shows its specs, so the right disc or resin is picked." },
    ],
  },
  {
    version: "v2.31.0",
    date: "October 31, 2026",
    title: "Dental lab work types: procedure codes and bridges at case intake",
    kind: "improvement",
    items: [
      { kind: "feature", text: "Mark a work type as multi-unit (bridge); it shows next to the name when receiving or editing a case." },
      { kind: "improvement", text: "Editing a case now lists your catalogue work types with their procedure codes and usual turnaround." },
    ],
  },
  {
    version: "v2.30.0",
    date: "October 31, 2026",
    title: "Dental lab catalogue & stock: live work types, stock that counts down, shade recipes on the bench",
    kind: "feature",
    items: [
      { kind: "feature", text: "New cases use your Work Types catalogue: due date from turnaround days and the fee from the clinic's agreed price or the catalogue price." },
      { kind: "feature", text: "Pick a material lot from stock on a case; it is taken off stock and recorded for traceability. Expired or recalled lots can't be used." },
      { kind: "feature", text: "My Bench cards show the shade recipe and notes from your Shade Library." },
      { kind: "improvement", text: "Materials show quantities in units with low-stock, expired and expiring-soon counts." },
      { kind: "fix", text: "Fixed a page display warning in the Quality Control queue." },
    ],
  },
  {
    version: "v2.29.0",
    date: "October 30, 2026",
    title: "Dental lab shop floor: barcode scanning, bench timers, bridge charting",
    kind: "feature",
    items: [
      { kind: "feature", text: "Scan a job traveler barcode with a USB scanner on the Case Board to open that case instantly, with a beep to confirm." },
      { kind: "feature", text: "On My Bench, scanning a traveler starts or pauses that case's work timer. Work time is saved when you finish your step." },
      { kind: "fix", text: "Technicians can only see their own bench. Only owners, admins and managers can switch to another technician's bench." },
      { kind: "feature", text: "When charting a bridge, tap a selected tooth again to mark it Abutment, then Pontic." },
    ],
  },
  {
    version: "v2.28.0",
    date: "October 30, 2026",
    title: "Safer dental lab: locked QC gate, all-or-nothing saves, working-day due dates",
    kind: "fix",
    items: [
      { kind: "fix", text: "Only an owner, admin or manager can ship a case past a failed or missing quality check, and they must give a reason that is saved in the case history." },
      { kind: "fix", text: "A QC inspection and the case move are now saved together, so an inspection can never be lost while the case moves on." },
      { kind: "fix", text: "Advancing several cases at once now moves all of them or none of them." },
      { kind: "fix", text: "Cases still in Ceramics no longer appear in the QC queue." },
      { kind: "improvement", text: "Due dates count lab working days and skip weekends and holidays. Toggle Saturday opening on the calendar." },
      { kind: "improvement", text: "Daily capacity is shared by the whole lab instead of saved on one computer." },
      { kind: "fix", text: "Time on clinic hold is no longer counted against the lab when a case is late, and delivered cases now record their delivery date." },
      { kind: "fix", text: "Remake rate now compares remakes against cases delivered in the last 90 days, and free-remake value counts each original case once." },
    ],
  },
  {
    version: "v2.27.0",
    date: "October 30, 2026",
    title: "Printable job travelers for lab cases",
    kind: "feature",
    items: [
      { kind: "feature", text: "Print a job traveler from any case or from My Bench: scannable barcode, clinic, patient, teeth, shade, instructions and sign-off boxes for CAD, ceramist and QC." },
      { kind: "feature", text: "Choose A5, A4 or 80mm thermal slip size. Rush cases print with a bold RUSH banner." },
    ],
  },
  {
    version: "v2.26.0",
    date: "October 30, 2026",
    title: "My Bench for technicians, and recurring orders that create their own cases",
    kind: "feature",
    items: [
      { kind: "feature", text: "New My Bench page under Production: technicians see only their own cases, rush first, and finish their step with one tap." },
      { kind: "feature", text: "Recurring Orders now has a Generate due cases button that adds every due standing order to the Case Board and moves its next due date forward." },
      { kind: "improvement", text: "Recurring Orders moved to Clients & Billing, where standing client agreements belong." },
    ],
  },
  {
    version: "v2.25.0",
    date: "October 30, 2026",
    title: "Start remakes straight from the Case Board",
    kind: "feature",
    items: [
      { kind: "feature", text: "Open any case on the Case Board and tap Initiate Remake to create its rush -R1 / -R2 copy." },
      { kind: "improvement", text: "The original case is now marked 'Remake spawned' and shown in its own column, with the change recorded in the case history." },
    ],
  },
  {
    version: "v2.24.2",
    date: "October 30, 2026",
    title: "Quality Control and Remakes pages now open correctly",
    kind: "fix",
    items: [
      { kind: "fix", text: "The Quality Control menu item now opens the 6-point inspection station instead of the old list." },
      { kind: "fix", text: "The Remakes & Warranties menu item now opens the remake page with responsibility tracking." },
    ],
  },
  {
    version: "v2.24.1",
    date: "October 30, 2026",
    title: "Quality Control: scans in the inspection window",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The QC inspection window now shows the case's scans and files, with 3D preview for STL scans." },
    ],
  },
  {
    version: "v2.24.0",
    date: "October 30, 2026",
    title: "Lab Production Calendar: views, late cases and workload",
    kind: "feature",
    items: [
      { kind: "feature", text: "Switch the lab calendar between Month, Week and Day views; Day view groups deliveries by clinic." },
      { kind: "feature", text: "Overdue tray lists every late case with how many days late it is." },
      { kind: "feature", text: "Cases without a due date open in a side panel and can be scheduled in one tap using standard turnaround times." },
      { kind: "feature", text: "Daily workload meter colours each day green, amber or red against your units-per-day capacity." },
    ],
  },
  {
    version: "v2.23.0",
    date: "October 30, 2026",
    title: "Lab Case Board: holds, tooth chart and batch moves",
    kind: "feature",
    items: [
      { kind: "feature", text: "Put a case on hold with a reason and a ready-to-send WhatsApp message; released cases return to their previous stage." },
      { kind: "feature", text: "Tap-to-select tooth chart when receiving or editing a case; tooth numbers show on board cards." },
      { kind: "feature", text: "Select several cases and advance them to the next stage in one click." },
      { kind: "improvement", text: "Cases can't move past Quality Check until QC has passed (with an admin override)." },
      { kind: "fix", text: "Editing a case no longer loses its tooth numbers." },
      { kind: "improvement", text: "Technician reassignments and holds are now recorded in the case history." },
    ],
  },
  {
    version: "v2.22.1",
    date: "October 30, 2026",
    title: "Dental lab case history & production foundations",
    kind: "improvement",
    items: [
      { kind: "feature", text: "Every lab case stage change is now recorded automatically in a case history log." },
      { kind: "improvement", text: "Lab cases can now store tooth numbers, on-hold reasons, remake links and QC results." },
      { kind: "improvement", text: "Quality control and remake records can now be linked to a real case." },
    ],
  },
  {
    version: "v2.22.0",
    date: "October 30, 2026",
    title: "Industry-standard dental lab workflow",
    kind: "feature",
    items: [
      { kind: "feature", text: "New Quality Control tab with a pass/fail inspection checklist before cases are released." },
      { kind: "feature", text: "New Materials & Lots tab to trace zirconia, resin and porcelain batches." },
      { kind: "feature", text: "New Inbound Pickups tab for clinic collection requests." },
      { kind: "improvement", text: "Price Books, Statements, Payments Received and Credit Notes now appear as Clients & Billing tabs." },
      { kind: "improvement", text: "Remakes moved to Production, and outsourcing to partner labs has its own section." },
    ],
  },
  {
    version: "v2.21.3",
    date: "October 30, 2026",
    title: "Simpler dental lab menu with section tabs",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The dental lab sidebar now shows 6 main sections instead of 18+ links." },
      { kind: "improvement", text: "Related screens inside each section are reached through tabs at the top of the page, like the dental clinic dashboard." },
    ],
  },
  {
    version: "v2.21.2",
    date: "October 30, 2026",
    title: "Sharper, more readable website typography",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The public website now uses a new clinical type pairing for headlines and body text." },
      { kind: "improvement", text: "Large headlines breathe better on phones, and small labels and captions are easier to read." },
    ],
  },
  {
    version: "v2.21.1",
    date: "October 30, 2026",
    title: "Tiered commission engine and older statement clarity",
    kind: "improvement",
    items: [
      { kind: "feature", text: "Pay calculations now support graduated commission brackets on net production (e.g. 30% to 10k, 35% to 20k, 40% above)." },
      { kind: "improvement", text: "Older pay statements show \"Not recorded\" for split share instead of implying 100% solo work." },
      { kind: "fix", text: "Lab client statements no longer crash when invoice data hasn't loaded yet." },
    ],
  },
  {
    version: "v2.21.0",
    date: "October 30, 2026",
    title: "Associate workflow: chairs, splits, locked pay periods",
    kind: "feature",
    items: [
      { kind: "feature", text: "Set provider type and allowed chairs when adding a new dentist, not only when editing." },
      { kind: "feature", text: "Associate and Locum badges now show next to dentists on the appointments calendar and list." },
      { kind: "feature", text: "Paid commission payouts can be finalized and locked, freezing that period's bills from later edits." },
      { kind: "feature", text: "My Earnings shows net production, collections ratio, lab deductions and draw balance, plus a split % column." },
      { kind: "feature", text: "Print or save any pay statement as a PDF." },
      { kind: "fix", text: "Editing an invoice no longer wipes tooth, code, provider or split details on its lines." },
      { kind: "fix", text: "Invoices now show the correct dentist names, including the co-provider and their share." },
    ],
  },
  {
    version: "v2.20.0",
    date: "October 30, 2026",
    title: "Associate dentist pay",
    kind: "feature",
    items: [
      { kind: "feature", text: "Set each associate dentist's contract: commission %, paid on production or collections, lab fee share and daily minimum." },
      { kind: "feature", text: "Commissions calculates pay from work billed under each dentist and creates an itemised payout in one click." },
      { kind: "feature", text: "Dentists get a My Earnings page with their running estimate and past pay statements." },
      { kind: "improvement", text: "Only owners, admins and accountants can edit payouts; dentists see only their own." },
    ],
  },
  {
    version: "v2.19.3",
    date: "October 29, 2026",
    title: "Outreach campaigns send reliably",
    kind: "fix",
    items: [
      { kind: "fix", text: "Launching or resuming a campaign now starts sending emails immediately." },
      { kind: "fix", text: "Saving a campaign with already-added recipients no longer shows a duplicate error." },
    ],
  },
  {
    version: "v2.19.2",
    date: "October 29, 2026",
    title: "Independent email and blog AI",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Outreach emails now send directly through Resend using the server key." },
      { kind: "improvement", text: "The blog writer now uses the same AI provider as the clinic copilot." },
    ],
  },
  {
    version: "v2.19.1",
    date: "October 29, 2026",
    title: "Savings breakdown and safe switching on the dental page",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The dental clinics page now shows yearly savings in Naira, with dropdowns listing the roles and services Clinexus replaces." },
      { kind: "improvement", text: "New section on moving from Excel or paper, daily automatic backups and exporting your data." },
    ],
  },
  {
    version: "v2.19.0",
    date: "October 29, 2026",
    title: "Insurance claims that settle invoices",
    kind: "feature",
    items: [
      { kind: "feature", text: "Invoices now list their insurance claims with status, and block a second claim while one is still open." },
      { kind: "feature", text: "Marking a claim paid asks for the settled amount and reference, then reduces the invoice balance automatically." },
      { kind: "feature", text: "Start a new claim straight from the Claims tab, and tap any invoice number to open it." },
    ],
  },
  {
    version: "v2.18.0",
    date: "October 29, 2026",
    title: "Signed notes, voice dictation and chairside mode",
    kind: "feature",
    items: [
      { kind: "feature", text: "Clinical notes can be signed and locked; locked notes accept signed addenda with a reason, keeping the original intact." },
      { kind: "feature", text: "Type shortcuts like .endo-prep or .post-op in SOAP notes to fill in templates, or tap the mic to dictate hands-free." },
      { kind: "feature", text: "Chairside mode shows patients their tooth chart, X-rays and treatment steps, with all money and internal notes hidden." },
    ],
  },
  {
    version: "v2.17.1",
    date: "October 29, 2026",
    title: "Smoother sign-in",
    kind: "fix",
    items: [
      { kind: "fix", text: "Signing in from a normal browser tab no longer sends you back to the login screen." },
      { kind: "improvement", text: "Your clinics load faster after signing in." },
    ],
  },
  {
    version: "v2.17.0",
    date: "October 29, 2026",
    title: "Safer, fuller prescriptions",
    kind: "feature",
    items: [
      { kind: "feature", text: "Child dosing by weight: enter kg, pick a drug, and add the calculated dose and quantity in one tap." },
      { kind: "feature", text: "Prescriptions now record strength, form, quantity to dispense and instructions." },
      { kind: "improvement", text: "New warnings for painkillers with stomach ulcers or kidney problems, and adrenaline anaesthetic with high blood pressure." },
      { kind: "improvement", text: "Printed slips show a reference number, verification QR code, prescriber registration number and signature." },
    ],
  },
  {
    version: "v2.16.1",
    date: "October 29, 2026",
    title: "Curated AI skill library",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Added 111 top-rated skills across 25 categories to guide how Clinexus is built and maintained." },
    ],
  },
  {
    version: "v2.16.0",
    date: "October 29, 2026",
    title: "Morning huddle on the dental overview",
    kind: "feature",
    items: [
      { kind: "feature", text: "See today's booked production against a daily goal you can set yourself." },
      { kind: "feature", text: "Doctor vs hygiene split of today's production." },
      { kind: "feature", text: "Total value of planned treatment not yet booked, with a link to follow up." },
    ],
  },
  {
    version: "v2.15.0",
    date: "October 29, 2026",
    title: "Industry-standard dental overview",
    kind: "improvement",
    items: [
      { kind: "feature", text: "New patient flow strip: booked, confirmed, waiting, in chair, completed and no-shows for today." },
      { kind: "feature", text: "New operatory board shows every chair's full day side by side, with tap-through to each patient." },
    ],
  },
  {
    version: "v2.14.1",
    date: "October 28, 2026",
    title: "Dental clinics page screenshots restored",
    kind: "fix",
    items: [
      { kind: "fix", text: "The Dental Clinics page shows its dashboard screenshots again, freshly captured from the live app." },
    ],
  },
  {
    version: "v2.14.0",
    date: "October 28, 2026",
    title: "Phased dental treatment plans with insurance estimates",
    kind: "feature",
    items: [
      { kind: "feature", text: "Treatment plans are grouped into 4 clinical phases: Urgent, Perio, Restorative and Maintenance." },
      { kind: "feature", text: "Pick exact tooth surfaces (M, O, D, B, L) for each procedure, and the procedure code fills in from the catalog." },
      { kind: "feature", text: "Add an insurance provider and coverage % to see what insurance pays versus what the patient pays." },
      { kind: "feature", text: "Print a clean estimate sheet with dentist and patient signature lines." },
      { kind: "improvement", text: "Edit, reorder or remove procedures right inside a plan, and pause, resume, archive or complete plans." },
      { kind: "improvement", text: "The new plan form stacks neatly on phones; new procedures start in Phase 1 unless you change it." },
    ],
  },
  {
    version: "v2.13.1",
    date: "October 28, 2026",
    title: "Clearer treatment catalog that works on phones",
    kind: "improvement",
    items: [
      { kind: "fix", text: "Treatment prices are now bold and easy to read in dark mode." },
      { kind: "fix", text: "Tap any treatment card to edit it; edit buttons are always visible on phones." },
      { kind: "improvement", text: "Dentists can now edit catalog items." },
      { kind: "feature", text: "Treatments can carry a CDT procedure code, a patient-friendly name and what they apply to (mouth, quadrant, tooth, surface)." },
    ],
  },
  {
    version: "v2.13.0",
    date: "October 28, 2026",
    title: "Smarter consent forms with patient and dentist signatures",
    kind: "feature",
    items: [
      { kind: "feature", text: "Consent forms fill in the patient, procedure, teeth, dentist, alternatives and cost for you." },
      { kind: "feature", text: "Patient or guardian signs, then the dentist countersigns, on the same screen." },
      { kind: "feature", text: "Signed forms are locked into a timestamped PDF with a tamper-check code and saved to the patient file." },
      { kind: "feature", text: "Treatment plans show which procedures still need a signed consent, with a one-tap shortcut to sign it." },
      { kind: "improvement", text: "You are warned before marking an extraction, root canal, implant, crown or brace procedure done without consent." },
    ],
  },
  {
    version: "v2.12.0",
    date: "October 28, 2026",
    title: "Treatment options A, B and C on the patient file",
    kind: "feature",
    items: [
      { kind: "feature", text: "Offer competing treatment options side by side and mark each as proposed, accepted, declined or referred." },
      { kind: "feature", text: "Procedures are grouped into four treatment phases, which you can change per procedure." },
      { kind: "feature", text: "Enter the insurer and coverage to see what insurance pays and what the patient pays." },
      { kind: "feature", text: "Invoice all finished procedures in a phase with one tap." },
    ],
  },
  {
    version: "v2.11.0",
    date: "October 28, 2026",
    title: "Full gum chart with 6-point probing",
    kind: "feature",
    items: [
      { kind: "feature", text: "Record pocket depths at six spots per tooth; the cursor jumps ahead as you type." },
      { kind: "feature", text: "Tap to mark bleeding or pus per spot; the bleeding score shows at the top." },
      { kind: "feature", text: "Enter gum recession and attachment loss is worked out for you." },
      { kind: "feature", text: "Grade tooth mobility and furcation on back teeth." },
      { kind: "feature", text: "Compare pocket depths against a previous visit on a wave line." },
    ],
  },
  {
    version: "v2.10.0",
    date: "October 28, 2026",
    title: "A tooth chart that looks like the mouth",
    kind: "feature",
    items: [
      { kind: "feature", text: "Switch the tooth chart between adult, mixed and child teeth, with A–T lettering for baby teeth in Universal numbering." },
      { kind: "feature", text: "Each tooth now shows five surfaces and a root, so fillings, caries, crowns, root canals, implants and bridges are drawn where they are." },
      { kind: "feature", text: "Record amalgam and composite fillings separately, plus extracted, congenitally missing, unerupted and impacted teeth." },
      { kind: "feature", text: "Stamp mode: pick a finding like MOD caries, then tap teeth to chart it in one step." },
    ],
  },
  {
    version: "v2.9.1",
    date: "October 28, 2026",
    title: "Invoice a procedure the moment it's done",
    kind: "feature",
    items: [
      { kind: "feature", text: "Ticking a treatment-plan procedure as done now offers to generate its invoice, with the procedure, tooth and fee filled in." },
      { kind: "improvement", text: "Choose \"Mark done only\" for prepaid or batched procedures." },
    ],
  },
  {
    version: "v2.9.0",
    date: "October 28, 2026",
    title: "Tooth chart and phased plans on the patient record",
    kind: "feature",
    items: [
      { kind: "feature", text: "The patient's history tab now shows a full 32-tooth chart with an FDI / Universal numbering switch." },
      { kind: "feature", text: "Tap any tooth to record caries, restorations, crowns, root canals or missing teeth, with surfaces." },
      { kind: "feature", text: "One tap adds the charted finding to the treatment plan with tooth, surface and catalog fee filled in." },
      { kind: "improvement", text: "Treatment plans are grouped into four clinical phases with per-phase totals and tick-to-complete items." },
      { kind: "fix", text: "Treatment plans on the patient record now load their procedures correctly." },
    ],
  },
  {
    version: "v2.8.1",
    date: "October 28, 2026",
    title: "Faster lab orders from the patient record",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "When reception or assistants order lab work, the patient's most recent dentist is filled in automatically." },
      { kind: "improvement", text: "The latest clinical note, tooth and shade are carried into the lab order so nothing is re-typed." },
      { kind: "feature", text: "Each lab case on a patient's record has an \"Open in lab queue\" link that jumps straight to that ticket." },
    ],
  },
  {
    version: "v2.8.0",
    date: "October 28, 2026",
    title: "Lab cases on the patient record",
    kind: "feature",
    items: [
      { kind: "feature", text: "Each patient's record now has a Lab Cases tab showing every crown, bridge, denture or aligner with shade, dates and status." },
      { kind: "improvement", text: "Overdue lab work is flagged, and new lab cases can be ordered for the patient in one tap." },
    ],
  },
  {
    version: "v2.7.0",
    date: "October 28, 2026",
    title: "Patient safety: allergy banner, prescription hard-stop and structured intake",
    kind: "feature",
    items: [
      { kind: "feature", text: "Allergies and medical alerts now stay visible on every tab of a patient's record, with chairside guidance on tap." },
      { kind: "feature", text: "Prescriptions instantly flag medicines that clash with a patient's allergies or conditions, suggest safer options, and require a written justification to override." },
      { kind: "improvement", text: "Adding or editing a patient now offers one-tap allergy and medical-risk tags." },
    ],
  },
  {
    version: "v2.6.3",
    date: "October 28, 2026",
    title: "Fresh dashboard screenshots on the dental clinics page",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Every screenshot on the dental clinics page now shows the current redesigned dashboard." },
    ],
  },
  {
    version: "v2.6.2",
    date: "October 28, 2026",
    title: "AI features on the dental clinics page",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The dental clinics page now showcases AI SOAP notes, prescription safety, missed-billing checks and fast-fill with real dashboard screenshots." },
    ],
  },
  {
    version: "v2.6.1",
    date: "October 28, 2026",
    title: "Scrolling announcement bar on the website",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "A scrolling notice at the top of every website page now highlights Clinexus AI in clinical workflows." },
    ],
  },
  {
    version: "v2.6.0",
    date: "October 28, 2026",
    title: "AI clinical copilot: notes, Rx safety, billing audit, lab alerts, slot fill",
    kind: "feature",
    items: [
      { kind: "feature", text: "Finish visit: \"Draft with AI\" fills editable SOAP notes from today's treatment, chart and procedures." },
      { kind: "feature", text: "New prescription: AI checks interactions, allergies and contraindications; proceeding past warnings requires a recorded rationale." },
      { kind: "feature", text: "Finish visit: \"Check missed items\" suggests work done today that isn't on the bill — add or dismiss each." },
      { kind: "feature", text: "Lab cases: alerts when a patient's delivery appointment in the next 14 days is at risk from a late, overdue or undated case." },
      { kind: "feature", text: "Cancelling an appointment now ranks the best patients to offer the freed slot." },
    ],
  },
  {
    version: "v2.5.4",
    date: "October 28, 2026",
    title: "AI consent risks and post-op instructions",
    kind: "feature",
    items: [
      { kind: "feature", text: "Consent forms: \"Add patient risks with AI\" appends procedure- and history-specific risks for review." },
      { kind: "feature", text: "Finish visit: draft editable, printable aftercare instructions with AI based on today's treatment and prescriptions." },
    ],
  },
  {
    version: "v2.5.3",
    date: "October 28, 2026",
    title: "Billable items ticked by default",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "In Finish visit, all billable items are now ticked by default — untick anything you don't want to bill." },
    ],
  },
  {
    version: "v2.5.2",
    date: "October 28, 2026",
    title: "Consent forms fixed, cleaner patient lists",
    kind: "fix",
    items: [
      { kind: "fix", text: "Creating a patient consent form no longer shows a 'created_by' error." },
      { kind: "fix", text: "The walkthrough demo patient no longer appears in patient lists or pickers." },
      { kind: "improvement", text: "The Subscription page was removed from the clinic dashboard." },
    ],
  },
  {
    version: "v2.5.1",
    date: "October 28, 2026",
    title: "Page tabs now highlight and switch correctly",
    kind: "fix",
    items: [
      { kind: "fix", text: "Tabs at the top of each page (e.g. Appointments, Staff Schedules, Waiting List) now show the right active tab and switch instantly." },
    ],
  },
  {
    version: "v2.5.0",
    date: "October 28, 2026",
    title: "Cleaner dental menu: 8 clear destinations",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The dental menu now shows 8 clear destinations (Schedule, Patients, Clinical, Lab, Billing, Inventory, Insights, Settings) instead of 30+ separate links." },
      { kind: "improvement", text: "Related screens live under tabs at the top of each page — for example Waiting List and Staff Schedules sit inside Schedule." },
      { kind: "improvement", text: "Every old link still works; bookmarks and shared URLs are unaffected." },
      { kind: "improvement", text: "Tabs respect your role: staff never see tabs for pages they can't open." },
    ],
  },
  {
    version: "v2.4.2",
    date: "October 27, 2026",
    title: "Tidier dashboard sidebar",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Sidebar sections start collapsed; tap a section title to expand it. The section for your current page opens automatically." },
    ],
  },
  {
    version: "v2.4.1",
    date: "October 27, 2026",
    title: "Dental overview shows only what your role needs",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Accountants, nurses, assistants, lab and procurement staff now get their own focused overview." },
      { kind: "fix", text: "Overview shortcuts no longer point to pages your role can't open." },
    ],
  },
  {
    version: "v2.4.0",
    date: "October 27, 2026",
    title: "Dashboards match the Clinexus website look",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Dashboards now use the same calm slate and teal colours as the website, in both light and dark mode." },
      { kind: "improvement", text: "Cleaner cards and tables: thin borders, no glows or lifting effects, easier-to-scan numbers." },
    ],
  },
  {
    version: "v2.3.1",
    date: "October 27, 2026",
    title: "More visible homepage backdrops",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The Clinexus screens behind homepage sections are now easier to see." },
    ],
  },
  {
    version: "v2.3.0",
    date: "October 27, 2026",
    title: "Homepage depth, motion and a clearer FAQ",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Homepage sections now blend into each other, and real Clinexus screens drift softly behind key sections as you scroll." },
      { kind: "improvement", text: "Money and team sections now show real clinic figures, staff activity and role access instead of generic icons." },
      { kind: "improvement", text: "The FAQ is now grouped by topic, with a quick WhatsApp option to book a 15-minute walkthrough." },
    ],
  },
  {
    version: "v2.2.9",
    date: "October 27, 2026",
    title: "Homepage opening photo",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The top of the homepage now shows a calm, dark photo of a modern dental room behind the headline. It moves gently as you scroll, and the text stays easy to read." },
    ],
  },
  {
    version: "v2.2.8",
    date: "October 27, 2026",
    title: "Calmer, clearer public website colours",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The public website now uses a calm deep-slate background with a single surgical teal accent, crisp thin borders instead of glows and blurred glass, and no more bright white bands between sections." },
      { kind: "improvement", text: "Headings, buttons and form fields are easier to read, with clearer focus outlines for keyboard users. The eye clinic page now shares the same look as the rest of the site." },
    ],
  },
  {
    version: "v2.2.7",
    date: "October 27, 2026",
    title: "Eye clinic page: feature grid, patient flow and cost estimator",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The eye clinic page now shows key features with real screens, a five-step visit from check-in to new glasses, what each role does, the per-case cost estimator and a clearer WhatsApp and demo section." },
    ],
  },
  {
    version: "v2.2.6",
    date: "October 27, 2026",
    title: "Dental page: capability checklist, cost estimator and new closing section",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The dental clinic page groups capabilities into Clinical, Admin and Operations tabs you can tick off, adds a slider to estimate your monthly cost by case volume, and ends with a clearer WhatsApp and demo section." },
    ],
  },
  {
    version: "v2.2.5",
    date: "October 27, 2026",
    title: "Refreshed dental clinic page",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The dental clinic page now shows features in a mixed-size layout and walks through a patient's visit step by step, swipeable on phones." },
    ],
  },
  {
    version: "v2.2.4",
    date: "October 27, 2026",
    title: "New photo headers on industry pages",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Industry, dental and eye clinic pages now open with real clinic photography and a live product preview, laid out to read well on phones first." },
    ],
  },
  {
    version: "v2.2.3",
    date: "October 27, 2026",
    title: "Shared design and content guidelines",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Added a shared set of design, writing and visual guidelines so every future change follows the same standards." },
    ],
  },
  {
    version: "v2.2.2",
    date: "October 27, 2026",
    title: "Clearer dental overview",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Dental overview redesigned with colour-coded figures, a live chair board, status-tagged schedule and a needs-attention list that works well on phone and computer." },
    ],
  },
  {
    version: "v2.2.1",
    date: "October 27, 2026",
    title: "Pricing and footer touch-ups",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Dental setup fee range updated to ₦30,000–₦100,000 depending on clinic size, across the dental industry and pricing pages." },
      { kind: "improvement", text: "Removed the social media icons from the website footer." },
    ],
  },
  {
    version: "v2.2.0",
    date: "October 27, 2026",
    title: "Outreach contacts and follow-ups",
    kind: "feature",
    items: [
      { kind: "feature", text: "New Contacts tab in Email Outreach: a permanent contact list with search, filters, spreadsheet import, tags, bulk actions and per-contact campaign history." },
      { kind: "feature", text: "Contact statuses update on their own as emails are sent, opened, clicked, bounced or unsubscribed." },
      { kind: "feature", text: "Pick campaign recipients straight from Contacts by status, tag or clinic type." },
      { kind: "feature", text: "New Follow up button on sent campaigns: target people who did not open, opened but did not click, or did not click." },
    ],
  },
  {
    version: "v2.1.1",
    date: "October 27, 2026",
    title: "Email key kept in your own database",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Outreach emails now read the Resend key from the clinic's own secure database vault instead of app settings." },
    ],
  },
  {
    version: "v2.1.0",
    date: "October 27, 2026",
    title: "Email Outreach Studio",
    kind: "feature",
    items: [
      { kind: "feature", text: "New Email Outreach page in the Super Admin panel with campaign stats: sent, open, click, bounce and unsubscribe rates." },
      { kind: "feature", text: "Step-by-step campaign builder: sender details, CSV audience import with duplicate and block-list filtering, merge-tag editor with live preview, checklist and test email." },
      { kind: "feature", text: "Launched campaigns send in the cloud in the background — no need to keep the browser open — with pause and resume." },
      { kind: "feature", text: "Recipient inspector with per-person activity timeline, and a block list manager to search, add or unblock addresses." },
    ],
  },
  {
    version: "v2.0.0",
    date: "October 27, 2026",
    title: "Outreach campaign sending",
    kind: "feature",
    items: [
      { kind: "feature", text: "Super admins can send outreach campaigns through Resend in safe batches, with pause and resume." },
      { kind: "feature", text: "Emails are personalised with merge tags like {{first_name}} and {{clinic_name}}, with fallbacks." },
      { kind: "feature", text: "Every email carries one-click unsubscribe headers, open tracking and click tracking automatically." },
      { kind: "feature", text: "Blocked (unsubscribed, bounced or complaining) addresses are skipped before sending, and test emails can be sent to your own inbox." },
    ],
  },
  {
    version: "v1.9.9",
    date: "October 27, 2026",
    title: "Outreach tracking & unsubscribe",
    kind: "feature",
    items: [
      { kind: "feature", text: "Outreach emails can now record opens and link clicks, with safe redirects to the original link." },
      { kind: "feature", text: "One-click unsubscribe (Gmail/Yahoo compliant) plus a confirmation page; unsubscribed addresses are blocked from future campaigns." },
      { kind: "feature", text: "Delivery, bounce and spam-complaint reports from Resend update campaign stats, and bounced or complaining addresses are blocked automatically." },
    ],
  },
  {
    version: "v1.9.8",
    date: "October 27, 2026",
    title: "Email outreach foundation",
    kind: "feature",
    items: [
      { kind: "feature", text: "Groundwork for Super Admin email campaigns: secure storage for campaigns, recipients, open/click activity and an unsubscribe block list." },
    ],
  },
  {
    version: "v1.9.7",
    date: "October 26, 2026",
    title: "Cleaner dental pages",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Dental clinic, pricing and case explanation pages use compact lists, a price table, a timeline and collapsible answers instead of repeated big cards, with smaller text." },
    ],
  },
  {
    version: "v1.9.6",
    date: "October 26, 2026",
    title: "Pricing tagline fixed",
    kind: "fix",
    items: [
      { kind: "fix", text: "The per-case pricing hero no longer says a case covers unlimited visits; it now states 30 days, up to 3 visits." },
    ],
  },
  {
    version: "v1.9.5",
    date: "October 26, 2026",
    title: "Case calculator and free signup cases",
    kind: "feature",
    items: [
      { kind: "feature", text: "Pricing page now has a calculator: enter one patient's visit dates to see cases and credits used." },
      { kind: "improvement", text: "Pricing now notes 10 free cases at signup and that credits never expire." },
    ],
  },
  {
    version: "v1.9.4",
    date: "October 26, 2026",
    title: "Clearer per-case examples",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Per-case pricing examples now explain, patient by patient, why each costs 1 or 2 cases." },
    ],
  },
  {
    version: "v1.9.3",
    date: "October 26, 2026",
    title: "Per-case explanation corrected",
    kind: "fix",
    items: [
      { kind: "fix", text: "Pricing pages now explain cases correctly: 30 days, up to 3 visits, paid in advance with credits." },
    ],
  },
  {
    version: "v1.9.2",
    date: "October 26, 2026",
    title: "Per-case pricing explained",
    kind: "improvement",
    items: [
      { kind: "fix", text: "Dental clinic page now shows the new setup fee + ₦1,000 per case pricing instead of old plans." },
      { kind: "feature", text: "New page explaining how ₦1,000 per patient case works, with examples." },
    ],
  },
  {
    version: "v1.9.1",
    date: "October 26, 2026",
    title: "Dental clinic pricing page",
    kind: "feature",
    items: [
      { kind: "feature", text: "New dental pricing page: ₦30,000–₦50,000 one-time setup plus ₦1,000 per patient case." },
      { kind: "improvement", text: "Simplified site menus by removing the separate features links." },
    ],
  },
  {
    version: "v1.9.0",
    date: "October 26, 2026",
    title: "Website visitor analytics",
    kind: "feature",
    items: [
      { kind: "feature", text: "Super admins can now see website visits — traffic sources, locations, devices and each visitor's page journey." },
    ],
  },
  {
    version: "v1.8.3",
    date: "October 25, 2026",
    title: "Tidier footer on phones",
    kind: "fix",
    items: [
      { kind: "fix", text: "Footer links on phones now sit in two rows of two columns instead of one long list." },
    ],
  },
  {
    version: "v1.8.2",
    date: "October 25, 2026",
    title: "New menu and footer",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The website menu now has Solutions and Resources dropdowns with short descriptions." },
      { kind: "improvement", text: "The footer was redesigned with a newsletter signup and organised link columns." },
    ],
  },
  {
    version: "v1.8.1",
    date: "October 25, 2026",
    title: "Blog autopilot runs on its own",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "The blog autopilot now runs automatically every hour, with no outside scheduler needed." },
    ],
  },
  {
    version: "v1.8.0",
    date: "October 25, 2026",
    title: "Blog autopilot, photos and calls to action",
    kind: "feature",
    items: [
      { kind: "feature", text: "Daily autopilot writes and publishes one article per category." },
      { kind: "feature", text: "Articles now include several photos, not just a cover." },
      { kind: "feature", text: "Every article has a call-to-action banner mid-way and at the end." },
      { kind: "improvement", text: "AI writing is warmer, speaks to one reader, and is tuned for Google search." },
    ],
  },
  {
    version: "v1.7.0",
    date: "October 25, 2026",
    title: "AI Blog Studio for super admins",
    kind: "feature",
    items: [
      { kind: "feature", text: "Brainstorm article ideas by chatting with Clinexus AI." },
      { kind: "feature", text: "Generate a full draft with a cover image in one click." },
      { kind: "feature", text: "Edit, publish or unpublish AI articles; published ones appear on the public blog." },
    ],
  },
  {
    version: "v1.6.3",
    date: "October 25, 2026",
    title: "Case credits explained, now ₦1,000 per case",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "Case price is now ₦1,000 per case." },
      { kind: "feature", text: "A 'How credits work' guide with examples opens from the wallet button." },
      { kind: "feature", text: "New article explaining pay-per-case billing." },
    ],
  },
  {
    version: "v1.6.2",
    date: "October 25, 2026",
    title: "All case billing loopholes closed",
    kind: "fix",
    items: [
      { kind: "fix", text: "A patient's name and date of birth are locked after their first case." },
      { kind: "fix", text: "One case covers up to 3 visits in 30 days; the 4th visit uses a new credit." },
      { kind: "fix", text: "Moving or reopening an old appointment outside its case window uses a credit." },
      { kind: "fix", text: "Invoices, prescriptions, lab orders, documents and images now need an active case." },
      { kind: "fix", text: "Adding items to old treatment plans or prescriptions needs an active case." },
      { kind: "fix", text: "Only platform admins can change a clinic's type." },
      { kind: "fix", text: "Finished waiting-room check-ins can't be reset to waiting." },
    ],
  },
  {
    version: "v1.6.1",
    date: "October 24, 2026",
    title: "Case billing can't be bypassed",
    kind: "fix",
    items: [
      { kind: "fix", text: "Adding notes, treatment plans or chart entries for a patient without an active case now uses a case credit." },
      { kind: "fix", text: "The patient on a note, treatment plan or chart entry can no longer be changed." },
    ],
  },
  {
    version: "v1.6.0",
    date: "October 24, 2026",
    title: "Pay-per-case billing for dental clinics",
    kind: "feature",
    items: [
      { kind: "feature", text: "Dental clinics now use prepaid case credits at ₦1,000 per case; a case covers a patient for 30 days." },
      { kind: "feature", text: "Credit balance shows in the dashboard header; at zero, new visits and walk-ins are blocked while existing records stay open." },
      { kind: "improvement", text: "The patient on a visit can no longer be swapped, and deleted visits don't refund credits." },
    ],
  },
  {
    version: "v1.5.0",
    date: "October 23, 2026",
    title: "AI pre-chair patient briefing",
    kind: "feature",
    items: [
      { kind: "feature", text: "Dentists get an AI snapshot of allergies, conditions, last visit, today's plan and patient notes — in the waiting-room queue (sparkle button) and at the top of the dental chart." },
    ],
  },
  {
    version: "v1.4.4",
    date: "October 23, 2026",
    title: "Free AI models",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "AI assistant now uses only free models, automatically falling back through 16 options." },
    ],
  },
  {
    version: "v1.4.3",
    date: "October 23, 2026",
    title: "AI automatic fallback",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "AI assistant now switches to a backup model automatically if the main one is unavailable." },
    ],
  },
  {
    version: "v1.4.2",
    date: "October 23, 2026",
    title: "New AI provider",
    kind: "improvement",
    items: [
      { kind: "improvement", text: "ClineXus AI assistant now runs on OpenRouter." },
    ],
  },
  {
    version: "v1.4.1",
    date: "October 22, 2026",
    title: "Always-fresh app & notification check",
    kind: "improvement",
    items: [
      {
        kind: "improvement",
        text: "Installed apps now check for updates in the background every hour, so everyone is on the latest version without reinstalling or tapping anything.",
      },
      {
        kind: "feature",
        text: "The installed app now asks to turn on notifications before it opens, so no one misses clinic alerts. If notifications were blocked, the app shows how to re-enable them.",
      },
    ],
  },
  {
    version: "v1.4.0",
    date: "October 22, 2026",
    title: "Register new patients on the spot",
    kind: "feature",
    items: [
      {
        kind: "feature",
        text: "Front desk can now register a brand-new patient directly inside the Walk-In and Book Appointment forms — no more detour to the Patients page. Tap + New patient, save, and the patient is selected automatically so you can pick a dentist right away.",
      },
      {
        kind: "improvement",
        text: "Dentist assignment is now part of the same flow for receptionists and admins: register, assign a dentist, and the patient is on their schedule or in the waiting queue in one pass.",
      },
    ],
  },
];

export const kindLabel: Record<UpdateKind, string> = {
  feature: "New feature",
  improvement: "Improvement",
  fix: "Bug fix",
};
