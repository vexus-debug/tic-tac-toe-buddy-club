import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, History, CalendarCheck, Info, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/button";

interface Briefing {
  alerts: string[];
  last_visit: string;
  today: string;
  nuances: string[];
}

const PROMPT = (id: string) => `Prepare a pre-chair briefing for patient id ${id}. Use get_patient_history, get_dental_chart, get_clinical_notes and get_treatment_plans for this patient (read-only). Never invent facts.
Reply with ONLY strict JSON, no other text:
{"alerts": string[], "last_visit": string, "today": string, "nuances": string[]}
alerts = allergies, medical conditions, medications, risks. last_visit = one sentence on what was done last time ("No previous visits" if none). today = one sentence on the plan / next step. nuances = anxiety, pain tolerance, unfinished or unpaid treatment, other notes.`;

/** AI pre-chair snapshot: alerts, last visit, today's plan, patient nuances. */
export function PatientBriefing({ patientId, compact }: { patientId: string; compact?: boolean }) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["patient-briefing", orgId, patientId],
    enabled: !!orgId,
    staleTime: 15 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-copilot", {
        body: { messages: [{ role: "user", content: PROMPT(patientId) }], orgId, context: { page: "patient-briefing" } },
      });
      if (error) throw error;
      const m = String(data?.reply ?? "").match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No briefing");
      const b = JSON.parse(m[0]);
      return {
        alerts: Array.isArray(b.alerts) ? b.alerts.map(String) : [],
        last_visit: String(b.last_visit ?? ""),
        today: String(b.today ?? ""),
        nuances: Array.isArray(b.nuances) ? b.nuances.map(String) : [],
      } as Briefing;
    },
  });

  return (
    <div className={`rounded-md border border-primary/30 bg-primary/5 ${compact ? "p-2 text-xs" : "p-3 text-sm"}`}>
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" /> AI pre-chair briefing
        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh briefing">
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {isLoading ? (
        <p className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Reviewing history…</p>
      ) : error ? (
        <p className="text-muted-foreground">Briefing unavailable right now. Tap refresh to retry.</p>
      ) : data ? (
        <div className="space-y-1.5">
          {data.alerts.length > 0 && (
            <div className="flex gap-1.5 text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">{data.alerts.join(" · ")}</span>
            </div>
          )}
          {data.last_visit && (
            <div className="flex gap-1.5 text-foreground"><History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />{data.last_visit}</div>
          )}
          {data.today && (
            <div className="flex gap-1.5 text-foreground"><CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />{data.today}</div>
          )}
          {data.nuances.length > 0 && (
            <div className="flex gap-1.5 text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{data.nuances.join(" · ")}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
