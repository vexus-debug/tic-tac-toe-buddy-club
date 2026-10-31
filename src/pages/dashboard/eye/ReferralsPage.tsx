import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import { useOrg } from "@/hooks/useOrg";
import {
  useReferrals, useSaveReferral, useDeleteReferral, REFERRAL_SPECIALTIES, REFERRAL_STATUSES, todayISO, type EyeReferral,
} from "@/hooks/eye/useEyeOps";
import { ArrowDownLeft, ArrowUpRight, Plus, Printer, Trash2 } from "lucide-react";

const label = (s: string) => s.replace(/_/g, " ");
const esc = (v: any) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function printLetter(r: EyeReferral, clinic: string) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Referral letter</title><style>body{font-family:Georgia,serif;margin:40px;max-width:700px;line-height:1.5}h1{font-size:20px}</style></head><body>
<h1>${esc(clinic)}</h1><p>${esc(new Date(r.referral_date).toLocaleDateString())}</p>
<p>To: ${esc(r.practitioner || "The " + (r.specialty || "Specialist"))}${r.facility ? `, ${esc(r.facility)}` : ""}</p>
<p><strong>Re: ${esc(r.patients?.first_name)} ${esc(r.patients?.last_name)}</strong>${r.patients?.phone ? ` (tel ${esc(r.patients.phone)})` : ""}</p>
<p>Urgency: <strong>${esc(r.urgency)}</strong></p><p>Thank you for seeing this patient. Reason for referral:</p><p>${esc(r.reason || "")}</p>
<p style="margin-top:60px">Yours sincerely,<br/><br/>______________________</p><script>setTimeout(()=>print(),300)</script></body></html>`);
  w.document.close();
}

export default function ReferralsPage() {
  const { currentOrg } = useOrg();
  const { data: refs = [], isLoading } = useReferrals();
  const save = useSaveReferral();
  const remove = useDeleteReferral();
  const [tab, setTab] = useState<"out" | "in">("out");
  const [form, setForm] = useState<Partial<EyeReferral> | null>(null);
  const set = (k: keyof EyeReferral, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const list = refs.filter((r) => r.direction === tab);
  const open = list.filter((r) => r.status !== "closed");

  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" description="Patients you send to specialists, and patients sent to you">
        <Button size="sm" onClick={() => setForm({ direction: tab, urgency: "routine", status: tab === "out" ? "sent" : "received", referral_date: todayISO() })}>
          <Plus className="mr-2 h-4 w-4" /> New referral
        </Button>
      </PageHeader>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="out"><ArrowUpRight className="mr-1 h-4 w-4" /> Sent out ({refs.filter((r) => r.direction === "out" && r.status !== "closed").length})</TabsTrigger>
          <TabsTrigger value="in"><ArrowDownLeft className="mr-1 h-4 w-4" /> Received ({refs.filter((r) => r.direction === "in" && r.status !== "closed").length})</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card><CardContent className="space-y-2 p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No referrals yet.</p>}
        <p className="text-xs text-muted-foreground">{open.length} open</p>
        {list.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2">
            <button className="min-w-0 flex-1 text-left" onClick={() => setForm(r)}>
              <p className="text-sm font-medium">{r.patients?.first_name} {r.patients?.last_name}
                <span className="ml-2 text-xs text-muted-foreground">{tab === "out" ? "→" : "←"} {r.specialty}{r.practitioner ? ` · ${r.practitioner}` : ""}{r.facility ? ` · ${r.facility}` : ""}</span></p>
              <p className="truncate text-xs text-muted-foreground">{r.reason}</p>
            </button>
            <div className="flex items-center gap-1">
              {r.urgency !== "routine" && <Badge variant="destructive" className="capitalize">{r.urgency}</Badge>}
              <Badge variant="outline" className="capitalize">{label(r.status)}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(r.referral_date).toLocaleDateString()}</span>
              {r.direction === "out" && <Button size="icon" variant="ghost" aria-label="Print letter" onClick={() => printLetter(r, currentOrg?.org_name || "Eye Clinic")}><Printer className="h-4 w-4" /></Button>}
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent></Card>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Edit referral" : form?.direction === "in" ? "Referral received" : "Refer a patient"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!form?.id && <PatientPicker value={form?.patient_id} onChange={(id) => set("patient_id", id)} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Specialty</Label>
                <Select value={form?.specialty || ""} onValueChange={(v) => set("specialty", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent>{REFERRAL_SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Urgency</Label>
                <Select value={form?.urgency || "routine"} onValueChange={(v) => set("urgency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["routine", "soon", "urgent", "emergency"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>{form?.direction === "in" ? "Referred by" : "Doctor"}</Label><Input value={form?.practitioner || ""} onChange={(e) => set("practitioner", e.target.value)} /></div>
              <div><Label>Hospital / clinic</Label><Input value={form?.facility || ""} onChange={(e) => set("facility", e.target.value)} /></div>
              <div><Label>Their phone / email</Label><Input value={form?.contact || ""} onChange={(e) => set("contact", e.target.value)} /></div>
              <div><Label>Date</Label><Input type="date" value={form?.referral_date || ""} onChange={(e) => set("referral_date", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label>Status</Label>
                <Select value={form?.status || "sent"} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REFERRAL_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{label(s)}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div><Label>Reason / findings</Label><Textarea value={form?.reason || ""} onChange={(e) => set("reason", e.target.value)} /></div>
            <div><Label>Specialist feedback</Label><Textarea value={form?.feedback || ""} onChange={(e) => set("feedback", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button disabled={!form?.patient_id || save.isPending} onClick={async () => { await save.mutateAsync(form); setForm(null); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
