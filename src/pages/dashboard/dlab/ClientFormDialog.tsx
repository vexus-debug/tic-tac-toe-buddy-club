import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveLabRecord, type LabRecord } from "@/hooks/useLabRecords";
import { TERMS, TIERS, newId, toProfileRecord, validateClient, type ClientProfileInput, type Doctor } from "@/lib/labClients";

const blank = (name = ""): ClientProfileInput => ({ name, terms: "net_30", tier: "standard", credit_limit: 0, doctors: [] });

export function fromRecord(r?: LabRecord | null, fallbackName = ""): ClientProfileInput {
  if (!r) return blank(fallbackName);
  return { ...(r.data || {}), name: r.title, credit_limit: Number(r.amount || 0), on_hold: r.status === "hold", doctors: r.data?.doctors || [] };
}

export function ClientFormDialog({ open, onOpenChange, record, defaultName }: {
  open: boolean; onOpenChange: (o: boolean) => void; record?: LabRecord | null; defaultName?: string;
}) {
  const save = useSaveLabRecord("client-profiles");
  const [f, setF] = useState<ClientProfileInput>(blank());
  const [errs, setErrs] = useState<string[]>([]);
  useEffect(() => { if (open) { setF(fromRecord(record, defaultName)); setErrs([]); } }, [open, record, defaultName]);
  const set = <K extends keyof ClientProfileInput>(k: K, v: ClientProfileInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const setDoc = (i: number, patch: Partial<Doctor>) => set("doctors", (f.doctors || []).map((d, j) => (j === i ? { ...d, ...patch } : d)));

  const submit = async () => {
    const e = validateClient(f);
    setErrs(e);
    if (e.length) return;
    await save.mutateAsync({ id: record?.id, ...toProfileRecord(f, record?.data?.client_id) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{record ? "Edit client account" : "New client account"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Practice name *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} autoFocus /></div>
          <div><Label>Primary contact</Label><Input value={f.contact_name || ""} onChange={(e) => set("contact_name", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={f.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><Label>Billing email</Label><Input type="email" value={f.email || ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div><Label>Tax ID / TIN</Label><Input value={f.tax_id || ""} onChange={(e) => set("tax_id", e.target.value)} /></div>
          <div><Label>Billing address</Label><Textarea rows={2} value={f.address || ""} onChange={(e) => set("address", e.target.value)} /></div>
          <div><Label>Courier delivery address</Label><Textarea rows={2} value={f.delivery_address || ""} onChange={(e) => set("delivery_address", e.target.value)} /></div>
          <div><Label>Payment terms</Label>
            <Select value={f.terms} onValueChange={(v) => set("terms", v as any)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TERMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Default price tier</Label>
            <Select value={f.tier} onValueChange={(v) => set("tier", v as any)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Credit limit (₦, 0 = none)</Label><Input type="number" min={0} value={f.credit_limit ?? 0} onChange={(e) => set("credit_limit", Number(e.target.value))} /></div>
          <div className="flex items-end gap-2 pb-2"><Switch checked={!!f.on_hold} onCheckedChange={(v) => set("on_hold", v)} /><Label>Credit hold</Label></div>
          <div className="sm:col-span-2"><Label>Courier / logistics notes</Label><Input placeholder="e.g. Afternoon pickup only, gate code #4912" value={f.courier_notes || ""} onChange={(e) => set("courier_notes", e.target.value)} /></div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">Doctors</p>
            <Button size="sm" variant="outline" onClick={() => set("doctors", [...(f.doctors || []), { id: newId(), name: "", contact_pref: "phone" }])}><Plus className="mr-1 h-3.5 w-3.5" />Add doctor</Button></div>
          {(f.doctors || []).map((d, i) => (
            <div key={d.id} className="grid gap-2 rounded-md border p-2 sm:grid-cols-6">
              <Input className="sm:col-span-2" placeholder="Dr. name *" value={d.name} onChange={(e) => setDoc(i, { name: e.target.value })} />
              <Input placeholder="License" value={d.license || ""} onChange={(e) => setDoc(i, { license: e.target.value })} />
              <Input placeholder="Phone" value={d.phone || ""} onChange={(e) => setDoc(i, { phone: e.target.value })} />
              <Input placeholder="Email" value={d.email || ""} onChange={(e) => setDoc(i, { email: e.target.value })} />
              <Select value={d.contact_pref || "phone"} onValueChange={(v) => setDoc(i, { contact_pref: v as any })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="phone">Phone</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent></Select>
              <Input className="sm:col-span-2" placeholder="Shade guide (e.g. VITA 3D)" value={d.shade_guide || ""} onChange={(e) => setDoc(i, { shade_guide: e.target.value })} />
              <Input className="sm:col-span-2" placeholder="Preferred margin" value={d.margin_pref || ""} onChange={(e) => setDoc(i, { margin_pref: e.target.value })} />
              <Input className="sm:col-span-1" placeholder="Notes" value={d.special_instructions || ""} onChange={(e) => setDoc(i, { special_instructions: e.target.value })} />
              <Button size="icon" variant="ghost" aria-label="Remove doctor" onClick={() => set("doctors", (f.doctors || []).filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>

        {errs.length > 0 && <ul className="list-disc pl-5 text-sm text-destructive">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={save.isPending}>Save account</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
