import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTreatment, useUpdateTreatment, type Treatment } from "@/hooks/useTreatments";

const treatmentTemplates = [
  { label: "Scaling & Polishing", name: "Scaling & Polishing", category: "Preventive", price: "25000", duration: "45 mins", description: "Full-mouth cleaning and polishing." },
  { label: "Composite Filling", name: "Composite Filling", category: "Restorative", price: "30000", duration: "40 mins", description: "Tooth-coloured filling on one tooth." },
  { label: "Simple Extraction", name: "Simple Extraction", category: "Surgical", price: "35000", duration: "30 mins", description: "Routine extraction under local anaesthesia." },
  { label: "Root Canal Treatment", name: "Root Canal Treatment", category: "Restorative", price: "120000", duration: "90 mins", description: "Endodontic treatment, single canal." },
  { label: "Teeth Whitening", name: "Teeth Whitening", category: "Cosmetic", price: "80000", duration: "60 mins", description: "In-office whitening session." },
];

const scopes = [
  { v: "mouth", l: "Whole mouth" },
  { v: "quadrant", l: "Quadrant" },
  { v: "tooth", l: "Single tooth" },
  { v: "surface", l: "Tooth surface" },
];

const categories = ["General", "Cosmetic", "Orthodontics", "Restorative", "Surgical", "Periodontics", "Preventive"];

interface TreatmentDialogProps {
  treatment?: Treatment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TreatmentDialog({ treatment, open, onOpenChange }: TreatmentDialogProps) {
  const createTreatment = useCreateTreatment();
  const updateTreatment = useUpdateTreatment();
  const isEdit = !!treatment;

  const [form, setForm] = useState({ name: "", category: "General", price: "", duration: "", description: "", cdt_code: "", patient_name: "", site_scope: "tooth" });

  useEffect(() => {
    if (treatment) {
      setForm({
        name: treatment.name,
        category: treatment.category,
        price: String(treatment.price),
        duration: treatment.duration || "",
        description: treatment.description || "",
        cdt_code: treatment.cdt_code || "",
        patient_name: treatment.patient_name || "",
        site_scope: treatment.site_scope || "tooth",
      });
    } else {
      setForm({ name: "", category: "General", price: "", duration: "", description: "", cdt_code: "", patient_name: "", site_scope: "tooth" });
    }
  }, [treatment, open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name, category: form.category, price: parseFloat(form.price) || 0, duration: form.duration, description: form.description, cdt_code: form.cdt_code.trim().toUpperCase() || null, patient_name: form.patient_name.trim() || null, site_scope: form.site_scope };
    if (isEdit && treatment) {
      await updateTreatment.mutateAsync({ id: treatment.id, ...payload });
    } else {
      await createTreatment.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createTreatment.isPending || updateTreatment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Treatment" : "Add Treatment"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label className="text-xs">Quick templates</Label>
              <div className="flex flex-wrap gap-1.5">
                {treatmentTemplates.map((t) => (
                  <Button
                    key={t.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => setForm({ ...form, name: t.name, category: t.category, price: t.price, duration: t.duration, description: t.description })}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Procedure code (CDT)</Label>
              <Input value={form.cdt_code} onChange={(e) => setForm({ ...form, cdt_code: e.target.value })} placeholder="e.g. D2740" maxLength={8} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Applies to</Label>
              <Select value={form.site_scope} onValueChange={(v) => setForm({ ...form, site_scope: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {scopes.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Patient-friendly name</Label>
            <Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} placeholder="e.g. Ceramic tooth cap" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price (₦)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration</Label>
            <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 30 mins" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary/90" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Treatment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
