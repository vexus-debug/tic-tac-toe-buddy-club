import { Link, useLocation } from "react-router-dom";
import { useOrg } from "@/hooks/useOrg";
import { hasPageAccess, extractRelativePath } from "@/config/roleAccess";
import { getHubForPath, visibleHubTabs } from "@/config/navDomains";
import { cn } from "@/lib/utils";

/**
 * In-page tab bar for consolidated navigation domains (dental).
 * Sits under the header and jumps between the screens of the current hub,
 * so the sidebar itself only needs one link per domain.
 */
export function HubTabs() {
  const { currentOrg, basePath, isBranch } = useOrg();
  const location = useLocation();
  const clinicType = currentOrg?.clinic_type || "dental";
  if (clinicType !== "dental" && clinicType !== "dental_lab") return null;

  const orgRole = currentOrg?.role || "receptionist";
  const relativePath = extractRelativePath(location.pathname);
  const hub = getHubForPath(relativePath, clinicType);
  if (!hub) return null;

  const tabs = visibleHubTabs(hub, orgRole, clinicType, isBranch);
  // A single-screen domain needs no tab bar.
  if (tabs.length < 2) return null;

  return (
    <nav
      aria-label={`${hub.title} sections`}
      className="shrink-0 border-b border-border bg-background/60 backdrop-blur-sm"
    >
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-4 lg:px-8">
        {tabs.map((tab) => {
          const active = relativePath === tab.path || relativePath.startsWith(`${tab.path}/`);
          return (
            <Link
              key={tab.path}
              to={`${basePath}/${tab.path}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-sm transition-colors border-b-2 -mb-px",
                active
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
