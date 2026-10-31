import { Eye, ArrowLeft } from "lucide-react";
import { getStaffRoles, getRoleLabel } from "@/config/roleAccess";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CLINIC_ROLES = [
  { value: "manager", label: "Manager" },
  { value: "dentist", label: "Dentist" },
  { value: "receptionist", label: "Receptionist" },
  { value: "assistant", label: "Assistant" },
  { value: "hygienist", label: "Hygienist" },
  { value: "nurse", label: "Nurse" },
  { value: "accountant", label: "Accountant" },
  { value: "lab_technician", label: "Lab Technician" },
];

export function ViewAsBanner() {
  const { realRole, viewAsRole, setViewAsRole, currentOrg } = useOrg();
  if (realRole !== "owner" && realRole !== "admin") return null;
  const clinicType = currentOrg?.clinic_type as string | undefined;
  const ROLES = clinicType === "dental_lab"
    ? ["manager", ...getStaffRoles(clinicType)].map((v) => ({ value: v, label: v === "manager" ? "Manager" : getRoleLabel(v, clinicType) }))
    : CLINIC_ROLES;

  const label = ROLES.find((r) => r.value === viewAsRole)?.label ?? viewAsRole;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 border-b px-4 py-1.5 text-xs ${
        viewAsRole ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"
      }`}
    >
      <Eye className="h-3.5 w-3.5" />
      {viewAsRole ? (
        <>
          <span className="font-medium">Viewing as {label}</span>
          <Button size="sm" variant="secondary" className="ml-auto h-7 gap-1" onClick={() => setViewAsRole(null)}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to my dashboard
          </Button>
        </>
      ) : (
        <>
          <span>View dashboard as</span>
          <Select onValueChange={(v) => setViewAsRole(v)}>
            <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue placeholder="Choose a role" /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}
