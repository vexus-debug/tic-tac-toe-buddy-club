import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicLinks } from "@/hooks/usePatientContext";
import { isInvoiced } from "@/hooks/useVisitFlow";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { useOrg } from "@/hooks/useOrg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePatients } from "@/hooks/usePatients";
import { useDentalChartEntries, useDeleteDentalChartEntry, useCreateDentalChartEntry, useUpdateDentalChartEntry } from "@/hooks/useDentalCharts";
import { AddProcedureDialog } from "@/components/dashboard/AddProcedureDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useTreatments } from "@/hooks/useTreatments";
import { usePatientContext } from "@/hooks/usePatientContext";
import { PatientVisitBar } from "@/components/dashboard/PatientVisitBar";
import { PatientBriefing } from "@/components/dashboard/PatientBriefing";
import { conditionProcedure, matchCatalogTreatment, useAddChartItemToPlan } from "@/hooks/useVisitFlow";
import { FlaskConical, CheckSquare, X, Plus, ClipboardPlus, Edit2, Trash2, Calendar, User, FileText, ChevronDown, ChevronUp } from "lucide-react";

const statusOptions = [
  { value: "healthy", label: "Healthy", bg: "bg-emerald-200", border: "border-emerald-400", text: "text-emerald-900", dot: "bg-emerald-400" },
  { value: "decayed", label: "Decayed", bg: "bg-red-200", border: "border-red-400", text: "text-red-900", dot: "bg-red-400" },
  { value: "treated", label: "Treated", bg: "bg-blue-200", border: "border-blue-400", text: "text-blue-900", dot: "bg-blue-400" },
  { value: "missing", label: "Missing", bg: "bg-gray-200", border: "border-gray-400", text: "text-gray-900", dot: "bg-gray-400" },
  { value: "crowned", label: "Crowned", bg: "bg-amber-200", border: "border-amber-400", text: "text-amber-900", dot: "bg-amber-400" },
  { value: "impacted", label: "Impacted", bg: "bg-purple-200", border: "border-purple-400", text: "text-purple-900", dot: "bg-purple-400" },
  { value: "rotated", label: "Rotated", bg: "bg-orange-200", border: "border-orange-400", text: "text-orange-900", dot: "bg-orange-400" },
  { value: "fractured", label: "Fractured", bg: "bg-rose-200", border: "border-rose-400", text: "text-rose-900", dot: "bg-rose-400" },
  { value: "sensitive", label: "Sensitive", bg: "bg-yellow-200", border: "border-yellow-400", text: "text-yellow-900", dot: "bg-yellow-400" },
  { value: "bridged", label: "Bridged", bg: "bg-indigo-200", border: "border-indigo-400", text: "text-indigo-900", dot: "bg-indigo-400" },
  { value: "veneer", label: "Veneer", bg: "bg-pink-200", border: "border-pink-400", text: "text-pink-900", dot: "bg-pink-400" },
  { value: "root_canal", label: "Root Canal", bg: "bg-orange-300", border: "border-orange-500", text: "text-orange-900", dot: "bg-orange-500" },
  { value: "implant", label: "Implant", bg: "bg-cyan-200", border: "border-cyan-400", text: "text-cyan-900", dot: "bg-cyan-400" },
  { value: "erupting", label: "Erupting", bg: "bg-lime-200", border: "border-lime-400", text: "text-lime-900", dot: "bg-lime-400" },
  { value: "other", label: "Other/Custom", bg: "bg-slate-200", border: "border-slate-400", text: "text-slate-900", dot: "bg-slate-400" },
];

const SURFACES = ["M", "O", "D", "B", "L", "I"];
const MATERIALS = ["Composite", "Amalgam", "GIC", "Zirconia", "PFM", "E-max", "Gold"];
type PlanMark = "planned" | "done" | "billed";
const markStyle: Record<PlanMark, { cls: string; label: string }> = {
  planned: { cls: "bg-amber-500", label: "In plan" },
  done: { cls: "bg-emerald-600", label: "Done, not billed" },
  billed: { cls: "bg-blue-600", label: "Billed" },
};

