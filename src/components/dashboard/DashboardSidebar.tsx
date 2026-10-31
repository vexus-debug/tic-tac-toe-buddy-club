import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { LogOut, Building2, Shield, GitBranch, ChevronDown, LayoutDashboard } from "lucide-react";
import { BranchSwitcher } from "@/components/dashboard/BranchSwitcher";
import { useLocation, useNavigate } from "react-router-dom";
import clinexusLogoRect from "@/assets/site/clinexus-logo-white.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { hasPageAccess, getRoleLabel, extractRelativePath } from "@/config/roleAccess";
import { getClinicConfig, sharedNavItems } from "@/config/clinicTypeConfig";
import { visibleHubs, hubIsActive } from "@/config/navDomains";
import { useUnreadCount, useRealtimeNotifications } from "@/hooks/useNotifications";
import { useUnreadMessageCount, useRealtimeMessages } from "@/hooks/useMessages";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePrefetchPage } from "@/lib/prefetchRoutes";
import { useActiveVisit, VISIT_PAGES } from "@/hooks/useActiveVisit";

export function DashboardSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut, orgMemberships, roles } = useAuth();
  const { currentOrg, basePath, isBranch } = useOrg();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: unreadMsgCount = 0 } = useUnreadMessageCount();
  const prefetchPage = usePrefetchPage();
  const activeVisit = useActiveVisit();
  useRealtimeNotifications();
  useRealtimeMessages();

  const orgRole = currentOrg?.role || "receptionist";
  const clinicType = currentOrg?.clinic_type || "dental";
  const config = getClinicConfig(clinicType);
  // Dental: 8 hub domains instead of 30+ individual links; other screens of
  // each hub are reached through the tab bar under the header (HubTabs).
  const useHubs = clinicType === "dental" || clinicType === "dental_lab";
  const hubs = useHubs ? visibleHubs(orgRole, clinicType, isBranch) : [];
  const relativePath = extractRelativePath(location.pathname);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname, isMobile, setOpenMobile]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Staff";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const NavItem = ({ item, fullUrl, active: activeOverride }: { item: any; fullUrl: string; active?: boolean }) => {
    const active = activeOverride ?? location.pathname === fullUrl;
    const badge =
      item.path === "messages" && unreadMsgCount > 0 ? unreadMsgCount :
      item.path === "notifications" && unreadCount > 0 ? unreadCount : 0;

    const content = (
      <NavLink
        to={activeVisit && VISIT_PAGES.includes(String(item.path)) ? `${fullUrl}?patientId=${activeVisit.patientId}` : fullUrl}
        onMouseEnter={() => prefetchPage(String(item.path))}
        onFocus={() => prefetchPage(String(item.path))}
        onTouchStart={() => prefetchPage(String(item.path))}
        className={cn(
          "relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-all duration-200 group w-full",
          active
            ? "bg-sidebar-primary/12 text-sidebar-primary font-medium border-l-2 border-sidebar-primary pl-[calc(0.75rem-2px)]"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border-l-2 border-transparent pl-[calc(0.75rem-2px)]"
        )}
        activeClassName=""
      >
        {active && (
          <motion.div
            layoutId="sidebar-active-bg"
            className="absolute inset-0 rounded-sm bg-sidebar-primary/10"
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          />
        )}
        <item.icon className={cn(
          "h-4 w-4 shrink-0 relative z-10 transition-all duration-200",
          active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80 group-hover:scale-110"
        )} />
        {!collapsed && (
          <span className="relative z-10 truncate">{item.title}</span>
        )}
        {!collapsed && badge > 0 && (
          <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground px-1 animate-pulse">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {collapsed && badge > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white z-20">
            {badge}
          </span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                {content}
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-medium">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        {content}
      </SidebarMenuButton>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="dashboard-sidebar border-r border-sidebar-border transition-all duration-300"
    >
      {/* ── Logo / Clinic Name ── */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="relative shrink-0">
          <img
            src={clinexusLogoRect}
            alt="Clinexus"
            className="h-7 w-auto object-contain"
          />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="text-[13px] font-bold text-sidebar-foreground truncate leading-tight">
                {currentOrg?.org_name || "Clinexus"}
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium capitalize tracking-wide">
                {config.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SidebarContent className="pt-3 px-2 overflow-y-auto scrollbar-none">
        <BranchSwitcher collapsed={collapsed} />
        {!isBranch && (orgRole === "owner" || orgRole === "admin") && (
          <SidebarGroup className="mb-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavItem item={{ title: "Branches", path: "branches", icon: GitBranch }} fullUrl={`${basePath}/branches`} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {useHubs && (
          <SidebarGroup className="mb-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <NavItem item={{ title: "Dashboard", path: "dashboard", icon: LayoutDashboard }} fullUrl={`${basePath}/dashboard`} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {useHubs
          ? hubs.map(({ hub, tabs }) => {
              const active = hubIsActive(hub, relativePath);
              const primaryTab = tabs.find((t) => t.path === hub.primaryPath) || tabs[0];
              return (
                <SidebarGroup key={hub.key} className="mb-0.5">
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <NavItem
                          item={{ title: hub.title, path: primaryTab.path, icon: hub.icon }}
                          fullUrl={`${basePath}/${primaryTab.path}`}
                          active={active}
                        />
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })
          : config.navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            hasPageAccess(orgRole, item.path, clinicType) &&
            !(isBranch && (item.path === "website-settings" || item.path === "shop-management"))
          );
          if (visibleItems.length === 0) return null;

          const hasActive = visibleItems.some((i) => location.pathname === `${basePath}/${i.path}`);
          const isOpen = collapsed || (openGroups[group.label] ?? hasActive);
          return (
            <SidebarGroup key={group.label} className="mb-1">
              {!collapsed && (
                <SidebarGroupLabel asChild className="text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/50 font-semibold px-2 mb-1">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !isOpen }))}
                    className="flex w-full items-center gap-2 hover:text-sidebar-foreground/80"
                  >
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform", !isOpen && "-rotate-90")} />
                  </button>
                </SidebarGroupLabel>
              )}
              {isOpen && (
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <NavItem item={item} fullUrl={`${basePath}/${item.path}`} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}

        {/* Shared nav items */}
        <SidebarGroup className="mt-1">
          {!collapsed && (
            <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/35 font-semibold px-2 mb-1 flex items-center gap-2">
               <span className="h-px flex-1 bg-sidebar-border" />
              General
               <span className="h-px flex-1 bg-sidebar-border" />
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {sharedNavItems.filter((item) =>
                hasPageAccess(orgRole, item.path, clinicType) &&
                !(clinicType === "dental" && item.path === "settings")
              ).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavItem item={item} fullUrl={`${basePath}/${item.path}`} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User Footer ── */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <button
            onClick={() => navigate(`${basePath}/profile`)}
            className="shrink-0 group"
            title="My Profile"
          >
            <Avatar className="h-8 w-8 ring-2 ring-white/15 transition-all duration-200 group-hover:ring-sidebar-primary/50">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center flex-1 min-w-0 gap-2"
              >
                <button
                  onClick={() => navigate(`${basePath}/profile`)}
                  className="flex flex-col overflow-hidden flex-1 text-left hover:opacity-80 transition-opacity"
                >
                   <span className="text-[13px] font-semibold truncate text-sidebar-foreground leading-tight">{displayName}</span>
                  <span className="text-[10px] text-sidebar-primary font-medium capitalize mt-0.5">
                    {getRoleLabel(orgRole, clinicType)}
                  </span>
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                  {roles.includes("super_admin") && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="text-destructive/60 hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                      title="Admin Panel"
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {orgMemberships.length > 1 && (
                    <button
                      onClick={() => navigate("/select-clinic")}
                      className="text-sidebar-foreground/40 hover:text-sidebar-primary transition-colors p-1.5 rounded-md hover:bg-sidebar-primary/10"
                      title="Switch clinic"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-sidebar-foreground/40 hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                    title="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
