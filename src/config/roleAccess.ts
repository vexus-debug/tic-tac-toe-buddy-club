type OrgRole = "owner" | "admin" | "manager" | "dentist" | "receptionist" | "hygienist" | "assistant" | "accountant" | "lab_technician" | "lab_assistant" | "procurement_officer" | "nurse";

// Maps each relative dashboard path to the org roles that can access it
export const PAGE_ROLE_ACCESS: Record<string, OrgRole[]> = {
  "dashboard": ["owner", "admin", "dentist", "receptionist", "hygienist", "assistant", "accountant", "lab_technician", "lab_assistant", "procurement_officer", "nurse"],
  "patients": ["owner", "admin", "dentist", "receptionist", "hygienist", "nurse"],
  "appointments": ["owner", "admin", "dentist", "receptionist", "hygienist", "nurse"],
  "dental-charts": ["owner", "admin", "dentist", "hygienist", "nurse"],
  "treatments": ["owner", "admin", "dentist"],
  "prescriptions": ["owner", "admin", "dentist"],
  "billing": ["owner", "admin", "receptionist", "accountant"],
  "reports": ["owner", "admin", "accountant"],
  "revenue-allocation": ["owner", "admin"],
  "lab-work": ["owner", "admin", "dentist"],
  "lab": ["owner", "admin", "lab_technician", "lab_assistant"],
  "lab/cases": ["owner", "admin", "lab_technician", "lab_assistant"],
  "lab/technicians": ["owner", "admin", "lab_technician", "lab_assistant"],
  "lab/billing": ["owner", "admin", "lab_technician", "lab_assistant"],
  "lab/settings": ["owner", "admin"],
  "staff": ["owner", "admin"],
  "inventory": ["owner", "admin", "receptionist", "procurement_officer", "nurse"],
  "notifications": ["owner", "admin", "dentist", "receptionist", "hygienist", "assistant", "accountant", "lab_technician", "lab_assistant", "procurement_officer", "nurse"],
  "settings": ["owner", "admin"],
  "subscription": ["owner", "admin"],
  "profile": ["owner", "admin", "dentist", "receptionist", "hygienist", "assistant", "accountant", "lab_technician", "lab_assistant", "procurement_officer", "nurse"],
  "tutorials": ["owner", "admin", "dentist", "receptionist", "hygienist", "assistant", "accountant", "lab_technician", "lab_assistant", "procurement_officer", "nurse"],
  "messages": ["owner", "admin", "dentist", "receptionist", "hygienist", "assistant", "accountant", "lab_technician", "lab_assistant", "procurement_officer", "nurse"],
  "reviews": ["owner", "admin", "receptionist"],
  "expenses": ["owner", "admin", "accountant", "procurement_officer"],
  "payment-plans": ["owner", "admin", "receptionist", "accountant"],
  "estimates": ["owner", "admin", "dentist", "receptionist"],
  "commissions": ["owner", "admin", "accountant"],
  "my-earnings": ["dentist", "hygienist"],
  "profitability": ["owner", "admin", "accountant"],
  "inventory-costs": ["owner", "admin", "procurement_officer"],
  "audit-log": ["owner", "admin"],
  "consent-forms": ["owner", "admin", "dentist", "nurse"],
  "documents": ["owner", "admin"],
  "automation": ["owner", "admin"],
  "website-settings": ["owner", "admin"],
  "branches": ["owner", "admin"],
  "waiting-list": ["owner", "admin", "dentist", "receptionist", "hygienist", "nurse"],
  "schedules": ["owner", "admin", "dentist"],
  "suppliers": ["owner", "admin", "procurement_officer"],
  "purchase-orders": ["owner", "admin", "receptionist", "procurement_officer"],
  "treatment-materials": ["owner", "admin", "dentist", "procurement_officer", "nurse"],
  "analytics": ["owner", "admin"],
  "shop-management": ["owner", "admin"],
  // Diagnostic centre — laboratory
  "diagnostics": ["owner", "admin", "lab_technician", "lab_assistant", "dentist"],
  "diagnostics/forms": ["owner", "admin", "lab_technician", "lab_assistant", "receptionist"],
  "diagnostics/forms/new": ["owner", "admin", "lab_technician", "lab_assistant", "receptionist"],
  "diagnostics/results": ["owner", "admin", "lab_technician", "lab_assistant", "receptionist", "dentist"],
  "diagnostics/tests": ["owner", "admin", "lab_technician"],
  "diagnostics/scientists": ["owner", "admin", "lab_technician"],
  "diagnostics/settings": ["owner", "admin"],
  // Diagnostic centre — imaging
  "imaging": ["owner", "admin", "lab_technician", "lab_assistant", "dentist"],
  "imaging/patients": ["owner", "admin", "lab_technician", "lab_assistant", "receptionist"],
  "imaging/scans": ["owner", "admin", "lab_technician", "lab_assistant", "dentist"],
  "imaging/register": ["owner", "admin", "lab_technician", "lab_assistant", "receptionist"],
  "imaging/appointments": ["owner", "admin", "lab_technician", "lab_assistant", "receptionist"],
  "imaging/activity": ["owner", "admin", "lab_technician"],
  // Diagnostic centre — pharmacy
  "pharmacy/drugs": ["owner", "admin", "receptionist", "assistant"],
  "pharmacy/dispensing": ["owner", "admin", "receptionist", "assistant"],
  // Eye clinic
  "eye": ["owner", "admin", "dentist", "hygienist", "receptionist"],
  "eye/exams": ["owner", "admin", "dentist", "hygienist"],
  "eye/prescriptions": ["owner", "admin", "dentist", "hygienist"],
  "eye/contact-lenses": ["owner", "admin", "dentist", "hygienist", "assistant"],
  "eye/orders": ["owner", "admin", "receptionist", "assistant"],
  "eye/diagnostics": ["owner", "admin", "dentist", "hygienist", "lab_technician"],
  "eye/reports": ["owner", "admin", "dentist", "hygienist", "lab_technician"],
  "eye/charts": ["owner", "admin", "dentist", "hygienist", "lab_technician"],
  "eye/surgery": ["owner", "admin", "dentist", "receptionist"],
};

