import {
  CalendarDays, Users, Stethoscope, Microscope, CreditCard, Package,
  BarChart3, Settings, ClipboardList, Wallet, Truck, Wrench, Link2,
} from "lucide-react";
import { hasPageAccess } from "@/config/roleAccess";

/**
 * Dental navigation consolidation: 30+ sidebar links collapse into 8 hub
 * domains. Each hub keeps one primary page in the sidebar; the other screens
 * in the domain are reached through the tab bar rendered above the page
 * (see components/dashboard/HubTabs.tsx). Every old URL stays a real route,
 * so no redirects or broken bookmarks.
 */
export interface HubTab {
  title: string;
  path: string;
}

export interface HubDomain {
  key: string;
  title: string;
  icon: any;
  primaryPath: string;
  tabs: HubTab[];
}

export const DENTAL_HUBS: HubDomain[] = [
  {
    key: "schedule",
    title: "Schedule",
    icon: CalendarDays,
    primaryPath: "appointments",
    tabs: [
      { title: "Appointments", path: "appointments" },
      { title: "Staff Schedules", path: "schedules" },
      { title: "Waiting List", path: "waiting-list" },
    ],
  },
  {
    key: "patients",
    title: "Patients",
    icon: Users,
    primaryPath: "patients",
    tabs: [
      { title: "Patient List", path: "patients" },
      { title: "Feedback", path: "reviews" },
    ],
  },
  {
    key: "clinical",
    title: "Clinical",
    icon: Stethoscope,
    primaryPath: "dental-charts",
    tabs: [
      { title: "Dental Charts", path: "dental-charts" },
      { title: "Treatments", path: "treatments" },
      { title: "Prescriptions", path: "prescriptions" },
      { title: "Consent Forms", path: "consent-forms" },
    ],
  },
  {
    key: "lab",
    title: "Lab",
    icon: Microscope,
    primaryPath: "lab",
    tabs: [
      { title: "Lab Dashboard", path: "lab" },
      { title: "Lab Cases", path: "lab/cases" },
      { title: "Work Orders", path: "lab-work" },
      { title: "Technicians", path: "lab/technicians" },
      { title: "Lab Billing", path: "lab/billing" },
    ],
  },
  {
    key: "billing",
    title: "Billing",
    icon: CreditCard,
    primaryPath: "billing",
    tabs: [
      { title: "Invoices & Payments", path: "billing" },
      { title: "Estimates", path: "estimates" },
      { title: "Payment Plans", path: "payment-plans" },
      { title: "Expenses", path: "expenses" },
      { title: "My Earnings", path: "my-earnings" },
    ],
  },
  {
    key: "inventory",
    title: "Inventory",
    icon: Package,
    primaryPath: "inventory",
    tabs: [
      { title: "Stock", path: "inventory" },
      { title: "Material Costs", path: "inventory-costs" },
      { title: "Treatment Materials", path: "treatment-materials" },
      { title: "Suppliers", path: "suppliers" },
      { title: "Purchase Orders", path: "purchase-orders" },
    ],
  },
  {
    key: "insights",
    title: "Insights",
    icon: BarChart3,
    primaryPath: "reports",
    tabs: [
      { title: "Reports", path: "reports" },
      { title: "Advanced Analytics", path: "analytics" },
      { title: "Commissions", path: "commissions" },
      { title: "Profitability", path: "profitability" },
      { title: "Revenue Allocation", path: "revenue-allocation" },
    ],
  },
  {
    key: "settings",
    title: "Settings",
    icon: Settings,
    primaryPath: "settings",
    tabs: [
      { title: "Practice Settings", path: "settings" },
      { title: "Staff", path: "staff" },
      { title: "Documents", path: "documents" },
      { title: "Audit Log", path: "audit-log" },
      { title: "Lab Settings", path: "lab/settings" },
      { title: "Website Settings", path: "website-settings" },
      { title: "Shop Management", path: "shop-management" },
      { title: "Automation", path: "automation" },
    ],
  },
];

function pathMatchesTab(relativePath: string, tabPath: string): boolean {
  // Exact matches, plus patient profile sub-routes (patients/:id).
  return relativePath === tabPath || (tabPath === "patients" && relativePath.startsWith("patients/"));
}

