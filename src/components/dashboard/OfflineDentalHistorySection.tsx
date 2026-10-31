import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useStaff } from "@/hooks/useStaff";
import {
  useOfflineDentalHistory,
  useCreateOfflineDentalHistory,
  useUpdateOfflineDentalHistory,
  useDeleteOfflineDentalHistory,
  type OfflineDentalHistoryRow,
} from "@/hooks/useOfflineDentalHistory";

const NONE = "__none__";

const emptyForm = {
  history_date: new Date().toISOString().slice(0, 10),
  procedure: "",
  treatment: "",
  amount_paid: "",
  dentist_id: NONE,
  notes: "",
};

function formatCurrency(amount: number) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

export function OfflineDentalHistorySection({
  patientId,
  canEdit,
  clinicianLabel = "Dentist",
  historyLabel = "Dental History",
}: {
  patientId: string;
  canEdit: boolean;
  clinicianLabel?: string;
  historyLabel?: string;
}) {
  const { data: entries = [], isLoading } = useOfflineDentalHistory(patientId);
  const { data: staff = [] } = useStaff();
  const createEntry = useCreateOfflineDentalHistory();
  const updateEntry = useUpdateOfflineDentalHistory();
  const deleteEntry = useDeleteOfflineDentalHistory();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OfflineDentalHistoryRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const saving = createEntry.isPending || updateEntry.isPending;

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (entry: OfflineDentalHistoryRow) => {
    setEditing(entry);
    setForm({
      history_date: entry.history_date,
      procedure: entry.procedure,
      treatment: entry.treatment || "",
      amount_paid: entry.amount_paid ? String(entry.amount_paid) : "",
      dentist_id: entry.dentist_id || NONE,
      notes: entry.notes || "",
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.procedure.trim()) {
      toast({ title: "Procedure is required", variant: "destructive" });
      return;
    }
    if (!form.history_date) {
      toast({ title: "Date is required", variant: "destructive" });
      return;
    }
    const payload = {
      history_date: form.history_date,
      procedure: form.procedure.trim().slice(0, 300),
      treatment: form.treatment.trim().slice(0, 1000),
      amount_paid: form.amount_paid ? Number(form.amount_paid) : 0,
      dentist_id: form.dentist_id === NONE ? null : form.dentist_id,
      notes: form.notes.trim().slice(0, 2000),
    };
    if (Number.isNaN(payload.amount_paid) || payload.amount_paid < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const done = { onSuccess: () => { setOpen(false); setEditing(null); setForm({ ...emptyForm }); } };
    if (editing) updateEntry.mutate({ id: editing.id, ...payload }, done);
    else createEntry.mutate({ patientId, ...payload }, done);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="h-4 w-4" /> Past (Offline) {historyLabel}
          </CardTitle>
          <CardDescription>
            Records from before this patient was added to the dashboard. {entries.length} recorded.
          </CardDescription>
        </div>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No past records added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="rounded-lg border border-border/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{e.procedure}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.staff?.full_name || "Unassigned"} · {e.history_date}
                    </p>
                    {e.treatment && <p className="text-xs mt-1">{e.treatment}</p>}
                    {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px]">Offline</Badge>
                    <span className="text-sm font-medium">{formatCurrency(e.amount_paid)}</span>
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)} aria-label="Edit record">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          aria-label="Delete record"
                          onClick={() => {
                            if (window.confirm("Delete this past record?")) deleteEntry.mutate(e.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Past Record" : "Add Past Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date *</Label>
                <Input type="date" value={form.history_date} onChange={(e) => setForm((f) => ({ ...f, history_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount Paid (₦)</Label>
                <Input type="number" min="0" step="0.01" value={form.amount_paid} onChange={(e) => setForm((f) => ({ ...f, amount_paid: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Procedure *</Label>
              <Input value={form.procedure} onChange={(e) => setForm((f) => ({ ...f, procedure: e.target.value }))} placeholder="e.g. Scaling and polishing" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Treatment</Label>
              <Textarea rows={2} value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} placeholder="Treatment given" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{clinicianLabel} who attended</Label>
              <Select value={form.dentist_id} onValueChange={(v) => setForm((f) => ({ ...f, dentist_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not recorded</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-secondary hover:bg-secondary/90" disabled={saving} onClick={submit}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
