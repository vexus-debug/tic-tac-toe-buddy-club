// Dental laboratory (standalone B2B lab) — production stages and register definitions.

export const LAB_STAGES = [
  { key: "pending", label: "Received", hint: "Checked in, waiting to start" },
  { key: "design", label: "Design / CAD", hint: "Models, scans and digital design" },
  { key: "milling", label: "Milling & Printing", hint: "Milling, printing, sintering" },
  { key: "ceramics", label: "Ceramics & Finishing", hint: "Layering, staining, glazing" },
  { key: "qc", label: "Quality Check", hint: "Final inspection before release" },
  { key: "ready", label: "Ready to Ship", hint: "Packed and waiting for dispatch" },
  { key: "delivered", label: "Delivered", hint: "Received by the clinic" },
] as const;

export type LabStage = (typeof LAB_STAGES)[number]["key"];

/** Parent case status once a remake has been spawned from it. */
export const REMAKE_SPAWNED = "remake_spawned";

/** Older records used "in-progress"; treat them as design. Remade originals count as delivered work. */
export function normalizeStage(status: string | null | undefined): LabStage {
  if (!status) return "pending";
  if (status === "in-progress") return "design";
  if (status === REMAKE_SPAWNED) return "delivered";
  return (LAB_STAGES.find((s) => s.key === status)?.key ?? "pending") as LabStage;
}

export function stageLabel(status: string | null | undefined) {
  if (status === REMAKE_SPAWNED) return "Remake spawned";
  return LAB_STAGES.find((s) => s.key === normalizeStage(status))?.label ?? "Received";
}

export const WORK_TYPES = [
  "Zirconia crown", "E.max crown", "PFM crown", "Bridge", "Implant crown", "Veneer",
  "Inlay / Onlay", "Full denture", "Partial denture", "Night guard", "Clear aligner", "Model / Study cast",
];

export type FieldType = "text" | "number" | "date" | "select" | "textarea";
export interface RegisterField { key: string; label: string; type?: FieldType; options?: string[]; }
export interface RegisterConfig {
  kind: string;
  title: string;
  description: string;
  itemName: string;
  titleLabel: string;
  amountLabel?: string;
  dateLabel?: string;
  statuses: string[];
  fields: RegisterField[];
  /** How the amount is shown: money (default) or a plain count of units. */
  amountFormat?: "money" | "units";
  /** Whether "Total shown" makes sense (false for unit prices and stock counts). */
  showTotal?: boolean;
}

