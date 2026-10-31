import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddPatientDialog } from "@/components/dashboard/AddPatientDialog";
import { WalkInDialog } from "@/components/dashboard/WalkInDialog";
import { usePatientSearch } from "@/hooks/eye/useEyeOps";
import { useOrg } from "@/hooks/useOrg";
import { hasPageAccess } from "@/config/roleAccess";
import { Search, Plus, UserPlus, CalendarPlus, Activity, CreditCard, Stethoscope, UserCheck, Footprints } from "lucide-react";

/** Header search (name or phone number) and quick-add menu, shown on every page. */
export function QuickSearchAdd() {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const { data: results = [], isFetching } = usePatientSearch(term);
  const { basePath, currentOrg } = useOrg();
  const navigate = useNavigate();
  const type = currentOrg?.clinic_type;
  const role = currentOrg?.role || "receptionist";
  const can = (p: string) => hasPageAccess(role, p, type);
  const eye = type === "eye";

  const go = (path: string) => { setOpen(false); setTerm(""); navigate(`${basePath}/${path}`); };

  return (
    <>
      <Popover open={open && term.trim().length >= 2} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search name or phone…"
              inputMode="search"
              className="pl-8 h-9 text-sm bg-muted/45 border-border focus-visible:bg-card rounded-sm"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
          {isFetching && results.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Searching…</p>}
          {!isFetching && results.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No patient found.</p>}
          {results.map((p) => (
            <button key={p.id} type="button" onClick={() => go(`patients/${p.id}`)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted">
              <span>{p.first_name} {p.last_name}</span>
              <span className="text-xs text-muted-foreground">{p.phone || ""}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="h-9 w-9 rounded-sm" aria-label="Quick add" title="Quick add"><Plus className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {can("patients") && <DropdownMenuItem onClick={() => setAddOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> New patient</DropdownMenuItem>}
          {eye && can("eye/flow") && <DropdownMenuItem onClick={() => go("eye/flow")}><Activity className="mr-2 h-4 w-4" /> Check in patient</DropdownMenuItem>}
          {eye && can("eye/visit") && <DropdownMenuItem onClick={() => go("eye/visit")}><Stethoscope className="mr-2 h-4 w-4" /> Start doctor visit</DropdownMenuItem>}
          {!eye && can("waiting-list") && <DropdownMenuItem onClick={() => go("waiting-list")}><UserCheck className="mr-2 h-4 w-4" /> Check in patient</DropdownMenuItem>}
          {!eye && can("appointments") && <DropdownMenuItem onClick={() => setWalkInOpen(true)}><Footprints className="mr-2 h-4 w-4" /> Walk-in</DropdownMenuItem>}
          {can("appointments") && <DropdownMenuItem onClick={() => go("appointments")}><CalendarPlus className="mr-2 h-4 w-4" /> Book appointment</DropdownMenuItem>}
          {can("billing") && <DropdownMenuItem onClick={() => go("billing")}><CreditCard className="mr-2 h-4 w-4" /> New bill</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>

      <AddPatientDialog open={addOpen} onOpenChange={setAddOpen} />
      <WalkInDialog open={walkInOpen} onOpenChange={setWalkInOpen} />
    </>
  );
}
