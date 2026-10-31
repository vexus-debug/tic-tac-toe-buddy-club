import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, User, Settings, LogOut, ChevronDown, Command, ChevronRight, Search, Stethoscope, Menu, Moon, Sun } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { useUnreadCount } from "@/hooks/useNotifications";
import { extractRelativePath } from "@/config/roleAccess";
import { QuickSearchAdd } from "@/components/dashboard/QuickSearchAdd";
import { CaseWalletBadge } from "@/components/dashboard/CaseWallet";
import { motion } from "framer-motion";

const breadcrumbLabels: Record<string, string> = {
  "dashboard": "Dashboard",
  "patients": "Patients",
  "appointments": "Appointments",
  "dental-charts": "Dental Charts",
  "treatments": "Treatments",
  "prescriptions": "Prescriptions",
  "billing": "Billing",
  "reports": "Reports",
  "lab-work": "Lab Work",
  "staff": "Staff",
  "inventory": "Inventory",
  "notifications": "Notifications",
  "tutorials": "Tutorials",
  "settings": "Settings",
  "profile": "My Profile",
  "lab": "Lab Dashboard",
  "lab/cases": "Lab Cases",
  "lab/technicians": "Technicians",
  "lab/billing": "Lab Billing",
  "lab/settings": "Lab Settings",
  "messages": "Messages",
  "reviews": "Reviews",
  "expenses": "Expenses",
  "audit-log": "Audit Log",
  "consent-forms": "Consent Forms",
  "documents": "Documents",
  "revenue-allocation": "Revenue Allocation",
};

interface DashboardHeaderProps {
  onToggleAI?: () => void;
  aiOpen?: boolean;
  appearance?: "light" | "dark";
  onToggleAppearance?: () => void;
}

export function DashboardHeader({ onToggleAI, aiOpen, appearance = "light", onToggleAppearance }: DashboardHeaderProps = {}) {
  const { profile, user, signOut } = useAuth();
  const { basePath, currentOrg } = useOrg();
  const { toggleSidebar } = useSidebar();
  const { data: unreadCount = 0 } = useUnreadCount();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Staff";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const relativePath = extractRelativePath(location.pathname);
  const currentPage = breadcrumbLabels[relativePath] || "Dashboard";
  const isHome = currentPage === "Dashboard";

  return (
    <header className="relative sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 lg:px-8">

      {/* Desktop: icon-only */}
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hidden md:flex" />

      {/* Mobile: prominent button with "Menu" label */}
      <Button
        variant="outline"
        size="sm"
        className="flex md:hidden h-9 items-center gap-1.5 -ml-1 px-2.5 rounded-sm text-foreground"
        onClick={toggleSidebar}
      >
        <Menu className="h-4 w-4" />
        <span className="text-xs font-semibold">Menu</span>
      </Button>

      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
        <span className="text-muted-foreground/70 font-medium truncate max-w-[120px]">
          {currentOrg?.org_name || "Dashboard"}
        </span>
        {!isHome && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <span className="font-semibold text-foreground truncate">{currentPage}</span>
          </>
        )}
      </nav>

      {/* Search by name / phone + quick add */}
      <QuickSearchAdd />

      <div className="flex items-center gap-1">
        <CaseWalletBadge />
        {onToggleAppearance && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-sm text-muted-foreground hover:text-foreground"
            onClick={onToggleAppearance}
            title={appearance === "dark" ? "Use light appearance" : "Use dark appearance"}
            aria-label={appearance === "dark" ? "Use light appearance" : "Use dark appearance"}
          >
            {appearance === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}
        {/* AI Toggle - hidden on mobile since mobile has bottom bar */}
        {onToggleAI && (
          <Button
            variant={aiOpen ? "default" : "ghost"}
            size="icon"
            className={`hidden md:flex h-9 w-9 rounded-sm transition-all ${aiOpen ? "" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            onClick={onToggleAI}
            title="AI Assistant"
          >
            <Stethoscope className="h-4 w-4" />
          </Button>
        )}

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50" asChild>
          <Link to={`${basePath}/notifications`}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <motion.span
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center px-0.5"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </Link>
        </Button>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9 hover:bg-muted/50 rounded-sm"
            >
              <Avatar className="h-6 w-6 ring-2 ring-border">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium text-foreground">
                {displayName.split(" ")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 shadow-lg border-border/60">
            <DropdownMenuItem onClick={() => navigate(`${basePath}/profile`)} className="cursor-pointer">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${basePath}/settings`)} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