function usePatientToothPlanMarks(patientId?: string | null) {
  return useQuery({
    queryKey: ["patient-plan-items", patientId, "tooth-marks"],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("treatment_plan_items")
        .select("tooth_number, status, notes, description, treatment_plans!inner(patient_id)")
        .eq("treatment_plans.patient_id", patientId);
      if (error) throw error;
      const marks: Record<string, { mark: PlanMark; items: string[] }> = {};
      const rank = { planned: 1, done: 2, billed: 3 } as const;
      (data || []).forEach((i: any) => {
        if (!i.tooth_number || i.status === "skipped") return;
        const m: PlanMark = isInvoiced(i) ? "billed" : i.status === "completed" ? "done" : "planned";
        for (const t of String(i.tooth_number).split(/[,\s]+/).filter(Boolean)) {
          const cur = marks[t];
          if (!cur) marks[t] = { mark: m, items: [i.description] };
          else { cur.items.push(i.description); if (rank[m] < rank[cur.mark]) cur.mark = m; }
        }
      });
      return marks;
    },
  });
}

function getStatusStyle(status: string) {
  return statusOptions.find(s => s.value === status) || statusOptions[0];
}

// Grid rows matching FDI dental chart reference
const upperRows = [
  [18, 17, 16, 15, 14, 13, 12],
  [11, 21, 22, 23, 24, 25, 26],
];
const upperExtra = [27, 28];
const lowerRows = [
  [48, 47, 46, 45, 44, 43, 42],
  [41, 31, 32, 33, 34, 35, 36],
];
const lowerExtra = [37, 38];

