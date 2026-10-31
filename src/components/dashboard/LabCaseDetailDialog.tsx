import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateLabCase, type LabCaseRow } from "@/hooks/useLabCases";

export const LAB_CASE_STAGES = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
] as const;

interface LabCaseDetailDialogProps {
  labCase: LabCaseRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabCaseDetailDialog({ labCase, open, onOpenChange }: LabCaseDetailDialogProps) {
  const updateLabCase = useUpdateLabCase();
  const [status, setStatus] = useState("pending");
  const [urgency, setUrgency] = useState("normal");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!labCase || !open) return;
    setStatus(labCase.status || "pending");
    setUrgency(labCase.is_urgent || labCase.urgency === "urgent" ? "urgent" : "normal");
    setNotes(labCase.notes || "");
  }, [labCase, open]);

  if (!labCase) return null;

  const isExternal = labCase.client_type === "external";
  const clientLabel = isExternal
    ? labCase.external_client_name || "Outside client"
    : labCase.patients
      ? `${labCase.patients.first_name} ${labCase.patients.last_name}`
      : "Unknown patient";

  function save() {
    const updates: Record<string, unknown> = {
      status,
      urgency,
      is_urgent: urgency === "urgent",
      notes,
    };
    // Keep the timeline honest as the case moves along
    if (status === "in-progress" && !labCase!.start_date) {
      updates.start_date = format(new Date(), "yyyy-MM-dd");
    }
    if (status === "ready" || status === "delivered") {
      updates.completed_date = labCase!.completed_date || format(new Date(), "yyyy-MM-dd");
    } else {
      updates.completed_date = null;
    }
    updateLabCase.mutate(
      { id: labCase!.id, ...updates },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {labCase.work_type}
            {isExternal && <Badge variant="outline">Outside work</Badge>}
          </DialogTitle>
          <DialogDescription>
            {labCase.case_number ? `${labCase.case_number} — ` : ""}{clientLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 rounded-lg border p-3 bg-muted/10 text-sm">
            {isExternal ? (
              <>
                <Row label="Patient / reference" value={labCase.external_patient_name} />
                <Row label="Contact person" value={labCase.external_contact_person} />
                <Row label="Phone" value={labCase.external_client_phone} />
                <Row label="Email" value={labCase.external_client_email} />
              </>
            ) : (
              <Row label="Clinician" value={labCase.dentist?.full_name} />
            )}
            <Row label="Shade" value={labCase.shade} />
            <Row
              label="Delivery date"
              value={labCase.due_date ? format(new Date(labCase.due_date), "PPP") : null}
            />
            <Row label="Cost" value={`₦${Number(labCase.lab_fee || 0).toLocaleString()}`} />
            {labCase.instructions && <Row label="Instructions" value={labCase.instructions} />}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LAB_CASE_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Lab notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Progress notes, issues, remakes..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={save} disabled={updateLabCase.isPending}>
            {updateLabCase.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