export const LAB_REGISTERS: Record<string, RegisterConfig> = {
  qc: {
    kind: "qc", title: "Quality Control", itemName: "inspection", titleLabel: "Case number",
    description: "Independent final inspection before any case is released to dispatch.",
    dateLabel: "Inspected", statuses: ["passed", "rework needed", "failed"],
    fields: [
      { key: "technician", label: "Made by (technician)" },
      { key: "inspector", label: "Inspected by" },
      { key: "margins", label: "Margins", type: "select", options: ["Pass", "Fail"] },
      { key: "occlusion", label: "Occlusion & contacts", type: "select", options: ["Pass", "Fail"] },
      { key: "shade", label: "Shade match", type: "select", options: ["Pass", "Fail"] },
      { key: "finish", label: "Glaze / polish", type: "select", options: ["Pass", "Fail"] },
      { key: "disinfected", label: "Disinfected & packed", type: "select", options: ["Yes", "No"] },
      { key: "defect", label: "Defect category", type: "select", options: ["None", "Fit", "Shade", "Contacts", "Occlusion", "Porosity / crack", "Aesthetics", "Other"] },
      { key: "notes", label: "Inspector notes", type: "textarea" },
    ],
  },
  materials: {
    kind: "materials", title: "Materials & Lots", itemName: "material lot", titleLabel: "Material",
    description: "Zirconia discs, resins, porcelains and alloys with lot numbers for traceability.",
    amountLabel: "Quantity in stock", dateLabel: "Expiry date", statuses: ["in stock", "low", "used up", "recalled"],
    amountFormat: "units", showTotal: false,
    fields: [
      { key: "category", label: "Category", type: "select", options: ["Zirconia disc", "Lithium disilicate", "PMMA / wax", "3D printing resin", "Porcelain powder", "Alloy / titanium", "Implant component", "Other"] },
      { key: "lot", label: "Lot / batch number" },
      { key: "brand", label: "Manufacturer / brand" },
      { key: "spec", label: "Shade" },
      { key: "unit", label: "Counted in", type: "select", options: ["discs", "blocks", "bottles", "ml", "grams", "pieces"] },
      { key: "min_stock", label: "Reorder when at or below", type: "number" },
      { key: "size", label: "Size (e.g. 98 mm × 14 mm, 500 ml, 4.3 mm platform)" },
      { key: "translucency", label: "Translucency", type: "select", options: ["HT", "ST", "SHT", "UT", "Multi-layer", "Multi-Layer 3D Pro", "Opaque", "Not applicable"] },
      { key: "thickness", label: "Disc thickness", type: "select", options: ["10 mm", "12 mm", "14 mm", "16 mm", "18 mm", "20 mm", "25 mm", "Not applicable"] },
      { key: "wavelength", label: "Resin wavelength", type: "select", options: ["405 nm", "385 nm", "Not applicable"] },
      { key: "volume_ml", label: "Resin volume (ml)", type: "number" },
      { key: "bio_class", label: "Biocompatibility class", type: "select", options: ["Class I", "Class IIa", "Class IIb", "Non-medical", "Not applicable"] },
      { key: "platform", label: "Implant platform", type: "select", options: ["3.0 mm", "3.5 mm", "4.3 mm", "5.0 mm", "5.5 mm", "Not applicable"] },
      { key: "interface", label: "Implant interface", type: "select", options: ["Engaging", "Non-engaging", "Not applicable"] },
      { key: "unit_cost", label: "Cost per unit (₦)", type: "number" },
      { key: "ce", label: "CE / ISO mark", type: "select", options: ["Yes", "No"] },
      { key: "supplier", label: "Supplier" },
    ],
  },
  pickups: {
    kind: "pickups", title: "Inbound Pickups", itemName: "pickup request", titleLabel: "Client clinic",
    description: "Clinic requests to collect impressions, models or returns.",
    dateLabel: "Pickup date", statuses: ["requested", "en route", "collected", "checked in"],
    fields: [
      { key: "doctor", label: "Doctor" },
      { key: "items", label: "Items (trays, models)" },
      { key: "address", label: "Pickup address", type: "textarea" },
      { key: "urgency", label: "Urgency", type: "select", options: ["Normal", "Rush"] },
      { key: "driver", label: "Assigned driver" },
    ],
  },
  recurring: {
    kind: "recurring", title: "Recurring Orders", itemName: "recurring order", titleLabel: "Order name",
    description: "Standing orders from clinics that repeat on a schedule (e.g. weekly night guards).",
    amountLabel: "Price per order", dateLabel: "Next due", statuses: ["active", "paused", "ended"],
    fields: [
      { key: "client", label: "Client clinic" },
      { key: "work_type", label: "Work type", type: "select", options: WORK_TYPES },
      { key: "frequency", label: "Frequency", type: "select", options: ["Weekly", "Fortnightly", "Monthly", "Quarterly"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "work-types": {
    kind: "work-types", title: "Work Types", itemName: "work type", titleLabel: "Work type",
    description: "Your catalogue of restorations with default price and turnaround.",
    amountLabel: "Default price", statuses: ["active", "retired"], showTotal: false,
    fields: [
      { key: "category", label: "Clinical domain", type: "select", options: ["Fixed Prosthetics", "Removables", "Implants", "Orthodontics & Splints", "Other"] },
      { key: "turnaround_days", label: "Turnaround (working days)", type: "number" },
      { key: "material", label: "Default material" },
      { key: "compatible_materials", label: "Compatible materials (e.g. Zirconia HT, PMMA, Co-Cr)" },
      { key: "cdt", label: "CDT / procedure code (e.g. D2740)" },
      { key: "multi_unit", label: "Multi-unit (bridge)", type: "select", options: ["No", "Yes"] },
      { key: "unit_rule", label: "Bridge pricing rule", type: "select", options: ["Per unit", "Abutments + pontics same fee", "Flat per bridge", "Not applicable"] },
      { key: "min_units", label: "Minimum units", type: "number" },
    ],
  },
  shades: {
    kind: "shades", title: "Shade Library", itemName: "shade", titleLabel: "Shade code",
    description: "Shade guides and custom shade notes your ceramists match against.",
    statuses: ["active", "retired"],
    fields: [
      { key: "guide", label: "Shade guide", type: "select", options: ["VITA Classical", "VITA 3D-Master", "Ivoclar Chromascop", "Custom"] },
      { key: "cervical", label: "Cervical (gum third)" },
      { key: "body", label: "Body (middle third)" },
      { key: "incisal", label: "Incisal / translucency" },
      { key: "stump", label: "Stump shade", type: "select", options: ["ND1", "ND2", "ND3", "ND4", "ND5", "ND6", "ND7", "ND8", "ND9"] },
      { key: "notes", label: "Characterisation notes", type: "textarea" },
      { key: "recipe", label: "Stain / glaze recipe and firing notes", type: "textarea" },
    ],
  },
  "external-labs": {
    kind: "external-labs", title: "External Labs", itemName: "partner lab", titleLabel: "Lab name",
    description: "Partner labs you outsource milling, printing or specialist work to.",
    statuses: ["active", "inactive"],
    fields: [
      { key: "service", label: "Services", type: "text" },
      { key: "contact", label: "Contact person" },
      { key: "phone", label: "Phone" },
      { key: "turnaround_days", label: "Turnaround (days)", type: "number" },
    ],
  },
  "lab-payments": {
    kind: "lab-payments", title: "Lab Payments", itemName: "payment to a partner lab", titleLabel: "Partner lab",
    description: "What you owe and have paid to external labs for outsourced work.",
    amountLabel: "Amount", dateLabel: "Payment date", statuses: ["due", "paid"],
    fields: [{ key: "case_ref", label: "Case number" }, { key: "method", label: "Method", type: "select", options: ["Transfer", "Cash", "Card"] }],
  },
  shipments: {
    kind: "shipments", title: "Shipments", itemName: "shipment", titleLabel: "Shipment / courier ref",
    description: "Inbound impressions and outbound finished work moving between you and clinics.",
    dateLabel: "Ship date", statuses: ["scheduled", "in transit", "delivered", "returned"],
    fields: [
      { key: "direction", label: "Direction", type: "select", options: ["Outbound to clinic", "Inbound from clinic"] },
      { key: "client", label: "Client clinic" },
      { key: "cases", label: "Case numbers" },
      { key: "courier", label: "Courier / driver" },
    ],
  },
  dispatch: {
    kind: "dispatch", title: "Dispatch Runs", itemName: "dispatch run", titleLabel: "Run name",
    description: "Plan daily delivery routes and who is driving.",
    dateLabel: "Run date", statuses: ["planned", "out", "completed"],
    fields: [{ key: "driver", label: "Driver" }, { key: "route", label: "Route / stops", type: "textarea" }],
  },
  warranties: {
    kind: "warranties", title: "Warranties & Remakes", itemName: "warranty claim", titleLabel: "Case number",
    description: "Track remakes, their cause and whether they are covered.",
    dateLabel: "Reported", statuses: ["open", "in remake", "resolved", "rejected"],
    fields: [
      { key: "client", label: "Client clinic" },
      { key: "reason", label: "Reason", type: "select", options: ["Fit", "Shade", "Fracture", "Contact / occlusion", "Clinic error", "Other"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  skills: {
    kind: "skills", title: "Skills Matrix", itemName: "skill", titleLabel: "Technician",
    description: "Who can do what — so work is routed to the right hands.",
    statuses: ["certified", "training"],
    fields: [
      { key: "skill", label: "Skill", type: "select", options: ["CAD design", "Milling", "3D printing", "Ceramic layering", "Staining & glazing", "Dentures", "Implants", "QC"] },
      { key: "level", label: "Level", type: "select", options: ["Junior", "Intermediate", "Senior", "Master"] },
    ],
  },
  "salary-allocation": {
    kind: "salary-allocation", title: "Salary Allocation", itemName: "salary entry", titleLabel: "Staff member",
    description: "Monthly base pay plus per-unit production bonuses.",
    amountLabel: "Amount", dateLabel: "Pay month", statuses: ["pending", "paid"],
    fields: [{ key: "type", label: "Type", type: "select", options: ["Base salary", "Unit bonus", "Overtime", "Deduction"] }, { key: "units", label: "Units produced", type: "number" }],
  },
  equipment: {
    kind: "equipment", title: "Equipment", itemName: "machine", titleLabel: "Machine",
    description: "Mills, printers, furnaces and scanners with service dates.",
    dateLabel: "Next service", statuses: ["working", "needs service", "down"],
    fields: [
      { key: "type", label: "Type", type: "select", options: ["Milling machine", "3D printer", "Sintering furnace", "Ceramic furnace", "Scanner", "Other"] },
      { key: "serial", label: "Serial number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "client-prices": {
    kind: "client-prices", title: "Client Prices", itemName: "client price", titleLabel: "Client clinic",
    description: "Special price agreements per clinic and work type.",
    amountLabel: "Agreed price", statuses: ["active", "expired"],
    fields: [
      { key: "work_type", label: "Work type (leave empty for a tier-only agreement)", type: "select", options: WORK_TYPES },
      { key: "tier", label: "Price tier (name from Price Schedules, e.g. Tier A)" },
      { key: "notes", label: "Notes" },
    ],
  },
  "price-tiers": {
    kind: "price-tiers", title: "Price Schedules", itemName: "price tier", titleLabel: "Tier name",
    description: "Reusable discount tiers (Standard, Tier A/B/C). Clinics on a tier pay the catalogue price less this discount unless they have a custom price.",
    amountLabel: "Discount %", amountFormat: "units", statuses: ["active", "retired"], showTotal: false,
    fields: [{ key: "notes", label: "Who qualifies", type: "textarea" }],
  },
  surcharges: {
    kind: "surcharges", title: "Add-ons & Surcharges", itemName: "add-on", titleLabel: "Add-on name",
    description: "Optional charges: wax-ups, soft tissue models, characterisation and rush fees.",
    amountLabel: "Charge", statuses: ["active", "retired"], showTotal: false,
    fields: [
      { key: "group", label: "Group", type: "select", options: ["Diagnostic & models", "Custom finishing", "Rush service", "Other"] },
      { key: "charge_type", label: "Charge type", type: "select", options: ["Flat fee", "Per unit", "Percent of case fee"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "credit-notes": {
    kind: "credit-notes", title: "Credit Notes", itemName: "credit note", titleLabel: "Client clinic",
    description: "Credits issued for remakes, returns or pricing corrections.",
    amountLabel: "Credit amount", dateLabel: "Issued", statuses: ["issued", "applied", "void"],
    fields: [{ key: "invoice", label: "Invoice number" }, { key: "reason", label: "Reason", type: "textarea" }],
  },
  "client-payments": {
    kind: "client-payments", title: "Payments Received", itemName: "payment", titleLabel: "Client clinic",
    description: "Payments received from clinics against their statements.",
    amountLabel: "Amount", dateLabel: "Received", statuses: ["received", "bounced"],
    fields: [{ key: "method", label: "Method", type: "select", options: ["Transfer", "Cash", "Card", "Cheque"] }, { key: "reference", label: "Reference" }],
  },
};
