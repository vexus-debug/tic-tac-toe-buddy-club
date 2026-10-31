import { isInvoiced } from "@/hooks/useVisitFlow";
import { useState, useEffect } from "react";
import { usePatientContext } from "@/hooks/usePatientContext";
import { PatientVisitBar } from "@/components/dashboard/PatientVisitBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Pencil, Trash2, Stethoscope, ClipboardList, CheckCircle2, Clock, Eye, CalendarDays } from "lucide-react";
import { useTreatments, useDeleteTreatment, type Treatment } from "@/hooks/useTreatments";
import { useTreatmentPlans, useCreateTreatmentPlan } from "@/hooks/useTreatmentPlans";
import { usePatients } from "@/hooks/usePatients";
import { TreatmentDialog } from "@/components/dashboard/TreatmentDialog";
import { TreatmentPlanDetail, SurfacePicker, PHASES } from "@/components/dashboard/TreatmentPlanDetail";
import { useOrg } from "@/hooks/useOrg";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useClinicTerms } from "@/hooks/useClinicTerms";

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const planStatusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const itemStatusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "in-progress": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  skipped: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function TreatmentsPage() {
  const terms = useClinicTerms();
  const [search, setSearch] = useState("");
  const { data: treatments = [], isLoading } = useTreatments();
  const deleteTreatment = useDeleteTreatment();
  const { currentOrg } = useOrg();
  const orgRole = currentOrg?.role || "";
  const isAdmin = orgRole === "owner" || orgRole === "admin";
  const canEditCatalog = isAdmin || orgRole === "dentist";
  const isClinical = isAdmin || orgRole === "dentist" || orgRole === "hygienist";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);

  // Treatment Plans state
  const { data: plans = [] } = useTreatmentPlans();
  const { data: patients = [] } = usePatients();
  const createPlan = useCreateTreatmentPlan();
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [viewPlanId, setViewPlanId] = useState<string | null>(null);
  const [planSearch, setPlanSearch] = useState("");

  const emptyPlanForm = (patientId = "") => ({
    patient_id: patientId,
    plan_name: "",
    description: "",
    priority: "normal",
    start_date: format(new Date(), "yyyy-MM-dd"),
    target_end_date: "",
    insurer_name: "",
    coverage_percent: 0,
  });
  const [planForm, setPlanForm] = useState(emptyPlanForm());
  type PlanLine = { treatment_id: string; cdt_code: string; description: string; tooth_number: string; surfaces: string; phase: number; visit_number: number; estimated_cost: number; scheduled_date: string; notes: string };
  const [planLineItems, setPlanLineItems] = useState<PlanLine[]>([]);

  const filtered = treatments.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(treatments.map((t) => t.category))];

  const filteredPlans = plans.filter((p) =>
    p.plan_name.toLowerCase().includes(planSearch.toLowerCase()) ||
    p.patient_name.toLowerCase().includes(planSearch.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deleteTreatment.mutateAsync(id);
  };

  // New procedures default to Phase 1 (urgent / disease control); clinicians can change it.
  const addPlanItem = () => setPlanLineItems((items) => [...items, { treatment_id: "", cdt_code: "", description: "", tooth_number: "", surfaces: "", phase: 1, visit_number: items.length + 1, estimated_cost: 0, scheduled_date: "", notes: "" }]);

  const updatePlanLineItem = (index: number, field: keyof PlanLine, value: any) => {
    setPlanLineItems((items) => items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === "treatment_id") {
        const t = treatments.find((tr) => tr.id === value);
        if (t) {
          updated.description = t.name;
          updated.estimated_cost = Number(t.price || 0);
          updated.cdt_code = t.cdt_code || "";
        }
      }
      return updated;
    }));
  };

  const handleCreatePlan = () => {
    if (!planForm.patient_id || !planForm.plan_name || planLineItems.length === 0) return;
    createPlan.mutate({
      patient_id: planForm.patient_id,
      plan_name: planForm.plan_name,
      description: planForm.description,
      priority: planForm.priority,
      start_date: planForm.start_date,
      target_end_date: planForm.target_end_date || undefined,
      insurer_name: planForm.insurer_name.trim() || undefined,
      coverage_percent: planForm.coverage_percent,
      items: planLineItems.map((i) => ({
        treatment_id: i.treatment_id || undefined,
        description: i.description,
        tooth_number: i.tooth_number || undefined,
        surfaces: i.surfaces || undefined,
        phase: i.phase || 1,
        cdt_code: i.cdt_code || undefined,
        visit_number: i.visit_number,
        estimated_cost: i.estimated_cost,
        scheduled_date: i.scheduled_date || undefined,
        notes: i.notes || undefined,
      })),
    }, {
      onSuccess: () => {
        setCreatePlanOpen(false);
        setPlanForm(emptyPlanForm(ctxPatientId || ""));
        setPlanLineItems([]);
      },
    });
  };

  const viewingPlan = plans.find((p) => p.id === viewPlanId);

  // Patient locked in the URL: open plans tab, show only their plans, prefill new plan.
  const { patientId: ctxPatientId, setPatientId: setCtxPatient, searchParams } = usePatientContext();
  const [tab, setTab] = useState(searchParams.get("tab") === "plans" || ctxPatientId ? "plans" : "catalog");
  useEffect(() => {
    if (ctxPatientId) {
      setTab("plans");
      setPlanForm((f) => ({ ...f, patient_id: ctxPatientId }));
    }
  }, [ctxPatientId]);
  const visiblePlans = ctxPatientId ? filteredPlans.filter((p) => p.patient_id === ctxPatientId) : filteredPlans;

  return (
    <div className="space-y-6">
      {ctxPatientId && <PatientVisitBar patientId={ctxPatientId} onClear={() => setCtxPatient("")} />}
      <PageHeader
        title="Treatments & Procedures"
        description="Treatment catalog and patient treatment plans"
        tutorial={{
          title: "Treatments — How to Use",
          description: "Manage your treatment catalog and create detailed treatment plans for patients.",
          steps: [
            {
              title: "Treatment Catalog tab",
              description: "The Catalog tab lists all services your clinic offers — check-ups, fillings, crowns, etc. Each shows its price, duration, and category. This is what gets added to invoices and appointments.",
              tip: "Keep your catalog up to date. Any treatment listed here can be linked to appointments and invoices.",
            },
            {
              title: "Add a new treatment type",
              description: "In the Catalog tab, click 'Add Treatment'. Enter the treatment name, category (e.g. Restorative, Cosmetic), price, and estimated duration. Save to make it available system-wide.",
            },
            {
              title: "Treatment Plans tab",
              description: "Switch to the 'Treatment Plans' tab to see multi-session plans created for specific patients. A plan groups multiple treatments that need to be done over several visits.",
            },
            {
              title: "Create a treatment plan",
              description: "Click 'New Plan', select the patient, then add the individual treatments in the order they should be done. Set a total price and expected start date.",
            },
            {
              title: "Track plan progress",
              description: "Each treatment in a plan has its own status: Pending → Scheduled → In Progress → Completed. Update these as the patient progresses through their plan. The progress bar shows overall completion.",
            },
            {
              title: "Link plans to invoices",
              description: "Once treatments in a plan are completed, go to Billing to create an invoice and link the relevant treatment items for accurate billing.",
            },
          ],
          nextPageHint: {
            label: "Billing & Payments",
            description: "After completing treatments, create an invoice on the Billing page linked to the treatments performed.",
          },
        }}
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/50" data-tour="treatments-tabs">
          <TabsTrigger value="catalog" className="gap-2"><Stethoscope className="h-4 w-4" /> Catalog</TabsTrigger>
          <TabsTrigger value="plans" className="gap-2"><ClipboardList className="h-4 w-4" /> Treatment Plans</TabsTrigger>
        </TabsList>

        {/* ===== CATALOG TAB ===== */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1" data-tour="treatments-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search treatments..." className="pl-9 bg-muted/30 border-border/40" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {canEditCatalog && (
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => { setEditTreatment(null); setDialogOpen(true); }} data-tour="treatments-add-treatment">
                <Plus className="mr-2 h-4 w-4" /> Add Treatment
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass-card"><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-full" /><Skeleton className="h-4 w-20" /></CardContent></Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No treatments found" description="Add treatments to your catalog to start managing procedures and pricing." actionLabel="Add Treatment" onAction={() => { setEditTreatment(null); setDialogOpen(true); }} />
          ) : (
            <div data-tour="treatments-catalog-list">
            {categories.map((cat) => {
              const catTreatments = filtered.filter((t) => t.category === cat);
              if (catTreatments.length === 0) return null;
              return (
                <div key={cat}>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
                  <motion.div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" variants={stagger.container} initial="hidden" animate="visible">
                    {catTreatments.map((t) => (
                      <motion.div key={t.id} variants={stagger.item}>
                        <Card
                          className={`glass-card hover:shadow-lg transition-all duration-300 group hover:border-primary/30 ${canEditCatalog ? "cursor-pointer active:scale-[0.99]" : ""}`}
                          onClick={canEditCatalog ? () => { setEditTreatment(t); setDialogOpen(true); } : undefined}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {t.cdt_code && <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted text-foreground">{t.cdt_code}</span>}
                                  <p className="font-medium text-sm text-foreground">{t.name}</p>
                                </div>
                                {t.patient_name && <p className="text-xs text-foreground/80 mt-0.5">“{t.patient_name}”</p>}
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                              </div>
                              {canEditCatalog && (
                                <div className="flex gap-1 shrink-0 opacity-100 md:opacity-60 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Edit treatment" onClick={() => { setEditTreatment(t); setDialogOpen(true); }}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  {isAdmin && (
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" aria-label="Delete treatment" onClick={() => handleDelete(t.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30 gap-2">
                              <span className="text-base font-bold text-foreground tabular-nums">₦{t.price.toLocaleString()}</span>
                              <span className="text-[10px] text-muted-foreground font-mono text-right">
                                {t.site_scope ? ({ mouth: "Whole mouth", quadrant: "Quadrant", tooth: "Per tooth", surface: "Per surface" } as Record<string, string>)[t.site_scope] + " · " : ""}{t.duration}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              );
            })}
            </div>
          )}
        </TabsContent>

        {/* ===== TREATMENT PLANS TAB ===== */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1" data-tour="treatments-plan-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search plans..." className="pl-9 bg-muted/30 border-border/40" value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} />
            </div>
            {isClinical && (
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => { setCreatePlanOpen(true); if (planLineItems.length === 0) addPlanItem(); }} data-tour="treatments-new-plan">
                <Plus className="mr-2 h-4 w-4" /> New Treatment Plan
              </Button>
            )}
          </div>

          {visiblePlans.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No treatment plans" description="Create a treatment plan to organize multi-visit procedures for patients." actionLabel="New Treatment Plan" onAction={() => { setCreatePlanOpen(true); if (planLineItems.length === 0) addPlanItem(); }} />
          ) : (
            <motion.div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" variants={stagger.container} initial="hidden" animate="visible" data-tour="treatments-plans-list">
              {visiblePlans.map((plan) => {
                const progress = plan.items_count > 0 ? Math.round((plan.completed_count / plan.items_count) * 100) : 0;
                return (
                  <motion.div key={plan.id} variants={stagger.item}>
                    <Card className="glass-card hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 group hover:border-secondary/20 cursor-pointer" onClick={() => setViewPlanId(plan.id)}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm group-hover:text-secondary transition-colors">{plan.plan_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{plan.patient_name}</p>
                          </div>
                          <Badge className={`text-[10px] ${planStatusStyles[plan.status] || ""}`}>{plan.status}</Badge>
                        </div>
                        {plan.description && <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{plan.completed_count}/{plan.items_count} visits completed</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/30">
                          <span className="text-sm font-bold text-secondary">{formatCurrency(plan.total_estimated_cost)}</span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {plan.start_date || "No date"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      <TreatmentDialog treatment={editTreatment} open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* ===== CREATE PLAN DIALOG ===== */}
      <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-card/95 max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Treatment Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Patient *</Label>
                <Select value={planForm.patient_id} onValueChange={(v) => setPlanForm((f) => ({ ...f, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {(patients as any[]).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plan Name *</Label>
                <Input value={planForm.plan_name} onChange={(e) => setPlanForm((f) => ({ ...f, plan_name: e.target.value }))} placeholder="e.g. Full mouth restoration" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select value={planForm.priority} onValueChange={(v) => setPlanForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={planForm.start_date} onChange={(e) => setPlanForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target End Date</Label>
                <Input type="date" value={planForm.target_end_date} onChange={(e) => setPlanForm((f) => ({ ...f, target_end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Insurance provider (optional)</Label>
                <Input value={planForm.insurer_name} onChange={(e) => setPlanForm((f) => ({ ...f, insurer_name: e.target.value }))} placeholder="e.g. AXA Mansard HMO" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Coverage %</Label>
                <Input type="number" min={0} max={100} value={planForm.coverage_percent} onChange={(e) => setPlanForm((f) => ({ ...f, coverage_percent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea value={planForm.description} onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description of the treatment plan..." />
            </div>

            {/* Visits / Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Planned Visits</Label>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={addPlanItem}>
                  <Plus className="mr-1 h-3 w-3" /> Add Visit
                </Button>
              </div>
              {planLineItems.map((item, idx) => (
                <Card key={idx} className="bg-muted/20 border-border/30">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Visit {item.visit_number}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" aria-label="Remove visit" onClick={() => setPlanLineItems((items) => items.filter((_, i) => i !== idx))}>×</Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <Select value={item.treatment_id} onValueChange={(v) => updatePlanLineItem(idx, "treatment_id", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Treatment" /></SelectTrigger>
                          <SelectContent>
                            {treatments.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.cdt_code ? `${t.cdt_code} · ` : ""}{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-4">
                        <Select value={String(item.phase)} onValueChange={(v) => updatePlanLineItem(idx, "phase", Number(v))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(PHASES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-3">
                        <Input className="h-8 text-xs font-mono" placeholder="Code e.g. D2740" value={item.cdt_code} onChange={(e) => updatePlanLineItem(idx, "cdt_code", e.target.value.toUpperCase())} />
                      </div>
                      <div className="sm:col-span-3">
                        <Input className="h-8 text-xs" placeholder={terms.siteLabel} value={item.tooth_number} onChange={(e) => updatePlanLineItem(idx, "tooth_number", e.target.value)} />
                      </div>
                      <div className="sm:col-span-3">
                        <Input type="number" className="h-8 text-xs" placeholder="Cost" value={item.estimated_cost} onChange={(e) => updatePlanLineItem(idx, "estimated_cost", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="sm:col-span-6">
                        <Input type="date" className="h-8 text-xs" value={item.scheduled_date} onChange={(e) => updatePlanLineItem(idx, "scheduled_date", e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Surfaces</span>
                      <SurfacePicker value={item.surfaces} onChange={(v) => updatePlanLineItem(idx, "surfaces", v)} />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {planLineItems.length > 0 && (
                <div className="text-right text-sm font-bold pt-2 border-t border-border/30">
                  Estimated Total: {formatCurrency(planLineItems.reduce((s, i) => s + i.estimated_cost, 0))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePlanOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} className="bg-secondary hover:bg-secondary/90" disabled={createPlan.isPending || !planForm.patient_id || !planForm.plan_name || planLineItems.length === 0}>
              {createPlan.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW PLAN (phased detail) ===== */}
      <TreatmentPlanDetail
        plan={viewingPlan}
        treatments={treatments}
        open={!!viewPlanId}
        onOpenChange={(open) => { if (!open) setViewPlanId(null); }}
        canEdit={isClinical}
        canDelete={isAdmin}
        siteLabel={terms.siteLabel}
      />
    </div>
  );
}