/**
 * Eye clinics: menus by job.
 * receptionist = Front desk, hygienist = Optometrist, dentist = Doctor,
 * assistant = Optician, accountant = Cashier.
 */
const FRONT: OrgRole[] = ["receptionist"];
const OPTOM: OrgRole[] = ["dentist", "hygienist"];
const OPTICIAN: OrgRole[] = ["assistant"];
const CASHIER: OrgRole[] = ["accountant"];
const ALL_EYE: OrgRole[] = [...FRONT, ...OPTOM, ...OPTICIAN, ...CASHIER, "lab_technician", "lab_assistant"];

export const EYE_PAGE_ROLE_ACCESS: Record<string, OrgRole[]> = {
  "dashboard": ALL_EYE,
  "eye": [...FRONT, ...OPTOM],
  "patients": [...FRONT, ...OPTOM, ...OPTICIAN, ...CASHIER],
  "appointments": [...FRONT, ...OPTOM],
  "waiting-list": [...FRONT, ...OPTOM],
  "schedules": [...FRONT, ...OPTOM],
  "eye/flow": [...FRONT, ...OPTOM, ...OPTICIAN, ...CASHIER],
  "eye/visit": OPTOM,
  "eye/records": OPTOM,
  "eye/exams": OPTOM,
  "eye/prescriptions": [...OPTOM, ...OPTICIAN],
  "prescriptions": OPTOM,
  "eye/contact-lenses": [...OPTOM, ...OPTICIAN],
  "eye/orders": [...OPTICIAN, ...FRONT],
  "eye/pickup": [...OPTICIAN, ...FRONT],
  "eye/stock": [...OPTICIAN],
  "eye/diagnostics": [...OPTOM, "lab_technician"],
  "eye/reports": [...OPTOM, "lab_technician"],
  "eye/charts": [...OPTOM, "lab_technician"],
  "eye/surgery": [...OPTOM, ...FRONT],
  "eye/surgery-checklists": OPTOM,
  "eye/referrals": [...OPTOM, ...FRONT],
  "consent-forms": [...FRONT, ...OPTOM],
  "reviews": FRONT,
  "billing": [...CASHIER, ...FRONT],
  "estimates": [...CASHIER, ...FRONT],
  "payment-plans": CASHIER,
  "expenses": CASHIER,
  "revenue-allocation": CASHIER,
  "profitability": CASHIER,
  "reports": CASHIER,
  "analytics": [],
  "inventory": OPTICIAN,
  "suppliers": OPTICIAN,
  "purchase-orders": OPTICIAN,
  "shop-management": OPTICIAN,
  "staff": [], "documents": [...FRONT], "audit-log": [], "website-settings": [],
};

/**
 * Dental labs: menus by job.
 * lab_technician = Technician, lab_assistant = Case intake / dispatch,
 * receptionist = Front office, accountant = Accounts, dentist = Lab manager (production lead).
 */
const TECH: OrgRole[] = ["lab_technician"];
const INTAKE: OrgRole[] = ["lab_assistant", "receptionist"];
const ACCTS: OrgRole[] = ["accountant"];
const LEAD: OrgRole[] = ["dentist"];
const ALL_DLAB: OrgRole[] = [...TECH, ...INTAKE, ...ACCTS, ...LEAD];

