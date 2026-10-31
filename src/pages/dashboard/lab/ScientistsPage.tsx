import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useTestForms } from "@/hooks/lab/useLab";
import { Users } from "lucide-react";

const LAB_ROLES = ["lab_technician", "lab_assistant", "owner", "admin"];

export default function ScientistsPage() {
  const { data: members = [], isLoading } = useOrgMembers();
  const { data: forms = [] } = useTestForms();

  const rows = useMemo(() => {
    const lab = members.filter((m) => LAB_ROLES.includes(m.role));
    return lab.map((m) => {
      const mine = forms.filter((f) => f.assigned_to === m.user_id);
      return {
        ...m,
        open: mine.filter((f) => f.status === "pending" || f.status === "processing").length,
        done: mine.filter((f) => f.status === "completed" || f.status === "approved").length,
        total: mine.length,
      };
    });
  }, [members, forms]);

  const unassigned = forms.filter((f) => !f.assigned_to && f.status !== "approved").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Scientists" description="Lab staff and their current workload" />

      <Card className="glass-card">
        <CardContent className="p-4 text-sm text-muted-foreground">
          {unassigned} unassigned {unassigned === 1 ? "form" : "forms"} awaiting a scientist.
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20 text-xs uppercase text-muted-foreground">
                <th className="py-2.5 px-4 text-left">Name</th>
                <th className="py-2.5 px-4 text-left">Role</th>
                <th className="py-2.5 px-4 text-left">Open</th>
                <th className="py-2.5 px-4 text-left">Completed</th>
                <th className="py-2.5 px-4 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-6 w-6 opacity-40" /> No lab staff yet. Invite them from Staff.
                </td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="py-2.5 px-4">{r.full_name}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="outline" className="capitalize">{r.role.replace("_", " ")}</Badge>
                  </td>
                  <td className="py-2.5 px-4">{r.open}</td>
                  <td className="py-2.5 px-4">{r.done}</td>
                  <td className="py-2.5 px-4">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
