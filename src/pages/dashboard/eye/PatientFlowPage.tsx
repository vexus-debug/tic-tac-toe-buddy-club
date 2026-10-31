import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import { useOrg } from "@/hooks/useOrg";
import { useTodayFlow, useCheckInPatient, useMoveFlow, FLOW_STAGES, type FlowEntry } from "@/hooks/eye/useEyeOps";
import { ArrowLeft, ArrowRight, Check, UserPlus, Stethoscope } from "lucide-react";

const since = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

export default function PatientFlowPage() {
  const { basePath } = useOrg();
  const { data: flow = [], isLoading } = useTodayFlow();
  const checkIn = useCheckInPatient();
  const move = useMoveFlow();
  const [open, setOpen] = useState(false);
  const [pid, setPid] = useState("");
  const [note, setNote] = useState("");

  const active = flow.filter((f) => f.status !== "completed" && f.status !== "cancelled" && f.status !== "no_show");
  const done = flow.filter((f) => f.status === "completed");

  const stageOf = (f: FlowEntry) => (FLOW_STAGES.some((s) => s.key === f.stage) ? f.stage : "check_in");
  const idx = (k: string) => FLOW_STAGES.findIndex((s) => s.key === k);

  return (
    <div className="space-y-6">
      <PageHeader title="Patient Progress" description="Where every patient is today: Check-in → Pre-test → Doctor → Optical → Pay">
        <Button size="sm" onClick={() => { setPid(""); setNote(""); setOpen(true); }}><UserPlus className="mr-2 h-4 w-4" /> Check in patient</Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="outline">In clinic now: {active.length}</Badge>
        <Badge variant="outline">Finished today: {done.length}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {FLOW_STAGES.map((stage, i) => {
          const items = active.filter((f) => stageOf(f) === stage.key);
          return (
            <Card key={stage.key} className="min-h-[220px] bg-muted/20">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{i + 1}. {stage.label}</span><Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
                {items.map((f) => {
                  const k = idx(stageOf(f));
                  const next = FLOW_STAGES[k + 1];
                  const prev = FLOW_STAGES[k - 1];
                  return (
                    <div key={f.id} className="space-y-2 rounded-md border border-border/50 bg-card p-2">
                      <Link to={`${basePath}/patients/${f.patient_id}`} className="block text-sm font-medium hover:underline">
                        {f.patients ? `${f.patients.first_name} ${f.patients.last_name}` : "Patient"}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">Arrived {since(f.check_in_time)} ago{f.notes ? ` · ${f.notes}` : ""}</p>
                      <div className="flex gap-1">
                        {prev && <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Back a step" onClick={() => move.mutate({ id: f.id, stage: prev.key })}><ArrowLeft className="h-3 w-3" /></Button>}
                        {next ? (
                          <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => move.mutate({ id: f.id, stage: next.key })}>
                            {next.label} <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        ) : (
                          <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => move.mutate({ id: f.id, done: true })}>
                            <Check className="mr-1 h-3 w-3" /> Paid & done
                          </Button>
                        )}
                      </div>
                      {stage.key === "doctor" && (
                        <Button asChild size="sm" variant="secondary" className="h-7 w-full text-xs">
                          <Link to={`${basePath}/eye/visit?patient=${f.patient_id}`}><Stethoscope className="mr-1 h-3 w-3" /> Open visit</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
                {!isLoading && items.length === 0 && <p className="text-xs text-muted-foreground">Nobody here</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {done.length > 0 && (
        <Card><CardHeader><CardTitle className="text-sm">Finished today</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {done.map((f) => <Badge key={f.id} variant="outline">{f.patients?.first_name} {f.patients?.last_name}</Badge>)}
          </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Check in a patient</DialogTitle></DialogHeader>
          <PatientPicker value={pid} onChange={setPid} />
          <Input placeholder="Reason for visit (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button disabled={!pid || checkIn.isPending} onClick={async () => { await checkIn.mutateAsync({ patient_id: pid, notes: note }); setOpen(false); }}>Check in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
