import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HOLD_REASONS, holdMessage } from "@/lib/labWorkflow";
import { toast } from "@/hooks/use-toast";

export function HoldDialog({ open, onOpenChange, caseNumber, patient, doctor, onConfirm, pending }: {
  open: boolean; onOpenChange: (o: boolean) => void; caseNumber: string; patient: string; doctor?: string;
  onConfirm: (reason: string) => void; pending?: boolean;
}) {
  const [reason, setReason] = useState<string>(HOLD_REASONS[0]);
  const [note, setNote] = useState("");
  const msg = holdMessage({ caseNumber, patient, doctor, reason, note });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Put {caseNumber} on hold</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{HOLD_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Extra note for the clinic</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Message to the clinic</Label>
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{msg}</pre>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(msg); toast({ title: "Message copied" }); }}>Copy</Button>
              <Button size="sm" variant="outline" asChild><a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp</a></Button>
            </div>
          </div>
        </div>
        <DialogFooter><Button disabled={pending} onClick={() => onConfirm(note ? `${reason} — ${note}` : reason)}>Put on hold</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
