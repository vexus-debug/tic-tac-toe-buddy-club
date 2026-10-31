import { useNavigate } from "react-router-dom";
import { Building2, Check, ChevronsUpDown, GitBranch } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FamilyOrg = { org_id: string; org_name: string; org_slug: string; parent_org_id: string | null };

/** Lets users jump between the main clinic and its branches they belong to. */
export function BranchSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { orgMemberships } = useAuth();
  const { currentOrg, mainOrgId } = useOrg();
  const navigate = useNavigate();

  const memberFamily: FamilyOrg[] = orgMemberships
    .filter((m) => m.org_id === mainOrgId || m.parent_org_id === mainOrgId)
    .map((m) => ({ org_id: m.org_id, org_name: m.org_name, org_slug: m.org_slug, parent_org_id: m.parent_org_id }));

  // Fallback: memberships can be incomplete (e.g. branch created before owners
  // were auto-added), so fetch the whole clinic family directly.
  const { data: fetchedFamily } = useQuery({
    queryKey: ["org-family", mainOrgId],
    enabled: !!mainOrgId && memberFamily.length < 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, parent_org_id")
        .or(`id.eq.${mainOrgId},parent_org_id.eq.${mainOrgId}`);
      if (error) throw error;
      return (data || []).map((o: any) => ({
        org_id: o.id as string,
        org_name: o.name as string,
        org_slug: o.slug as string,
        parent_org_id: (o.parent_org_id as string | null) ?? null,
      })) as FamilyOrg[];
    },
  });

  if (!currentOrg || !mainOrgId) return null;
  if (currentOrg.role === "manager") return null;

  const family = memberFamily.length >= 2 ? memberFamily : (fetchedFamily || []);
  if (family.length < 2) return null;

  const main = family.find((m) => m.org_id === mainOrgId);
  const branches = family.filter((m) => m.parent_org_id === mainOrgId);
  const isMain = currentOrg.org_id === mainOrgId;

  const go = (slug: string) => {
    if (slug !== currentOrg.org_slug) navigate(`/clinic/${slug}/dashboard`);
  };

  return (
    <div className="px-2 pt-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2 text-left text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Switch branch"
          >
            {isMain ? <Building2 className="h-4 w-4 shrink-0" /> : <GitBranch className="h-4 w-4 shrink-0" />}
            {!collapsed && (
              <>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
                    {isMain ? "Main clinic" : "Branch"}
                  </span>
                  <span className="truncate text-xs font-semibold">{currentOrg.org_name}</span>
                </span>
                <ChevronsUpDown className="ml-auto h-3.5 w-3.5 opacity-60" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          {main && (
            <>
              <DropdownMenuLabel className="text-xs">Main clinic</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => go(main.org_slug)}>
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate">{main.org_name}</span>
                {main.org_id === currentOrg.org_id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="text-xs">Branches</DropdownMenuLabel>
          {branches.map((b) => (
            <DropdownMenuItem key={b.org_id} onClick={() => go(b.org_slug)}>
              <GitBranch className="mr-2 h-4 w-4" />
              <span className="truncate">{b.org_name}</span>
              {b.org_id === currentOrg.org_id && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
