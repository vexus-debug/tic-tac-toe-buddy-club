import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, Stethoscope, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useOrg } from "@/hooks/useOrg";
import { hasPageAccess } from "@/config/roleAccess";

interface MobileTabBarProps {
  aiOpen: boolean;
  onOpenAI: () => void;
  onCloseAI: () => void;
}

/** Native-app style bottom navigation for phones. */
export function MobileTabBar({ aiOpen, onOpenAI, onCloseAI }: MobileTabBarProps) {
  const { toggleSidebar } = useSidebar();
  const { currentOrg, basePath } = useOrg();
  const role = currentOrg?.role ?? "";
  const clinicType = currentOrg?.clinic_type;

  const links = ((clinicType as string) === "dental_lab" ? [
    { path: "dashboard", label: "Home", icon: LayoutDashboard },
    { path: "dlab/cases", label: "Cases", icon: Users },
    { path: "dlab/calendar", label: "Calendar", icon: CalendarDays },
  ] : [
    { path: "dashboard", label: "Home", icon: LayoutDashboard },
    { path: "patients", label: "Patients", icon: Users },
    { path: "appointments", label: "Schedule", icon: CalendarDays },
  ]).filter((l) => hasPageAccess(role, l.path, clinicType));

  const itemCls = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors active:scale-95 ${
      active ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav
      className="shrink-0 border-t border-border bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      <div className="flex items-stretch">
        {links.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={`${basePath}/${path}`} onClick={onCloseAI} className={({ isActive }) => itemCls(isActive && !aiOpen)}>
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${isActive && !aiOpen ? "bg-primary/10" : ""}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={onOpenAI} className={itemCls(aiOpen)}>
          <span className={`relative flex h-7 w-12 items-center justify-center rounded-full ${aiOpen ? "bg-primary/10" : ""}`}>
            <Stethoscope className="h-5 w-5" />
            {!aiOpen && <span className="absolute right-2.5 top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
          </span>
          AI
        </button>
        <button type="button" onClick={toggleSidebar} className={itemCls(false)}>
          <span className="flex h-7 w-12 items-center justify-center rounded-full">
            <Menu className="h-5 w-5" />
          </span>
          More
        </button>
      </div>
    </nav>
  );
}
