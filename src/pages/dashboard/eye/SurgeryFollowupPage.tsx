import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useSurgeryBookings, useSaveSurgeryBooking, PREOP_CHECKLIST, patientName } from "@/hooks/eye/useEye";
import { POSTOP_CHECKLIST } from "@/hooks/eye/useEyeOps";
import { Scissors } from "lucide-react";

const asList = (v: any): string[] => (Array.isArray(v) ? v : []);

export default function SurgeryFollowupPage() {
  const { data: surgeries = [], isLoading } = useSurgeryBookings();
  const save = useSaveSurgeryBooking();
  const [tab, setTab] = useState<"pre" | "post">("pre");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pre = surgeries.filter((s) => ["booked", "confirmed", "postponed"].includes(s.status));
  const post = surgeries.filter((s) => s.status === "completed");
  const list = tab === "pre" ? pre : post;
  const items = tab === "pre" ? PREOP_CHECKLIST : POSTOP_CHECKLIST;
  const field = tab === "pre" ? "preop_checklist" : "postop_checklist";

  const toggle = (s: any, item: string) => {
    const cur = asList(s[field]);
    const next = cur.includes(item) ? cur.filter((i) => i !== item) : [...cur, item];
    const patch: any = { id: s.id, [field]: next };
    if (tab === "pre" && item === "Consent signed") patch.consent_signed = next.includes(item);
    save.mutate(patch);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Surgery Checklists" description="Before-surgery readiness and after-surgery follow-up for every patient" />
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pre">Before surgery ({pre.length})</TabsTrigger>
          <TabsTrigger value="post">After surgery ({post.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && list.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {tab === "pre" ? "No upcoming surgeries. Book one under Surgery Bookings." : "No completed surgeries to follow up yet."}
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((s: any) => {
          const done = asList(s[field]);
          const pct = Math.round((done.filter((d) => items.includes(d)).length / items.length) * 100);
          return (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5"><Scissors className="h-3.5 w-3.5" /> {patientName(s)}</span>
                  <Badge variant={pct === 100 ? "default" : "outline"}>{pct}%</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {s.procedure_name} · {s.eye} eye{s.scheduled_date ? ` · ${new Date(s.scheduled_date).toLocaleDateString()}` : ""}
                </p>
                <Progress value={pct} className="h-1.5" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {items.map((item) => (
                    <label key={item} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={done.includes(item)} onCheckedChange={() => toggle(s, item)} /> {item}
                    </label>
                  ))}
                </div>
                {tab === "post" && (
                  <div className="space-y-1">
                    <Textarea placeholder="Follow-up notes (vision, pressure, complications)…"
                      value={notes[s.id] ?? s.postop_notes ?? ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} />
                    <Button size="sm" variant="outline" onClick={() => save.mutate({ id: s.id, postop_notes: notes[s.id] ?? s.postop_notes })}>Save notes</Button>
                  </div>
                )}
                {tab === "pre" && pct === 100 && s.status !== "confirmed" && (
                  <Button size="sm" onClick={() => save.mutate({ id: s.id, status: "confirmed" })}>Mark ready — confirm surgery</Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