export const DLAB_PAGE_ROLE_ACCESS: Record<string, OrgRole[]> = {
  "dashboard": ALL_DLAB,
  "dlab/cases": [...TECH, ...INTAKE, ...LEAD],
  "dlab/calendar": [...TECH, ...INTAKE, ...LEAD],
  "dlab/bench": [...TECH, ...LEAD],
  "dlab/cam": [...TECH, ...LEAD],
  "dlab/r/recurring": [...INTAKE, ...ACCTS, ...LEAD],
  "dlab/r/work-types": [...TECH, ...INTAKE, ...LEAD, ...ACCTS],
  "dlab/catalogue": [...TECH, ...INTAKE, ...LEAD, ...ACCTS],
  "dlab/store": [...TECH, ...LEAD, ...ACCTS],
  "dlab/r/price-tiers": [...ACCTS, ...LEAD],
  "dlab/r/surcharges": [...INTAKE, ...ACCTS, ...LEAD],
  "dlab/r/shades": [...TECH, ...LEAD],
  "dlab/clients": [...INTAKE, ...ACCTS, ...LEAD],
  "dlab/r/client-prices": [...ACCTS, ...LEAD],
  "dlab/invoices": [...ACCTS, ...LEAD],
  "dlab/statements": ACCTS,
  "dlab/r/client-payments": ACCTS,
  "dlab/r/credit-notes": ACCTS,
  "dlab/r/shipments": [...INTAKE, ...LEAD],
  "dlab/r/dispatch": [...INTAKE, ...LEAD],
  "dlab/r/warranties": [...TECH, ...INTAKE, ...LEAD],
  "dlab/r/qc": [...TECH, ...LEAD],
  "dlab/r/materials": [...TECH, ...LEAD, ...ACCTS],
  "dlab/r/pickups": [...INTAKE, ...LEAD],
  "dlab/r/external-labs": [...LEAD, ...ACCTS],
  "dlab/r/lab-payments": ACCTS,
  "dlab/r/skills": [...TECH, ...LEAD],
  "dlab/r/salary-allocation": ACCTS,
  "dlab/r/equipment": [...TECH, ...LEAD],
  "dlab/reports": [...ACCTS, ...LEAD],
  "expenses": ACCTS,
  "staff": [],
};

/**
 * Check if a user's org role allows access to a relative page path.
 * orgRole is the user's role within the current organization.
 */
export function hasPageAccess(orgRole: string, relativePath: string, clinicType?: string): boolean {
  if (orgRole === "owner" || orgRole === "admin" || orgRole === "manager") return true;
  const map = clinicType === "eye" ? { ...PAGE_ROLE_ACCESS, ...EYE_PAGE_ROLE_ACCESS }
    : clinicType === "dental_lab" ? { ...PAGE_ROLE_ACCESS, ...DLAB_PAGE_ROLE_ACCESS } : PAGE_ROLE_ACCESS;
  // Handle patient profile sub-routes
  if (relativePath.startsWith("patients/")) {
    return map["patients"]?.includes(orgRole as OrgRole) ?? false;
  }
  const allowed = map[relativePath.split("?")[0]];
  if (!allowed) return true; // unknown paths are accessible
  return allowed.includes(orgRole as OrgRole);
}

/**
 * Extract relative path from full pathname.
 * e.g. "/clinic/my-clinic/patients" -> "patients"
 */
export function extractRelativePath(pathname: string): string {
  const match = pathname.match(/^(?:\/app)?\/clinic\/[^/]+\/(.+)$/);
  return match ? match[1] : "dashboard";
}

const EYE_ROLE_LABELS: Record<string, string> = {
  receptionist: "Front desk",
  hygienist: "Optometrist",
  dentist: "Doctor / Optometrist",
  assistant: "Optician",
  accountant: "Cashier",
};

const DLAB_ROLE_LABELS: Record<string, string> = {
  dentist: "Lab manager",
  lab_technician: "Dental technician",
  lab_assistant: "Case intake & dispatch",
  receptionist: "Front office",
  accountant: "Accounts",
};

const CLINIC_STAFF_ROLES = ["dentist", "assistant", "hygienist", "receptionist", "accountant", "lab_technician", "lab_assistant", "nurse", "procurement_officer"];
const DLAB_STAFF_ROLES = ["lab_technician", "lab_assistant", "dentist", "receptionist", "accountant"];

/** Roles that can be assigned to staff for a given clinic type (excluding admin/manager). */
export function getStaffRoles(clinicType?: string): string[] {
  return clinicType === "dental_lab" ? DLAB_STAFF_ROLES : CLINIC_STAFF_ROLES;
}

export function getRoleLabel(role: string, clinicType?: string): string {
  if (clinicType === "eye" && EYE_ROLE_LABELS[role]) return EYE_ROLE_LABELS[role];
  if (clinicType === "dental_lab" && DLAB_ROLE_LABELS[role]) return DLAB_ROLE_LABELS[role];
  const labels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    dentist: "Dentist",
    receptionist: "Receptionist",
    hygienist: "Hygienist",
    assistant: "Assistant",
    accountant: "Accountant",
    lab_technician: "Lab Technician",
    lab_assistant: "Lab Assistant",
    procurement_officer: "Procurement Officer",
    nurse: "Nurse",
    super_admin: "Super Admin",
    user: "User",
  };
  return labels[role] || role;
}
