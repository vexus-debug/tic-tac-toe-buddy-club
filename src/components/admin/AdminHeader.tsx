import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ChevronDown, Building2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const breadcrumbLabels: Record<string, string> = {
  "": "Overview",
  "clinics": "Clinics",
  "users": "Users",
  "analytics": "Analytics",
};

export function AdminHeader() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const segment = location.pathname.replace("/admin", "").replace(/^\//, "");
  const currentPage = breadcrumbLabels[segment] || "Overview";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 lg:px-6 shadow-sm">
      <SidebarTrigger className="-ml-1" />

      <div className="hidden md:flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Admin</span>
        {currentPage !== "Overview" && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">{currentPage}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent/50">
              <Avatar className="h-7 w-7 ring-2 ring-border/50">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-secondary/15 text-secondary text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">{displayName}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 backdrop-blur-xl bg-popover/95 border-border/50">
            <DropdownMenuItem onClick={() => navigate("/select-clinic")}>
              <Building2 className="mr-2 h-4 w-4" />Switch to Clinic
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
