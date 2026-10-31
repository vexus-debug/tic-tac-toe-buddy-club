import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";
import { useLabCases, type LabCaseRow } from "@/hooks/useLabCases";
import { clientOf, patientOf } from "@/hooks/useDentalLab";
import { useLabWorkCalendar } from "@/hooks/useLabWorkCalendar";
import { REMAKE_FAULTS, REMAKE_REASONS, hasOpenRemake, nextRemakeNumber, remakeDueDate, remakeFee, type RemakeFault } from "@/lib/labRemake";
import { REMAKE_SPAWNED } from "@/config/dentalLab";

const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

/** Clones a case into an urgent child remake (-R1, -R2…) and logs the warranty claim. */
export function RemakeDialog({ c, onClose, onCreated }: { c: LabCaseRow; onClose: () => void; onCreated?: (id: string) => void }) {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const { data: cases = [] } = useLabCases();
  const [fault, setFault] = useState<RemakeFault>("lab");
  const [reason, setReason] = useState("Fit");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const { cal } = useLabWorkCalendar();
  const open = hasOpenRemake(c.id, cases as any);
  const number = nextRemakeNumber(c.case_number || "", cases.map((x) => x.case_number || ""));
  const fee = remakeFee(fault, Number(c.lab_fee || 0));

  const submit = async () => {
    setBusy(true);
    try {
      const sb = supabase as any;
      // Re-check on the server side of the list to avoid double clicks spawning two remakes.
      const { data: dup } = await sb.from("lab_cases").select("id").eq("parent_case_id", c.id).not("status", "in", "(delivered,cancelled)").limit(1);
      if (dup?.length) throw new Error("This case already has an open remake.");
      const src: any = c;
      const { data: child, error } = await sb.from("lab_cases").insert({
        org_id: currentOrg?.org_id, case_number: number, parent_case_id: c.id, status: "pending", qc_status: "pending",
        client_type: src.client_type || "external", patient_id: src.patient_id, dentist_id: src.dentist_id,
        technician_id: src.technician_id, treatment_id: src.treatment_id,
        external_client_name: src.external_client_name, clinic_code: src.clinic_code, clinic_doctor_name: src.clinic_doctor_name,
        external_contact_person: src.external_contact_person, external_client_phone: src.external_client_phone,
        external_client_email: src.external_client_email, external_patient_name: src.external_patient_name,
        work_type: c.work_type, material: c.material, shade: c.shade, teeth: src.teeth || [],
        instructions: c.instructions, job_instructions: src.job_instructions, job_description: src.job_description,
        is_urgent: true, urgency: "urgent", due_date: remakeDueDate(new Date(), cal), lab_fee: fee, clinic_fee: src.clinic_fee,
        notes: `Remake of ${c.case_number} — ${REMAKE_FAULTS.find((f) => f.key === fault)?.label}: ${reason}${notes ? `. ${notes}` : ""}`,
      }).select("id").single();
      if (error) throw error;
      const { error: e1 } = await sb.from("lab_cases").update({ remake_count: Number(src.remake_count || 0) + 1, status: REMAKE_SPAWNED }).eq("id", c.id);
      if (e1) throw e1;
      const { error: e2 } = await sb.from("lab_records").insert({
        org_id: currentOrg?.org_id, kind: "warranties", case_id: c.id, title: c.case_number, status: "in remake",
        amount: fee, record_date: new Date().toISOString().slice(0, 10),
        data: {
          fault, reason, notes, billable: fee > 0, child_case_id: child.id, child_number: number,
          client: clientOf(c), work_type: c.work_type, technician_id: c.technician_id, original_fee: Number(c.lab_fee || 0),
        },
      });
      if (e2) throw e2;
      qc.invalidateQueries({ queryKey: ["lab_cases"] });
      qc.invalidateQueries({ queryKey: ["lab_records"] });
      toast({ title: `Remake ${number} created`, description: "Marked rush and added to the board." });
      onCreated?.(child.id);
      onClose();
    } catch (e: any) {
      toast({ title: "Could not create remake", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remake {c.case_number}</DialogTitle>
          <DialogDescription>{c.work_type} · {clientOf(c)} · {patientOf(c)}</DialogDescription>
        </DialogHeader>
        {open ? (
          <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">This case already has a remake in production. Finish or cancel it first.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Who is responsible?</Label>
              <div className="mt-1 grid gap-1.5">
                {REMAKE_FAULTS.map((f) => (
                  <button key={f.key} type="button" onClick={() => setFault(f.key)}
                    className={`rounded-md border p-2 text-left text-sm transition-colors ${fault === f.key ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <p className="font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.hint}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{REMAKE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="rounded-md bg-muted/50 p-3 text-xs">
              New case <span className="font-mono font-medium">{number}</span> · Rush · due in 2 days · Fee {fee ? money(fee) : "free"}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {!open && <Button disabled={busy} onClick={submit}>{busy ? "Creating…" : "Create remake"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
