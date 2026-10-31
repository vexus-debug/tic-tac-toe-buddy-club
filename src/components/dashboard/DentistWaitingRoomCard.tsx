import { useMemo, useState } from "react";
import { PatientBriefing } from "@/components/dashboard/PatientBriefing";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { Armchair, Loader2, Play, Sparkles, Stethoscope, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useStartVisit } from "@/hooks/useVisitFlow";

interface QueueRow {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  status: string;
  check_in_time: string;
  chair: string | null;
  priority: number;
  patients?: { first_name: string; last_name: string } | null;
  appointments?: { staff_id: string | null; chair: string | null; treatments?: { name: string } | null } | null;
}

/**
 * Dentist cockpit: patients reception has checked in, with one-click "Call & Start".
 * Shows the dentist's own patients plus unassigned walk-ins.
 */
export function DentistWaitingRoomCard({ staffId }: { staffId: string | null }) {
  const { currentOrg, basePath } = useOrg();
  const orgId = currentOrg?.org_id;
  const navigate = useNavigate();
  const startVisit = useStartVisit();

  const { data = [], isLoading } = useQuery({
    queryKey: ["waiting-list", orgId, "dentist-cockpit"],
    enabled: !!orgId,
    refetchInterval: 15000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await (supabase as any)
        .from("waiting_list")
        .select("id, patient_id, appointment_id, status, check_in_time, chair, priority, patients(first_name, last_name), appointments(staff_id, chair, treatments(name))")
        .eq("org_id", orgId)
        .in("status", ["waiting", "called", "in_progress"])
        .gte("created_at", `${today}T00:00:00`)
        .order("priority", { ascending: false })
        .order("check_in_time", { ascending: true });
      if (error) throw error;
      return (data || []) as QueueRow[];
    },
  });

  const rows = useMemo(
    () => data.filter((r) => !r.appointments?.staff_id || !staffId || r.appointments.staff_id === staffId),
    [data, staffId],
  );
  const inChair = rows.filter((r) => r.status === "in_progress");
  const waiting = rows.filter((r) => r.status !== "in_progress");

  const start = async (r: QueueRow) => {
    await startVisit.mutateAsync({ patient_id: r.patient_id, appointment_id: r.appointment_id, waiting_id: r.id });
    navigate(`${basePath}/dental-charts?patientId=${r.patient_id}`);
  };
  const resume = (r: QueueRow) => {
    startVisit.mutate({ patient_id: r.patient_id, appointment_id: r.appointment_id, waiting_id: r.id });
    navigate(`${basePath}/dental-charts?patientId=${r.patient_id}`);
  };

  const [openBrief, setOpenBrief] = useState<string | null>(null);

  const Row = ({ r, active }: { r: QueueRow; active?: boolean }) => {
    const name = `${r.patients?.first_name || ""} ${r.patients?.last_name || ""}`.trim() || "Patient";
    const chair = r.chair || r.appointments?.chair;
    return (
      <div className="space-y-2 rounded-md border border-border/60 bg-background/60 p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
            {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {r.appointments?.treatments?.name || (r.appointment_id ? "Appointment" : "Walk-in")} · waiting {formatDistanceToNowStrict(new Date(r.check_in_time))}
          </p>
        </div>
        <Badge variant="outline" className="hidden shrink-0 gap-1 sm:inline-flex">
          <Armchair className="h-3 w-3" />{chair || "No chair"}
        </Badge>
        {active ? (
          <Button size="sm" variant="secondary" onClick={() => resume(r)}>
            <Stethoscope className="h-4 w-4" /> Resume
          </Button>
        ) : (
          <Button size="sm" disabled={startVisit.isPending} onClick={() => start(r)}>
            {startVisit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Call & Start
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="AI briefing" onClick={() => setOpenBrief(openBrief === r.id ? null : r.id)}>
          <Sparkles className="h-4 w-4 text-primary" />
        </Button>
      </div>
      {openBrief === r.id && <PatientBriefing patientId={r.patient_id} compact />}
      </div>
    );
  };

  return (
    <Card className="border-primary/30 bg-card" data-tour="dentist-waiting-room">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" /> Ready in waiting room
          <Badge className="ml-1">{waiting.length}</Badge>
        </CardTitle>
        <CardDescription>Patients checked in by reception. One tap starts the visit and opens the chart.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading queue…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patients are waiting for you right now.</p>
        ) : (
          <>
            {inChair.map((r) => <Row key={r.id} r={r} active />)}
            {waiting.map((r) => <Row key={r.id} r={r} />)}
          </>
        )}
      </CardContent>
    </Card>
  );
}
