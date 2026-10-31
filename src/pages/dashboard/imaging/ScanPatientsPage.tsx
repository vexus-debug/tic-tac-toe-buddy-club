import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useScanPatients, useSaveScanPatient, type ScanPatient } from "@/hooks/scan/useScan";
import { Plus, Search, Users } from "lucide-react";

const empty = { full_name: "", age: "", sex: "", phone: "", email: "", address: "", notes: "" };

export default function ScanPatientsPage() {
  const [term, setTerm] = useState("");
  const { data: patients = [] } = useScanPatients(term);
  const save = useSaveScanPatient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const edit = (p: ScanPatient) => {
    setForm({ ...p });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.full_name?.trim()) return;
    await save.mutateAsync(form);
    setOpen(false);
    setForm(empty);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Imaging Patients" description="People registered for imaging studies">
        <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Patient
        </Button>
      </PageHeader>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, file number or phone…" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      <div className="space-y-2">
        {patients.map((p) => (
          <Card key={p.id} className="glass-card cursor-pointer" onClick={() => edit(p)}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{p.mrn}</span> · {p.age || "—"} · {p.sex || "—"} · {p.phone || "no phone"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
            </CardContent>
          </Card>
        ))}
        {patients.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No patients yet.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit patient" : "New patient"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Full name</Label>
              <Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Age</Label>
              <Input value={form.age || ""} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </div>
            <div>
              <Label>Sex</Label>
              <Input value={form.sex || ""} onChange={(e) => setForm({ ...form, sex: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
