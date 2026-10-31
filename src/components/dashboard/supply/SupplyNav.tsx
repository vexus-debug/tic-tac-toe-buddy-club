import { NavLink } from "react-router-dom";
import { AlertTriangle, CalendarClock, Clock } from "lucide-react";
import { useClinicPath, useSupplyAlerts } from "@/hooks/useSupply";

const pages = [
  { to: "inventory", label: "Inventory" },
  { to: "purchase-orders", label: "Purchase Orders" },
  { to: "suppliers", label: "Suppliers" },
  { to: "treatment-materials", label: "Treatment Materials" },
  { to: "inventory-costs", label: "Inventory Costs" },
];

/** Shared bar linking all Inventory & Supply pages, with live alerts. */
export function SupplyNav() {
  const path = useClinicPath();
  const { data: alerts } = useSupplyAlerts();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/60 p-1.5">
      <nav className="flex flex-wrap gap-1">
        {pages.map((p) => (
          <NavLink
            key={p.to}
            to={path(p.to)}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`
            }
          >
            {p.label}
          </NavLink>
        ))}
      </nav>
      {alerts && (alerts.lowStock > 0 || alerts.expiring > 0 || alerts.overdue > 0) && (
        <div className="flex flex-wrap gap-1.5 px-1 text-[11px]">
          {alerts.lowStock > 0 && (
            <NavLink to={path("inventory")} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
              <AlertTriangle className="h-3 w-3" /> {alerts.lowStock} low stock
            </NavLink>
          )}
          {alerts.expiring > 0 && (
            <NavLink to={path("inventory")} className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
              <CalendarClock className="h-3 w-3" /> {alerts.expiring} expiring
            </NavLink>
          )}
          {alerts.overdue > 0 && (
            <NavLink to={path("purchase-orders")} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
              <Clock className="h-3 w-3" /> {alerts.overdue} overdue orders
            </NavLink>
          )}
        </div>
      )}
    </div>
  );
}
