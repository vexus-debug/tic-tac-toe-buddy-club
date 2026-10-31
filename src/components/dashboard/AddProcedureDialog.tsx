import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCreateDentalChartEntry, useUpdateDentalChartEntry } from "@/hooks/useDentalCharts";
import { useStaff } from "@/hooks/useStaff";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useClinicTerms } from "@/hooks/useClinicTerms";

type ToothCondition = "healthy" | "decayed" | "treated" | "missing" | "crowned" | "impacted" | "rotated" | "fractured" | "sensitive" | "bridged" | "veneer" | "root_canal" | "implant" | "erupting" | "other";

interface EditEntry {
  id: string;
  tooth_number: number;
  procedure: string;
  status: string;
  entry_date: string;
  notes: string;
  dentist_id: string | null;
  patient_id: string;
}

interface AddProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothNumber: number;
  currentStatus: string;
  patientId: string;
  editEntry?: EditEntry | null;
}

const procedureCategories: Record<string, string[]> = {
  "Restorative": ["Composite Filling", "Amalgam Filling", "Glass Ionomer Filling", "Inlay/Onlay", "Temporary Filling"],
  "Endodontic": ["Root Canal (Anterior)", "Root Canal (Premolar)", "Root Canal (Molar)", "Pulp Capping", "Retreatment"],
  "Prosthodontic": ["Crown (PFM)", "Crown (Ceramic/Zirconia)", "Crown (Gold)", "Bridge", "Veneer", "Denture"],
  "Surgical": ["Extraction (Simple)", "Extraction (Surgical)", "Implant Placement", "Bone Graft", "Sinus Lift"],
  "Periodontal": ["Scaling & Polishing", "Deep Scaling (SRP)", "Gingival Surgery", "Crown Lengthening"],
  "Preventive": ["Sealant", "Fluoride Treatment", "Space Maintainer"],
  "Orthodontic": ["Bracket Placement", "Wire Adjustment", "Retainer"],
};

const allConditions: { value: ToothCondition; label: string; color: string }[] = [
  { value: "healthy", label: "Healthy", color: "bg-emerald-500" },
  { value: "decayed", label: "Decayed", color: "bg-red-500" },
  { value: "treated", label: "Treated", color: "bg-blue-500" },
  { value: "missing", label: "Missing", color: "bg-gray-500" },
  { value: "crowned", label: "Crowned", color: "bg-amber-500" },
  { value: "impacted", label: "Impacted", color: "bg-purple-500" },
  { value: "rotated", label: "Rotated", color: "bg-orange-500" },
  { value: "fractured", label: "Fractured", color: "bg-rose-500" },
  { value: "sensitive", label: "Sensitive", color: "bg-yellow-500" },
  { value: "bridged", label: "Bridged", color: "bg-indigo-500" },
  { value: "veneer", label: "Veneer", color: "bg-pink-500" },
  { value: "root_canal", label: "Root Canal", color: "bg-orange-600" },
  { value: "implant", label: "Implant", color: "bg-cyan-500" },
  { value: "erupting", label: "Erupting", color: "bg-lime-500" },
  { value: "other", label: "Other/Custom", color: "bg-slate-500" },
];

export function AddProcedureDialog({ open, onOpenChange, toothNumber, currentStatus, patientId, editEntry }: AddProcedureDialogProps) {
  const terms = useClinicTerms();
  const [condition, setCondition] = useState<ToothCondition>(currentStatus as ToothCondition || "healthy");
  const [procedure, setProcedure] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dentistId, setDentistId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const createEntry = useCreateDentalChartEntry();
  const updateEntry = useUpdateDentalChartEntry();
  const { data: staffList = [] } = useStaff();
  const dentists = staffList.filter((s: any) => s.role === "dentist");

  const isEditing = !!editEntry;

  useEffect(() => {
    if (editEntry) {
      setCondition(editEntry.status as ToothCondition);
      setProcedure(editEntry.procedure);
      setNotes(editEntry.notes || "");
      setDate(editEntry.entry_date);
      setDentistId(editEntry.dentist_id || "");
      for (const [cat, procs] of Object.entries(procedureCategories)) {
        if (procs.includes(editEntry.procedure)) {
          setSelectedCategory(cat);
          break;
        }
      }
    } else {
      setCondition(currentStatus as ToothCondition || "healthy");
      setProcedure("");
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setDentistId("");
      setSelectedCategory("");
    }
  }, [editEntry, currentStatus, open]);

  const handleSubmit = () => {
    if (!procedure) {
      toast({ title: "Please select a procedure", variant: "destructive" });
      return;
    }

    if (isEditing && editEntry) {
      updateEntry.mutate({
        id: editEntry.id,
        patient_id: patientId,
        tooth_number: toothNumber,
        procedure,
        condition,
        entry_date: date,
        notes,
        dentist_id: dentistId || null,
      }, {
        onSuccess: () => { onOpenChange(false); },
      });
    } else {
      createEntry.mutate({
        patient_id: patientId,
        tooth_number: toothNumber,
        procedure,
        condition,
        entry_date: date,
        notes,
        dentist_id: dentistId || undefined,
      }, {
        onSuccess: () => {
          onOpenChange(false);
          setProcedure("");
          setNotes("");
          setCondition(currentStatus as ToothCondition || "healthy");
          setDentistId("");
          setSelectedCategory("");
        },
      });
    }
  };

  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Edit" : "Add"} Procedure — Tooth #{toothNumber}
            {isEditing && <Badge variant="outline" className="text-xs">Editing</Badge>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setProcedure(""); }}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {Object.keys(procedureCategories).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Procedure</Label>
            <Select value={procedure} onValueChange={setProcedure}>
              <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
              <SelectContent>
                {(selectedCategory ? procedureCategories[selectedCategory] : Object.values(procedureCategories).flat()).map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tooth Condition</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as ToothCondition)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allConditions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{terms.clinician}</Label>
            <Select value={dentistId} onValueChange={setDentistId}>
              <SelectTrigger><SelectValue placeholder={`Select ${terms.clinician.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>
                {dentists.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clinical Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Surface affected, material used, shade, observations..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary/90" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update Procedure" : "Save Procedure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
