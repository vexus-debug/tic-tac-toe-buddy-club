import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrg } from "@/hooks/useOrg";
import { clientOf, patientOf, isRush } from "@/hooks/useDentalLab";
import { splitLegacyTeeth } from "@/lib/labWorkflow";
import { printTraveler } from "@/lib/printTraveler";
import { toast } from "@/hooks/use-toast";

export function PrintTravelerButton({ c, technician, compact }: { c: any; technician?: string | null; compact?: boolean }) {
  const { currentOrg } = useOrg();
  const go = (size: "a5" | "a4" | "slip") => {
    let teeth: string[] = c.teeth?.length ? c.teeth : [];
    if (!teeth.length) { try { teeth = (splitLegacyTeeth as any)(c.instructions || "").teeth || []; } catch { /* keep empty */ } }
    const ok = printTraveler({
      labName: currentOrg?.org_name || "Dental Lab", case_number: c.case_number, clinic: clientOf(c), doctor: c.clinic_doctor_name,
      patient: patientOf(c), work_type: c.work_type, material: c.material, shade: c.shade, teeth, due_date: c.due_date,
      rush: isRush(c), technician, instructions: c.instructions,
    }, size);
    if (!ok) toast({ title: "Pop-up blocked", description: "Allow pop-ups to print the traveler.", variant: "destructive" });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact
          ? <Button size="icon" variant="outline" className="h-11 w-11" aria-label="Print job traveler"><Printer className="h-4 w-4" /></Button>
          : <Button size="sm" variant="outline"><Printer className="mr-1 h-3.5 w-3.5" />Print traveler</Button>}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => go("a5")}>A5 sheet</DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("a4")}>A4 sheet</DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("slip")}>80mm thermal slip</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
