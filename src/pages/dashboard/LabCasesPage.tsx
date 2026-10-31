import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useLabCases, type LabCaseRow } from "@/hooks/useLabCases";
import { CreateLabCaseDialog } from "@/components/dashboard/CreateLabCaseDialog";
import { LabCaseDetailDialog } from "@/components/dashboard/LabCaseDetailDialog";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { AlertTriangle } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  ready: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  delivered: "bg-muted text-muted-foreground",
};

const statusDots: Record<string, string> = {
  pending: "bg-muted-foreground/50",
  "in-progress": "bg-blue-500",
  ready: "bg-emerald-500",
  delivered: "bg-muted-foreground/50",
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

export default function LabCasesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LabCaseRow | null>(null);
  const { data: cases = [], isLoading } = useLabCases();
  const statuses = ["pending", "in-progress", "ready", "delivered"] as const;
  const { currentOrg } = useOrg();
  const openCases = cases.filter((c) => c.patient_id && !["ready", "delivered"].includes(c.status));
  const patientIds = Array.from(new Set(openCases.map((c) => c.patient_id!)));
  const { data: upcoming = [] } = useQuery({
    queryKey: ["lab-conflict-appts", currentOrg?.org_id, patientIds.join(",")],
    enabled: !!currentOrg?.org_id && patientIds.length > 0,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const until = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
      const { data, error } = await (supabase as any).from("appointments")
        .select("id, patient_id, appointment_date, appointment_time, status")
        .eq("org_id", currentOrg!.org_id).in("patient_id", patientIds).eq("status", "scheduled")
        .gte("appointment_date", today).lte("appointment_date", until).order("appointment_date");
      if (error) throw error;
      return data || [];
    },
  });
  // A delivery visit is at risk when the case isn't ready and is due after (or has no due date before) the visit.
  const conflicts = openCases.flatMap((c) => {
    const appt = (upcoming as any[]).find((a) => a.patient_id === c.patient_id);
    if (!appt) return [];
    const late = !c.due_date || c.due_date.slice(0, 10) >= appt.appointment_date;
    const overdue = !!c.due_date && new Date(c.due_date) < new Date();
    return late || overdue ? [{ c, appt, reason: !c.due_date ? "no lab due date set" : overdue ? "lab case is overdue" : `due ${format(new Date(c.due_date), "MMM d")}, on/after the visit` }] : [];
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lab Cases</h1>
          <p className="text-sm text-muted-foreground">Manage and track all lab cases</p>
        </div>
        <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Lab Case
        </Button>
      </div>

      {conflicts.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Delivery visits at risk ({conflicts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {conflicts.map(({ c, appt, reason }) => (
              <button key={c.id} type="button" onClick={() => setSelectedCase(c)} className="w-full text-left rounded-lg border border-border/40 p-2 text-xs hover:bg-muted/40">
                <span className="font-medium">{c.patients ? `${c.patients.first_name} ${c.patients.last_name}` : "Patient"}</span> · {c.work_type} ({c.case_number}) — appointment {format(new Date(appt.appointment_date), "EEE MMM d")} {appt.appointment_time?.slice(0, 5)}, but {reason}. Confirm with the lab or reschedule.
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading lab cases...</p>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={stagger.container} initial="hidden" animate="visible">
          {statuses.map((status) => {
            const filtered = cases.filter((c) => c.status === status);
            return (
              <motion.div key={status} variants={stagger.item}>
                <Card className="glass-card">
                  <CardHeader className="pb-2 border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm capitalize">{status.replace("-", " ")}</CardTitle>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDots[status]}`} />
                        {filtered.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-3">
                    {filtered.map((c) => (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCase(c)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedCase(c); }}
                        className={`cursor-pointer p-3 rounded-lg border border-border/30 bg-card/50 hover:shadow-md transition-all duration-200 ${(c.is_urgent || c.urgency === "urgent") ? "border-destructive/50" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{c.work_type}</p>
                          {(c.is_urgent || c.urgency === "urgent") && <Badge variant="destructive" className="text-[10px] px-1.5">Urgent</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.client_type === "external"
                            ? c.external_patient_name || c.external_client_name || "Outside client"
                            : c.patients ? `${c.patients.first_name} ${c.patients.last_name}` : "Unknown"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{c.case_number}</p>
                        {c.client_type === "external" ? (
                          <p className="text-[10px] text-muted-foreground">
                            Outside: {c.external_client_name}
                          </p>
                        ) : c.clinic_doctor_name ? (
                          <p className="text-[10px] text-muted-foreground">Clinic: {c.clinic_doctor_name}</p>
                        ) : null}
                        {c.remark && (
                          <Badge variant="outline" className="text-[10px] mt-1">{c.remark}</Badge>
                        )}
                        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-border/20">
                          <span className="text-[10px] text-muted-foreground">
                            ₦{Number(c.lab_fee).toLocaleString()}
                            {Number(c.discount) > 0 && <span className="text-destructive ml-1">-₦{Number(c.discount).toLocaleString()}</span>}
                          </span>
                          {c.due_date && (
                            <span className={`text-[10px] ${
                              new Date(c.due_date) < new Date() && !["delivered", "ready"].includes(c.status)
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            }`}>
                              Due: {format(new Date(c.due_date), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No cases</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <CreateLabCaseDialog open={createOpen} onOpenChange={setCreateOpen} />
      <LabCaseDetailDialog
        labCase={selectedCase}
        open={!!selectedCase}
        onOpenChange={(o) => { if (!o) setSelectedCase(null); }}
      />
    </div>
  );
}
