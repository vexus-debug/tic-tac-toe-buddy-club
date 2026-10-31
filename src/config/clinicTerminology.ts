// Clinic-type specific wording so every dashboard screen reads correctly
// for the clinic it belongs to (dental, eye, diagnostic, ...).

export interface ImageTypeOption {
  value: string;
  label: string;
}

export interface ClinicTerms {
  /** Label for the patient "history" tab */
  historyTab: string;
  /** Whether dental charting UI (tooth numbers, chart findings) applies */
  showDentalChart: boolean;
  /** Label for the per-item anatomical site field */
  siteLabel: string;
  /** Short prefix used when displaying a site value, e.g. "Tooth" */
  sitePrefix: string;
  /** Options for the patient image upload type select */
  imageTypes: ImageTypeOption[];
  /** Default image type */
  defaultImageType: string;
  /** Wording for the consent template library */
  consentLibraryLabel: string;
  consentLibraryDescription: string;
  /** Helper copy */
  inventoryHelp: string;
  prescriptionsHelp: string;
  patientProfileHelp: string;
  shopProductNamePlaceholder: string;
  shopProductDescriptionPlaceholder: string;
  /** Label for the treating clinician */
  clinician: string;
  clinicianPlural: string;
  /** Expense category value for clinic-specific consumables */
  consumablesCategory: string;
}

const dentalTerms: ClinicTerms = {
  historyTab: "Dental History",
  showDentalChart: true,
  siteLabel: "Tooth #",
  sitePrefix: "Tooth",
  imageTypes: [
    { value: "x-ray", label: "X-Ray" },
    { value: "intra-oral", label: "Intra-oral" },
    { value: "extra-oral", label: "Extra-oral" },
    { value: "other", label: "Other" },
  ],
  defaultImageType: "x-ray",
  consentLibraryLabel: "Import the standard dental library",
  consentLibraryDescription:
    "Standard dental consent forms with placeholders you can edit after importing. Templates you already have are skipped.",
  inventoryHelp:
    "Track dental supplies, consumables, and equipment to avoid running out during procedures.",
  prescriptionsHelp:
    "Create, manage, and track digital prescriptions issued to patients after their dental visit.",
  patientProfileHelp:
    "Click any patient row or card to open their full profile. You'll see appointments, invoices, dental charts, prescriptions, and more — all in one place.",
  shopProductNamePlaceholder: "Electric Toothbrush Pro",
  shopProductDescriptionPlaceholder: "High-quality dental care product...",
  clinician: "Dentist",
  clinicianPlural: "Dentists",
  consumablesCategory: "dental_consumables",
};

const eyeTerms: ClinicTerms = {
  historyTab: "Eye History",
  showDentalChart: false,
  siteLabel: "Eye (OD/OS/OU)",
  sitePrefix: "Eye",
  imageTypes: [
    { value: "fundus", label: "Fundus Photo" },
    { value: "oct", label: "OCT Scan" },
    { value: "slit-lamp", label: "Slit Lamp" },
    { value: "visual-field", label: "Visual Field" },
    { value: "topography", label: "Corneal Topography" },
    { value: "external", label: "External / Anterior Segment" },
    { value: "other", label: "Other" },
  ],
  defaultImageType: "fundus",
  consentLibraryLabel: "Import the standard eye care library",
  consentLibraryDescription:
    "Standard ophthalmic and optometric consent forms (dilation, LASIK, cataract surgery, intravitreal injection) with placeholders you can edit after importing. Templates you already have are skipped.",
  inventoryHelp:
    "Track frames, lenses, contact lenses, ophthalmic drugs, and equipment so you never run out during clinic.",
  prescriptionsHelp:
    "Create, manage, and track digital prescriptions issued to patients after their eye examination.",
  patientProfileHelp:
    "Click any patient row or card to open their full profile. You'll see appointments, invoices, eye records, optical prescriptions, and more — all in one place.",
  shopProductNamePlaceholder: "Anti-Glare Single Vision Lens",
  shopProductDescriptionPlaceholder: "High-quality eye care product...",
  clinician: "Optometrist",
  clinicianPlural: "Optometrists",
  consumablesCategory: "optical_consumables",
};

const genericTerms: ClinicTerms = {
  ...dentalTerms,
  historyTab: "Clinical History",
  showDentalChart: false,
  siteLabel: "Site",
  sitePrefix: "Site",
  imageTypes: [
    { value: "x-ray", label: "X-Ray" },
    { value: "scan", label: "Scan" },
    { value: "clinical-photo", label: "Clinical Photo" },
    { value: "other", label: "Other" },
  ],
  defaultImageType: "clinical-photo",
  consentLibraryLabel: "Import the standard consent library",
  consentLibraryDescription:
    "Standard consent forms with placeholders you can edit after importing. Templates you already have are skipped.",
  inventoryHelp:
    "Track clinical supplies, consumables, and equipment to avoid running out during procedures.",
  prescriptionsHelp:
    "Create, manage, and track digital prescriptions issued to patients after their visit.",
  patientProfileHelp:
    "Click any patient row or card to open their full profile. You'll see appointments, invoices, clinical records, prescriptions, and more — all in one place.",
  shopProductNamePlaceholder: "Product name",
  shopProductDescriptionPlaceholder: "High-quality care product...",
  clinician: "Clinician",
  clinicianPlural: "Clinicians",
  consumablesCategory: "clinical_consumables",
};

export function getClinicTerms(clinicType?: string | null): ClinicTerms {
  switch (clinicType) {
    case "dental":
      return dentalTerms;
    case "eye":
      return eyeTerms;
    default:
      return genericTerms;
  }
}