/** Dental lab: same hub pattern, 18+ links collapse into 6 domains. */
export const DENTAL_LAB_HUBS: HubDomain[] = [
  {
    key: "production",
    title: "Production",
    icon: ClipboardList,
    primaryPath: "dlab/cases",
    tabs: [
      { title: "Case Board", path: "dlab/cases" },
      { title: "My Bench", path: "dlab/bench" },
      { title: "CAD/CAM", path: "dlab/cam" },
      { title: "Calendar", path: "dlab/calendar" },
      { title: "Quality Control", path: "dlab/r/qc" },
      { title: "Remakes & Warranties", path: "dlab/r/warranties" },
    ],
  },
  {
    key: "catalogue",
    title: "Catalogue & Stock",
    icon: Package,
    primaryPath: "dlab/catalogue",
    tabs: [
      { title: "Catalogue", path: "dlab/catalogue" },
      { title: "Work Types", path: "dlab/r/work-types" },
      { title: "Material Store", path: "dlab/store" },
      { title: "Materials & Lots", path: "dlab/r/materials" },
      { title: "Shade Library", path: "dlab/r/shades" },
    ],
  },
  {
    key: "clients",
    title: "Clients & Billing",
    icon: Wallet,
    primaryPath: "dlab/clients",
    tabs: [
      { title: "Clients", path: "dlab/clients" },
      { title: "Recurring Orders", path: "dlab/r/recurring" },
      { title: "Billing", path: "dlab/billing" },
    ],
  },
  {
    key: "logistics",
    title: "Logistics",
    icon: Truck,
    primaryPath: "dlab/r/pickups",
    tabs: [
      { title: "Inbound Pickups", path: "dlab/r/pickups" },
      { title: "Shipments", path: "dlab/r/shipments" },
      { title: "Dispatch Runs", path: "dlab/r/dispatch" },
    ],
  },
  {
    key: "outsourcing",
    title: "Outsourcing",
    icon: Link2,
    primaryPath: "dlab/r/external-labs",
    tabs: [
      { title: "External Labs", path: "dlab/r/external-labs" },
      { title: "Lab Payments", path: "dlab/r/lab-payments" },
    ],
  },
  {
    key: "workshop",
    title: "Team & Workshop",
    icon: Wrench,
    primaryPath: "staff",
    tabs: [
      { title: "Staff", path: "staff" },
      { title: "Skills Matrix", path: "dlab/r/skills" },
      { title: "Salary & Piece-rate", path: "dlab/r/salary-allocation" },
      { title: "Equipment", path: "dlab/r/equipment" },
    ],
  },
  {
    key: "insights",
    title: "Insights",
    icon: BarChart3,
    primaryPath: "dlab/reports",
    tabs: [
      { title: "Reports", path: "dlab/reports" },
      { title: "Expenses", path: "expenses" },
    ],
  },
];

/** Hub-navigation clinic types and their domains. */
export function hubsForClinicType(clinicType?: string): HubDomain[] | null {
  if (clinicType === "dental") return DENTAL_HUBS;
  if (clinicType === "dental_lab") return DENTAL_LAB_HUBS;
  return null;
}

export function getHubForPath(relativePath: string, clinicType: string = "dental"): HubDomain | undefined {
  return (hubsForClinicType(clinicType) || []).find((hub) => hub.tabs.some((tab) => pathMatchesTab(relativePath, tab.path)));
}

export function hubIsActive(hub: HubDomain, relativePath: string): boolean {
  return hub.tabs.some((tab) => pathMatchesTab(relativePath, tab.path));
}

export function visibleHubTabs(hub: HubDomain, orgRole: string, clinicType?: string, isBranch?: boolean): HubTab[] {
  return hub.tabs.filter(
    (tab) =>
      hasPageAccess(orgRole, tab.path, clinicType) &&
      !(isBranch && (tab.path === "website-settings" || tab.path === "shop-management"))
  );
}

/** Hubs the role can open, each trimmed to its visible tabs. */
export function visibleHubs(orgRole: string, clinicType: string = "dental", isBranch?: boolean) {
  return (hubsForClinicType(clinicType) || []).map((hub) => ({ hub, tabs: visibleHubTabs(hub, orgRole, clinicType, isBranch) }))
    .filter(({ tabs }) => tabs.length > 0);
}
