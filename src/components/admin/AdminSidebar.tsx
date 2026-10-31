import { useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, Users, BarChart3, LogOut, Shield, ScrollText, CreditCard, DollarSign, Megaphone, Ticket, Flag, Settings, Download, GitBranch, HardDrive, Bell, Activity, Palette, Radio, PenLine, Globe, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import clinexusLogoWhiteAsset from "@/assets/site/clinexus-logo-white.png";

const clinexusLogoWhite = clinexusLogoWhiteAsset;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const adminNav = [
  { title: "Overview", path: "/admin", icon: LayoutDashboard, group: "Core" },
  { title: "Clinics", path: "/admin/clinics", icon: Building2, group: "Core" },
  { title: "Users", path: "/admin/users", icon: Users, group: "Core" },
  { title: "Subscriptions", path: "/admin/subscriptions", icon: CreditCard, group: "Billing" },
  { title: "Revenue", path: "/admin/revenue", icon: DollarSign, group: "Billing" },
  { title: "Analytics", path: "/admin/analytics", icon: BarChart3, group: "Insights" },
  { title: "Website Visitors", path: "/admin/visitors", icon: Globe, group: "Insights" },
  { title: "Onboarding", path: "/admin/onboarding", icon: GitBranch, group: "Insights" },
  { title: "Announcements", path: "/admin/announcements", icon: Megaphone, group: "Comms" },
  { title: "Support", path: "/admin/support", icon: Ticket, group: "Comms" },
  { title: "Email Outreach", path: "/admin/outreach", icon: Mail, group: "Comms" },
  { title: "Push Notifications", path: "/admin/push", icon: Megaphone, group: "Comms" },
  { title: "Notifications", path: "/admin/notification-logs", icon: Bell, group: "Comms" },
  { title: "Blog Studio", path: "/admin/articles", icon: PenLine, group: "Content" },
  { title: "Feature Flags", path: "/admin/feature-flags", icon: Flag, group: "System" },
  { title: "Settings", path: "/admin/settings", icon: Settings, group: "System" },
  { title: "Audit Log", path: "/admin/audit-log", icon: ScrollText, group: "System" },
  { title: "Live Sessions", path: "/admin/sessions", icon: Radio, group: "System" },
  { title: "Health", path: "/admin/health", icon: Activity, group: "System" },
  { title: "Storage", path: "/admin/storage", icon: HardDrive, group: "System" },
  { title: "Data Export", path: "/admin/data-export", icon: Download, group: "System" },
  { title: "White-label", path: "/admin/white-label", icon: Palette, group: "System" },
];

export function AdminSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname, isMobile, setOpenMobile]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="relative shrink-0">
          <img src={clinexusLogoWhite} alt="Clinexus" className="h-8 w-auto object-contain" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-sidebar-primary-foreground truncate tracking-tight">
              Clinexus
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 font-medium flex items-center gap-1">
              <Shield className="h-2.5 w-2.5" /> Super Admin
            </span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-2 px-2 overflow-y-auto">
        {Object.entries(
          adminNav.reduce((acc, item) => {
            if (!acc[item.group]) acc[item.group] = [];
            acc[item.group].push(item);
            return acc;
          }, {} as Record<string, typeof adminNav>)
        ).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-semibold px-2 mb-0.5">
              {group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink
                          to={item.path}
                          className="relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all duration-200 hover:bg-sidebar-accent group"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          {active && (
                            <motion.div
                              layoutId="admin-sidebar-active-pill"
                              className="absolute inset-0 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <item.icon className={`h-4 w-4 shrink-0 relative z-10 ${active ? "text-sidebar-primary" : "text-sidebar-foreground/70"}`} />
                          <span className="relative z-10 text-xs">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-2 ring-sidebar-primary/20 shrink-0">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-gradient-to-br from-sidebar-primary/30 to-sidebar-primary/10 text-sidebar-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-sm font-medium truncate text-sidebar-primary-foreground">{displayName}</span>
                <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 mt-0.5 border-red-500/30 text-red-400">
                  Super Admin
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate("/select-clinic")}
                  className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-primary/10"
                  title="Go to clinics"
                >
                  <Building2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