function ToothButton({
  tooth,
  status,
  isSelected,
  onSelect,
  onSetStatus,
  suggest,
  mark,
  multiMode,
}: {
  mark?: PlanMark;
  multiMode?: boolean;
  tooth: number;
  status: string;
  isSelected: boolean;
  onSelect: () => void;
  onSetStatus: (status: string, addToPlan: boolean, surface: string, material: string) => void;
  suggest: (status: string) => { label: string; cost: number | null } | null;
}) {
  const style = getStatusStyle(status);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [addToPlan, setAddToPlan] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [material, setMaterial] = useState("");
  const preview = hovered ? suggest(hovered) : null;

  return (
    <Popover open={popoverOpen && !multiMode} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={() => {
            onSelect();
            setPopoverOpen(true);
          }}
          title={mark ? markStyle[mark].label : undefined}
          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-md border-2 flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer
            ${style.bg} ${style.border} ${style.text}
            ${isSelected ? "ring-2 ring-primary ring-offset-1 scale-110 shadow-lg z-10" : "hover:scale-105 hover:shadow-sm"}`}
        >
          {tooth}
          {mark && <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${markStyle[mark].cls}`} />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 max-h-72 overflow-y-auto" side="top" align="center">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Tooth #{tooth} — Set Condition</p>
        <div className="grid grid-cols-2 gap-1.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onMouseEnter={() => setHovered(opt.value)}
              onFocus={() => setHovered(opt.value)}
              onClick={() => {
                onSetStatus(opt.value, addToPlan, surfaces.join(""), material);
                setPopoverOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80
                ${opt.bg} ${opt.border} border ${opt.text}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 mb-1 px-1 text-[10px] font-semibold text-muted-foreground">Surfaces</p>
        <div className="flex gap-1">
          {SURFACES.map((sf) => (
            <button key={sf} type="button"
              onClick={() => setSurfaces((c) => c.includes(sf) ? c.filter((x) => x !== sf) : [...c, sf])}
              className={`h-6 flex-1 rounded border text-[10px] font-bold ${surfaces.includes(sf) ? "bg-primary text-primary-foreground border-primary" : "border-border bg-muted/30"}`}>{sf}</button>
          ))}
        </div>
        <select value={material} onChange={(e) => setMaterial(e.target.value)}
          className="mt-1.5 w-full h-7 rounded border border-border bg-background px-1 text-[11px]">
          <option value="">Material (optional)</option>
          {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 cursor-pointer">
          <span className="flex items-center gap-1.5 text-[11px] font-medium">
            <ClipboardPlus className="h-3.5 w-3.5 text-secondary" /> Add to treatment plan
          </span>
          <Switch checked={addToPlan} onCheckedChange={setAddToPlan} className="scale-75" />
        </label>
        {addToPlan && (
          <p className="mt-1 px-1 text-[10px] text-muted-foreground">
            {preview
              ? `${preview.label}${preview.cost != null ? ` · ₦${preview.cost.toLocaleString()}` : " · price not in catalog"}`
              : "Treatable conditions are added with the catalog price."}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function DentalChartsPage() {
  const terms = useClinicTerms();
  const { currentOrg } = useOrg();
  const isEyeClinic = currentOrg?.clinic_type === "eye";
  const { data: patients = [] } = usePatients();
  const { patientId: urlPatientId, setPatientId: setSelectedPatientId } = usePatientContext();
  const { data: treatments = [] } = useTreatments();
  const addToPlan = useAddChartItemToPlan();
  const navigate = useNavigate();
  const link = useClinicLinks();
  const [multiMode, setMultiMode] = useState(false);
  const [multiSel, setMultiSel] = useState<number[]>([]);
  const [bulkCondition, setBulkCondition] = useState("decayed");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [procedureOpen, setProcedureOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const deleteEntry = useDeleteDentalChartEntry();
  const createEntry = useCreateDentalChartEntry();
  const updateEntry = useUpdateDentalChartEntry();
  // Only the patient locked in the URL — never silently default to someone else.
  const patientId = urlPatientId;
  const { data: entries = [] } = useDentalChartEntries(patientId);
  const { data: planMarks = {} } = usePatientToothPlanMarks(patientId);

  // Wait until the clinic is resolved — redirecting before that would bounce
  // dental clinics back to the dashboard on a fresh page load.
  if (!currentOrg) {
    return null;
  }

  // Tooth charting only applies to dental clinics
  if (!terms.showDentalChart) {
    return <Navigate to={isEyeClinic ? "../eye/charts" : "../dashboard"} replace />;
  }

  // Build per-tooth data
  const toothData: Record<number, {
    status: string;
    latestEntryId: string | null;
    history: { id: string; date: string; procedure: string; dentist: string; status: string; notes: string; dentist_id: string | null }[];
  }> = {};

  entries.forEach((e: any) => {
    if (!toothData[e.tooth_number]) {
      toothData[e.tooth_number] = { status: e.condition || e.status || "healthy", latestEntryId: e.id, history: [] };
    }
    toothData[e.tooth_number].history.push({
      id: e.id, date: e.entry_date, procedure: e.procedure,
      dentist: (e.staff as any)?.full_name || "Unknown",
      status: e.condition || e.status || "healthy", notes: e.notes || "", dentist_id: e.dentist_id,
    });
  });

  const selectedData = selectedTooth ? toothData[selectedTooth] : null;

  const suggestFor = (status: string) => {
    const rule = conditionProcedure[status];
    if (!rule) return null;
    const t = matchCatalogTreatment(status, treatments as any);
    return { label: t?.name || rule.label, cost: t ? Number(t.price || 0) : null, treatmentId: t?.id || null };
  };

  const handleSetToothStatus = (tooth: number, newStatus: string, planIt = false, surface = "", material = "") => {
    if (!patientId) return;
    const sug = planIt ? suggestFor(newStatus) : null;
    const detail = [surface, material].filter(Boolean).join(" · ");
    if (sug) {
      addToPlan.mutate({
        patient_id: patientId,
        tooth_number: tooth,
        description: detail ? `${sug.label} (${detail})` : sug.label,
        treatment_id: sug.treatmentId,
        estimated_cost: sug.cost ?? 0,
      });
    }
    const existing = toothData[tooth];
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;

    if (existing?.latestEntryId) {
      updateEntry.mutate({
        id: existing.latestEntryId,
        patient_id: patientId,
        condition: newStatus,
        ...(surface ? { surface } : {}),
        ...(material ? { notes: `Material: ${material}` } : {}),
      });
    } else {
      createEntry.mutate({
        patient_id: patientId,
        tooth_number: tooth,
        procedure: `Condition: ${statusLabel}`,
        condition: newStatus,
        surface: surface || null,
        notes: material ? `Material: ${material}` : null,
        entry_date: new Date().toISOString().split("T")[0],
      });
    }
  };

  const toggleMulti = (tooth: number) =>
    setMultiSel((c) => (c.includes(tooth) ? c.filter((t) => t !== tooth) : [...c, tooth]));
  const bulkSug = suggestFor(bulkCondition);
  const handleBulkAdd = async () => {
    for (const t of multiSel) handleSetToothStatus(t, bulkCondition, true);
    setMultiSel([]);
    setMultiMode(false);
  };
  const orderLab = (tooth: number) => {
    const status = toothData[tooth]?.status;
    const work = status === "crowned" ? "Crown" : status === "bridged" ? "Bridge" : status === "veneer" ? "Veneer" : status === "implant" ? "Implant crown" : status === "missing" ? "Bridge" : "Crown";
    navigate(link("lab-work", patientId!, { new: "1", tooth: String(tooth), work }));
  };

  const handleAddProcedure = () => { setEditEntry(null); setProcedureOpen(true); };
  const handleEditEntry = (entry: any) => {
    setEditEntry({ id: entry.id, tooth_number: selectedTooth!, procedure: entry.procedure, status: entry.status, entry_date: entry.date, notes: entry.notes, dentist_id: entry.dentist_id, patient_id: patientId });
    setProcedureOpen(true);
  };
  const handleDeleteEntry = (entryId: string) => { if (patientId) deleteEntry.mutate({ id: entryId, patient_id: patientId }); };

  const displayedHistory = selectedData?.history
    ? showAllHistory ? selectedData.history : selectedData.history.slice(0, 5)
    : [];

  const renderToothRow = (teeth: number[]) => (
    <div className="flex justify-center gap-1.5">
      {teeth.map((tooth) => (
        <ToothButton
          key={tooth}
          tooth={tooth}
          status={toothData[tooth]?.status || "healthy"}
          isSelected={multiMode ? multiSel.includes(tooth) : selectedTooth === tooth}
          onSelect={() => (multiMode ? toggleMulti(tooth) : setSelectedTooth(tooth))}
          onSetStatus={(s, plan, sf, mat) => handleSetToothStatus(tooth, s, plan, sf, mat)}
          suggest={suggestFor}
          mark={planMarks[String(tooth)]?.mark}
          multiMode={multiMode}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {patientId && <PatientVisitBar patientId={patientId} onClear={() => { setSelectedPatientId(""); setSelectedTooth(null); }} />}
      {patientId && <PatientBriefing patientId={patientId} />}
      <PageHeader
        title="Dental Charts"
        description="Interactive tooth chart per patient"
        tutorial={{
          title: "Dental Charts — How to Use",
          description: "Record and track every tooth's condition, treatments performed, and dental history for each patient.",
          steps: [
            {
              title: "Select a patient",
              description: "Use the patient dropdown (top right of the chart) to load a specific patient's dental record. The interactive tooth diagram will display their history.",
            },
            {
              title: "Read the tooth diagram",
              description: "The diagram shows the upper jaw (top) and lower jaw (bottom) with numbered teeth. Each tooth is clickable. Teeth with recorded entries have a color or symbol indicating their condition.",
            },
            {
              title: "Click a tooth to record",
              description: "Click any tooth number to select it. A form appears where you can record: procedure performed (Filling, Extraction, Crown, etc.), surface, condition, the dentist who performed it, and notes.",
              tip: "Use the correct FDI tooth numbering system. Upper right starts at 11, upper left at 21, lower left at 31, lower right at 41.",
            },
            {
              title: "Add an entry",
              description: "After selecting a tooth, fill in the procedure details and click 'Add Entry'. This saves to the patient's permanent dental chart and appears in their history below.",
            },
            {
              title: "View chart history",
              description: "The history table below the chart shows all entries for the selected patient — sorted by date. You can see which teeth were treated, by whom, and when.",
            },
            {
              title: "Edit or remove entries",
              description: "Each history entry has edit and delete buttons. Use edit to correct a mistake, and delete only when an entry was added in error (deletions cannot be undone).",
            },
          ],
          nextPageHint: {
            label: "Prescriptions",
            description: "After charting, issue any required prescriptions for the patient from the Prescriptions page.",
          },
        }}
      >
        <div className="w-64" data-tour="dental-charts-patient-select">
          <Select value={patientId || ""} onValueChange={(v) => { setSelectedPatientId(v); setSelectedTooth(null); }}>
            <SelectTrigger className="bg-muted/30 border-border/40">
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {!patientId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">Choose a patient to open their chart</p>
            <p className="text-xs text-muted-foreground mt-1">Or open the chart straight from an appointment or the waiting list.</p>
          </CardContent>
        </Card>
      ) : (
      <>
      {/* Dental Chart Card */}
      <Card data-tour="dental-charts-chart">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg font-bold">Tooth Chart — Adult (FDI Notation)</CardTitle>
            <Button size="sm" variant={multiMode ? "default" : "outline"} className="gap-1"
              onClick={() => { setMultiMode(!multiMode); setMultiSel([]); }}>
              {multiMode ? <X className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
              {multiMode ? "Cancel" : "Select several teeth"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {(Object.keys(markStyle) as PlanMark[]).map((m) => (
              <span key={m} className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-full ${markStyle[m].cls}`} />{markStyle[m].label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2" data-tour="dental-charts-legend">
            {/* legend */}
            {statusOptions.map((item) => (
              <div key={item.value} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${item.dot}`} />
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {multiMode && (
            <div className="sticky top-2 z-20 rounded-lg border border-primary/40 bg-card p-3 shadow-sm space-y-2">
              <p className="text-xs font-medium">
                {multiSel.length ? `Selected: ${[...multiSel].sort((a, b) => a - b).join(", ")}` : "Tap teeth to select them"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={bulkCondition} onValueChange={setBulkCondition}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="gap-1" disabled={!multiSel.length} onClick={handleBulkAdd}>
                  <ClipboardPlus className="h-3.5 w-3.5" /> {bulkSug ? `Add ${multiSel.length} to plan` : `Mark ${multiSel.length}`}
                </Button>
              </div>
              {bulkSug && multiSel.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {bulkSug.label} × {multiSel.length}{bulkSug.cost != null ? ` · ₦${(bulkSug.cost * multiSel.length).toLocaleString()}` : ""}
                </p>
              )}
            </div>
          )}
          {/* Upper Jaw */}
          <div>
            <p className="text-center text-sm font-medium text-muted-foreground mb-3">Upper Jaw</p>
            <div className="flex flex-col items-center gap-1.5">
              {upperRows.map((row, i) => (
                <div key={i}>{renderToothRow(row)}</div>
              ))}
              <div>{renderToothRow(upperExtra)}</div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-border/50" />

          {/* Lower Jaw */}
          <div>
            <p className="text-center text-sm font-medium text-muted-foreground mb-3">Lower Jaw</p>
            <div className="flex flex-col items-center gap-1.5">
              {lowerRows.map((row, i) => (
                <div key={i}>{renderToothRow(row)}</div>
              ))}
              <div>{renderToothRow(lowerExtra)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Tooth Detail */}
      <AnimatePresence>
        {selectedTooth && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
          >
            <Card data-tour="dental-charts-tooth-detail">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Tooth #{selectedTooth}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                      {getStatusStyle(selectedData?.status || "healthy").label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => orderLab(selectedTooth)} className="gap-1">
                      <FlaskConical className="h-3.5 w-3.5" /> Order lab case
                    </Button>
                    <Button size="sm" onClick={handleAddProcedure} className="gap-1" data-tour="dental-charts-add-procedure">
                      <Plus className="h-3.5 w-3.5" /> Add Procedure
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {planMarks[String(selectedTooth)] && (
                  <div className="mb-3 rounded-md border border-border/40 bg-muted/30 p-2 text-xs">
                    <span className="font-semibold">{markStyle[planMarks[String(selectedTooth)].mark].label}:</span>{" "}
                    {planMarks[String(selectedTooth)].items.join(", ")}
                  </div>
                )}
                {(!selectedData?.history || selectedData.history.length === 0) ? (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No procedures recorded</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> History ({selectedData.history.length})
                    </h4>
                    <div className="space-y-2" data-tour="dental-charts-history">
                      {displayedHistory.map((h) => (
                        <div key={h.id} className="group flex items-start gap-3 text-xs bg-muted/30 rounded-lg p-3 border border-border/20 hover:border-border/40 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{h.procedure}</span>
                              <Badge variant="outline" className="text-[9px] capitalize">{getStatusStyle(h.status).label}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{h.date}</span>
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{h.dentist}</span>
                            </div>
                            {h.notes && <p className="mt-1 text-muted-foreground/80 italic">"{h.notes}"</p>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditEntry(h)}><Edit2 className="h-3 w-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteEntry(h.id)} disabled={deleteEntry.isPending}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedData.history.length > 5 && (
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground" onClick={() => setShowAllHistory(!showAllHistory)}>
                        {showAllHistory ? <><ChevronUp className="h-3 w-3 mr-1" /> Show less</> : <><ChevronDown className="h-3 w-3 mr-1" /> Show all {selectedData.history.length} entries</>}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedTooth && patientId && (
        <AddProcedureDialog
          open={procedureOpen}
          onOpenChange={setProcedureOpen}
          toothNumber={selectedTooth}
          currentStatus={(selectedData?.status || "healthy") as any}
          patientId={patientId}
          editEntry={editEntry}
        />
      )}
      </>
      )}
    </div>
  );
}
