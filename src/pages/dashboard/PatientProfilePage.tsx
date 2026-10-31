import { PageSkeleton } from "@/components/dashboard/PageSkeleton";
import { PatientImageThumb } from "@/components/dashboard/PatientImageThumb";
import { PatientAlertBanner } from "@/components/dashboard/PatientAlertBanner";
import { SmartSoapField } from "@/components/dashboard/SmartSoapField";
import { NoteLockControls } from "@/components/dashboard/NoteLockControls";
import { ChairsideEducationView } from "@/components/patient/ChairsideEducationView";
import { Presentation } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Phone, Mail, AlertTriangle, User, FileText, Pencil, Camera, Plus, Upload, MessageCircle, ExternalLink, Receipt, Pill, FlaskConical, Zap, Printer } from "lucide-react";
import {
  usePatientDetail, usePatientVisits, usePatientTreatmentPlans, usePatientInvoices, usePatientPrescriptions,
} from "@/hooks/usePatientProfile";
import { useClinicalNotes, useCreateClinicalNote } from "@/hooks/useClinicalNotes";
import { usePatientImages, useUploadPatientImage } from "@/hooks/usePatientImages";
import { usePatientConsentForms } from "@/hooks/useConsentForms";
import { usePatientDocuments, useUploadPatientDocument } from "@/hooks/useDocuments";
import { useDentalChartEntries } from "@/hooks/useDentalCharts";
import { EditPatientDialog } from "@/components/dashboard/EditPatientDialog";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { hasPageAccess } from "@/config/roleAccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeRecordsTab } from "@/components/dashboard/eye/EyeRecordsTab";
import { getClinicTerms } from "@/config/clinicTerminology";
import { CreateInvoiceDialog } from "@/components/dashboard/CreateInvoiceDialog";
import { InvoiceDetailDialog } from "@/components/dashboard/InvoiceDetailDialog";
import { CreatePrescriptionDialog } from "@/components/dashboard/CreatePrescriptionDialog";
import { CreateLabCaseDialog } from "@/components/dashboard/CreateLabCaseDialog";
import { PatientLabCasesSection, usePatientLabCases, isLabCaseActive } from "@/components/dashboard/PatientLabCasesSection";
import { toast } from "@/hooks/use-toast";
import { OfflineDentalHistorySection } from "@/components/dashboard/OfflineDentalHistorySection";
import { PatientOdontogram } from "@/components/dashboard/PatientOdontogram";
import { PerioChart } from "@/components/dashboard/PerioChart";
import { TreatmentOptionsPanel } from "@/components/dashboard/TreatmentOptionsPanel";
import { PHASES, procedurePhase } from "@/lib/dentalPhases";
import { useUpdatePlanItemStatus } from "@/hooks/useTreatmentPlans";
import { openPatientDocument } from "@/lib/documentUtils";
import { printPrescription } from "@/lib/printPrescription";
import { PatientVisitBar } from "@/components/dashboard/PatientVisitBar";
import { useActiveVisit } from "@/hooks/useActiveVisit";
import { useStartVisit } from "@/hooks/useVisitFlow";
import { useAddToWaitingList } from "@/hooks/useWaitingList";
import { BookAppointmentDialog } from "@/components/dashboard/BookAppointmentDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarPlus, UserCheck } from "lucide-react";
import { Grid3x3 as Grid3x3Icon, Stethoscope as StethoscopeIcon } from "lucide-react";

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
};

const visitNoteTemplates = [
  {
    label: "Routine check-up",
    note: {
      subjective: "Patient presents for routine dental check-up.",
      objective: "Oral examination completed. No acute findings noted.",
      assessment: "Routine examination; no urgent concerns identified.",
      plan: "Continue preventive care. Schedule next recall appointment.",
    },
  },
  {
    label: "Post-treatment review",
    note: {
      subjective: "Patient returns for a post-treatment review.",
      objective: "Treatment site reviewed. Healing and response assessed.",
      assessment: "Post-treatment review completed.",
      plan: "Continue home care instructions and return if symptoms worsen.",
    },
  },
  {
    label: "Pain assessment",
    note: {
      subjective: "Patient reports pain or sensitivity in the affected area.",
      objective: "Affected area examined; percussion, palpation, and soft tissue findings recorded.",
      assessment: "Pain source assessed during clinical examination.",
      plan: "Discussed treatment options, symptom management, and follow-up.",
    },
  },
] as const;

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function calculateAge(dob: string | null): string {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} years`;
}

export default function PatientProfilePage() {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { basePath, currentOrg } = useOrg();
  const orgRole = currentOrg?.role || "";
  const canViewContact = ["owner", "admin", "receptionist"].includes(orgRole);

  const [editOpen, setEditOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLines, setInvoiceLines] = useState<{ key: string; treatmentId?: string | null; description: string; unitPrice: number; quantity?: number }[] | undefined>(undefined);
  const [completeItem, setCompleteItem] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [labCaseOpen, setLabCaseOpen] = useState(false);
  const { cases: patientLabCases } = usePatientLabCases(patientId);
  const activeLabCount = patientLabCases.filter(isLabCaseActive).length;
  const [bookOpen, setBookOpen] = useState(false);
  const checkIn = useAddToWaitingList();
  const isFrontDesk = ["receptionist"].includes(orgRole);
  const { data: patientAppointments = [] } = useQuery({
    queryKey: ["patient-appointments", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("appointments")
        .select("id, appointment_date, appointment_time, status, chair, is_walk_in, staff(full_name), treatments(name)")
        .eq("patient_id", patientId).order("appointment_date", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [chairside, setChairside] = useState(false);
  const [noteForm, setNoteForm] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [imageForm, setImageForm] = useState(() => ({
    imageType: getClinicTerms(currentOrg?.clinic_type).defaultImageType,
    toothNumber: "",
    description: "",
  }));
  const [docForm, setDocForm] = useState({ title: "", category: "other", notes: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const filePickerOpenRef = useRef(false);
  // Tab persisted in the URL (?tab=documents) so a reload or the mobile
  // file-picker lifecycle can't bounce the user back to Overview.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "overview") next.delete("tab");
      else next.set("tab", tab);
      return next;
    }, { replace: true });
  };
  const uploadAction = searchParams.get("action");
  const imageDialogOpen = uploadAction === "upload-image";
  const docDialogOpen = uploadAction === "upload-document";
  const setUploadAction = (action: "upload-image" | "upload-document" | null) => {
    if (action === null && filePickerOpenRef.current) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (action) {
        next.set("action", action);
        next.set("tab", action === "upload-document" ? "documents" : "images");
      } else {
        next.delete("action");
      }
      return next;
    }, { replace: true });
  };

  const canViewClinical = roles.some(r => ["admin", "dentist", "hygienist"].includes(r)) || ["owner", "admin", "dentist", "hygienist"].includes(orgRole);
  const canEditClinical = roles.some(r => ["admin", "dentist", "hygienist"].includes(r)) || ["owner", "admin", "dentist", "hygienist"].includes(orgRole);
  const isEyeClinic = currentOrg?.clinic_type === "eye";
  const canBill = hasPageAccess(orgRole, "billing", currentOrg?.clinic_type);
  const terms = getClinicTerms(currentOrg?.clinic_type);

  const { data: patient, isLoading } = usePatientDetail(patientId);
  const { data: visits = [] } = usePatientVisits(patientId);
  const { data: plans = [] } = usePatientTreatmentPlans(patientId);
  const updateItemStatus = useUpdatePlanItemStatus();
  const { data: invoices = [] } = usePatientInvoices(patientId);
  const { data: prescriptions = [] } = usePatientPrescriptions(patientId);
  const { data: clinicalNotes = [] } = useClinicalNotes(patientId);
  const { data: images = [] } = usePatientImages(patientId);
  const { data: consentForms = [] } = usePatientConsentForms(patientId);
  const { data: documents = [] } = usePatientDocuments(patientId);
  const { data: dentalEntries = [] } = useDentalChartEntries(patientId);

  const createNote = useCreateClinicalNote();
  const activeVisit = useActiveVisit();
  const startVisit = useStartVisit();
  const uploadImage = useUploadPatientImage();
  const uploadDoc = useUploadPatientDocument();

  if (isLoading) {
    return <PageSkeleton variant="profile" />;
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button variant="outline" onClick={() => navigate(`${basePath}/patients`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Button>
      </div>
    );
  }

  const allergies = patient.allergies ? patient.allergies.split(",").map((a: string) => a.trim()).filter(Boolean) : [];
  const outstandingBalance = invoices.reduce((sum, inv: any) => sum + (Number(inv.total_amount) - Number(inv.amount_paid)), 0);

  if (chairside && patientId) {
    return (
      <ChairsideEducationView
        patientId={patientId}
        firstName={patient.first_name}
        showChart={!!terms.showDentalChart}
        plans={plans as any[]}
        images={images as any[]}
        onExit={() => setChairside(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {patientId && activeVisit?.patientId === patientId ? (
        <PatientVisitBar patientId={patientId} />
      ) : (
        patientId && canEditClinical && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2">
            <p className="text-sm text-muted-foreground mr-auto">Patient in the chair?</p>
            {terms.showDentalChart !== false && !isEyeClinic && (
              <Button size="sm" variant="outline" className="h-8" onClick={() => navigate(`${basePath}/dental-charts?patientId=${patientId}`)}>
                <Grid3x3Icon className="h-3.5 w-3.5 mr-1" /> Dental chart
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 bg-secondary hover:bg-secondary/90"
              disabled={startVisit.isPending}
              onClick={async () => {
                await startVisit.mutateAsync({ patient_id: patientId });
                navigate(`${basePath}/consent-forms?patientId=${patientId}&new=1`);
              }}
            >
              <StethoscopeIcon className="h-3.5 w-3.5 mr-1" /> Start visit
            </Button>
          </div>
        )
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/patients`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3" data-tour="patients-detail-header">
            <h1 className="text-2xl font-bold">{patient.first_name} {patient.last_name}</h1>
            <Badge variant={patient.status === "active" ? "default" : "secondary"} className={patient.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
              {patient.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {patient.gender} · Age: {calculateAge(patient.date_of_birth)} · ID: {patient.id?.slice(0, 8)} · Registered: {patient.registered_date}
          </p>
        </div>
        {canViewClinical && (
          <Button variant="outline" size="sm" onClick={() => setChairside(true)}>
            <Presentation className="mr-2 h-4 w-4" /> Chairside mode
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} data-tour="patients-detail-edit">
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {canBill && (
            <Button variant="outline" size="sm" onClick={() => setInvoiceOpen(true)}>
              <Receipt className="mr-2 h-4 w-4" /> Invoice
            </Button>
          )}
          <Button size="sm" disabled={checkIn.isPending} onClick={() => patientId && checkIn.mutate({ patient_id: patientId })}>
            <UserCheck className="mr-2 h-4 w-4" /> Check in
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBookOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Book appointment
          </Button>
          {!isFrontDesk && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPrescriptionOpen(true)}>
                <Pill className="mr-2 h-4 w-4" /> Prescription
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLabCaseOpen(true)}>
                <FlaskConical className="mr-2 h-4 w-4" /> Lab case
              </Button>
            </>
          )}
        </div>
        {canBill && outstandingBalance > 0 && (
          <div className="text-right" data-tour="patients-detail-balance">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(outstandingBalance)}</p>
          </div>
        )}
      </div>

      <PatientAlertBanner allergies={patient.allergies} medicalHistory={patient.medical_history} onEdit={() => setEditOpen(true)} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1" data-tour="patients-detail-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="history">{terms.historyTab}</TabsTrigger>
          <TabsTrigger value="plans">Treatment Plans</TabsTrigger>
          {canBill && <TabsTrigger value="billing">Billing</TabsTrigger>}
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          {canViewClinical && <TabsTrigger value="notes">Clinical Notes</TabsTrigger>}
          {canViewClinical && <TabsTrigger value="images">Images</TabsTrigger>}
          {isEyeClinic && <TabsTrigger value="eye">Eye Records</TabsTrigger>}
          {terms.showDentalChart && (
            <TabsTrigger value="lab">
              Lab Cases{activeLabCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{activeLabCount}</Badge>}
            </TabsTrigger>
          )}
          <TabsTrigger value="consents">Consents</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4" data-tour="patients-detail-overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth</span><span>{patient.date_of_birth || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{calculateAge(patient.date_of_birth)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Blood Group</span><span>{patient.blood_group || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Occupation</span><span>{(patient as any).occupation || "N/A"}</span></div>
                <div className="flex justify-between items-start"><span className="text-muted-foreground">Address</span><span className="text-right max-w-[200px]">{patient.address || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Registered</span><span>{patient.registered_date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Referral</span><span>{patient.referral_source || "N/A"}</span></div>
              </CardContent>
            </Card>

            {/* Contact & Emergency - only visible to admin/receptionist */}
            {canViewContact ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" /> Contact & Emergency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{patient.phone}</div>
                    <div className="flex items-center gap-1">
                      {patient.phone && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={`tel:${patient.phone}`} title="Call patient"><Phone className="h-3.5 w-3.5 text-primary" /></a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={`https://wa.me/${patient.phone.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp patient"><MessageCircle className="h-3.5 w-3.5 text-emerald-600" /></a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{patient.email || "N/A"}</div>
                    {patient.email && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={`mailto:${patient.email}`} title="Email patient"><ExternalLink className="h-3.5 w-3.5 text-primary" /></a>
                      </Button>
                    )}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Emergency Contact</p>
                    <p className="font-medium">{patient.emergency_contact_name || "N/A"}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">{patient.emergency_contact_phone || "N/A"}</p>
                      {patient.emergency_contact_phone && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                            <a href={`tel:${patient.emergency_contact_phone}`} title="Call emergency contact"><Phone className="h-3 w-3 text-primary" /></a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                            <a href={`https://wa.me/${patient.emergency_contact_phone.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp emergency"><MessageCircle className="h-3 w-3 text-emerald-600" /></a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground py-6 text-center">
                  Contact details are restricted to Admin and Receptionist roles.
                </CardContent>
              </Card>
            )}

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Medical History</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>{patient.medical_history || "No significant medical history"}</p>
                {allergies.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-700">Allergies</p>
                      <p className="text-xs text-red-600">{allergies.join(", ")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dental History */}
        <TabsContent value="history" className="mt-4 space-y-4">
          {terms.showDentalChart && patientId && <PatientOdontogram patientId={patientId} canEdit={canEditClinical} />}
          {terms.showDentalChart && patientId && <PerioChart patientId={patientId} canEdit={canEditClinical} />}
          {/* Dental Chart Summary */}
          {terms.showDentalChart && dentalEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dental Chart Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dentalEntries.slice(0, 10).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30">
                      <div>
                        <span className="font-semibold">Tooth #{e.tooth_number}</span>
                        <span className="text-muted-foreground ml-2">{e.procedure}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] capitalize">{e.condition || "healthy"}</Badge>
                        <span className="text-muted-foreground">{e.entry_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visit History</CardTitle>
              <CardDescription>{visits.length} recorded visits</CardDescription>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No visit history found.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {visits.map((v: any) => (
                    <div key={v.id} className="relative">
                      <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-secondary bg-background" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{v.treatment}</p>
                          <p className="text-xs text-muted-foreground">{v.dentist} · {v.date}</p>
                          <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>
                        </div>
                        <span className="text-sm font-medium shrink-0">{formatCurrency(v.cost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {patientId && (
            <OfflineDentalHistorySection
              patientId={patientId}
              canEdit={canEditClinical}
              clinicianLabel={terms.clinician}
              historyLabel={terms.historyTab}
            />
          )}
        </TabsContent>

        {/* Treatment Plans */}
        <TabsContent value="plans" className="mt-4 space-y-4">
          {patientId && (
            <TreatmentOptionsPanel basePath={basePath}
              plans={plans as any[]}
              orgId={currentOrg?.org_id}
              patientId={patientId}
              canEdit={canEditClinical}
              fmt={formatCurrency}
              busy={updateItemStatus.isPending}
              onToggleItem={(it, done) => done ? updateItemStatus.mutate({ id: it.id, status: "pending" }) : setCompleteItem(it)}
            />
          )}
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No invoices found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="py-2 px-4 text-left font-medium text-muted-foreground">Invoice</th>
                      <th className="py-2 px-4 text-left font-medium text-muted-foreground">Date</th>
                      <th className="py-2 px-4 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="py-2 px-4 text-left font-medium text-muted-foreground">Paid</th>
                      <th className="py-2 px-4 text-left font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr
                        key={inv.id}
                        className="border-b last:border-0 hover:bg-muted/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedInvoice({ ...inv, patient_name: `${patient.first_name} ${patient.last_name}` })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedInvoice({ ...inv, patient_name: `${patient.first_name} ${patient.last_name}` });
                          }
                        }}
                        aria-label={`View invoice ${inv.invoice_number}`}
                      >
                        <td className="py-2 px-4 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="py-2 px-4 text-muted-foreground">{inv.invoice_date}</td>
                        <td className="py-2 px-4 font-medium">{formatCurrency(Number(inv.total_amount))}</td>
                        <td className="py-2 px-4 text-muted-foreground">{formatCurrency(Number(inv.amount_paid))}</td>
                        <td className="py-2 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[inv.status] || ""}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions */}
        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Appointments & visits</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {patientAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments yet.</p>
              ) : patientAppointments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.appointment_date} · {a.appointment_time}{a.is_walk_in ? " · Walk-in" : ""}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.treatments?.name || "General"} · {a.staff?.full_name || "—"}{a.chair ? ` · ${a.chair}` : ""}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{String(a.status).replace("_", " ")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-4 space-y-4">
          {prescriptions.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No prescriptions found.</CardContent></Card>
          ) : prescriptions.map((rx: any) => (
            <Card key={rx.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{(rx.staff as any)?.full_name || "Unknown"}</CardTitle>
                    <CardDescription>{rx.prescription_date}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Print prescription"
                    onClick={() =>
                      printPrescription(
                        {
                          patientName: `${patient.first_name} ${patient.last_name}`,
                          clinicianName: (rx.staff as any)?.full_name || "Unknown",
                          id: rx.id, date: rx.prescription_date,
                          diagnosis: rx.diagnosis,
                          notes: rx.notes,
                          medications: (rx.prescription_medications || []).map((m: any) => ({
                            name: m.medication_name || m.name,
                            dosage: m.dosage,
                            frequency: m.frequency,
                            duration: m.duration, instructions: m.instructions,
                          })),
                        },
                        currentOrg?.org_name
                      )
                    }
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(rx.prescription_medications || []).map((med: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
                      <span className="h-5 w-5 rounded-full bg-secondary/20 text-secondary text-[10px] flex items-center justify-center font-medium shrink-0">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{med.medication_name || med.name}</p>
                        <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency} · {med.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {rx.notes && <p className="text-xs text-muted-foreground mt-3 italic">Note: {rx.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Clinical Notes (SOAP) - Dental Chart before Objective */}
        {canViewClinical && (
          <TabsContent value="notes" className="mt-4 space-y-4" data-tour="patients-detail-notes">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">SOAP Notes</h3>
              {canEditClinical && (
                <Button size="sm" variant="outline" onClick={() => setNoteDialogOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" /> Add Note
                </Button>
              )}
            </div>
            {clinicalNotes.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No clinical notes found.</CardContent></Card>
            ) : clinicalNotes.map((note: any) => (
              <Card key={note.id}>
                <CardContent className="py-4 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">{new Date(note.created_at).toLocaleDateString()}</p>

                  {/* S - Patient Complaint */}
                  {note.subjective && (
                    <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">S — Patient Complaint</span>
                      <p className="text-sm mt-1">{note.subjective}</p>
                    </div>
                  )}

                  {/* Dental Chart findings for this patient */}
                  {terms.showDentalChart && dentalEntries.length > 0 && (
                    <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Dental Chart</span>
                      <div className="mt-1 space-y-1">
                        {dentalEntries.slice(0, 5).map((e: any) => (
                          <p key={e.id} className="text-xs text-muted-foreground">
                            Tooth #{e.tooth_number}: {e.procedure} ({e.condition || "healthy"})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* O - Clinical Findings */}
                  {note.objective && (
                    <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">O — Clinical Findings</span>
                      <p className="text-sm mt-1">{note.objective}</p>
                    </div>
                  )}

                  {/* A - Diagnosis */}
                  {note.assessment && (
                    <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">A — Diagnosis</span>
                      <p className="text-sm mt-1">{note.assessment}</p>
                    </div>
                  )}

                  {/* P - Treatment Plan */}
                  {note.plan && (
                    <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <span className="text-xs font-bold text-red-700 dark:text-red-400">P — Treatment Plan</span>
                      <p className="text-sm mt-1">{note.plan}</p>
                    </div>
                  )}
                  <NoteLockControls note={note} canEdit={canEditClinical} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* Images */}
        {canViewClinical && (
          <TabsContent value="images" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">X-Rays & Photos</h3>
              {canEditClinical && (
                <Button type="button" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); setUploadAction("upload-image"); }}>
                  <Camera className="mr-1 h-3 w-3" /> Upload Image
                </Button>
              )}
            </div>
            {images.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No images uploaded.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img: any) => (
                  <Card key={img.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted">
                      <PatientImageThumb path={img.image_url} alt={img.description} />
                    </div>
                    <CardContent className="p-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{img.image_type}</Badge>
                      {img.description && <p className="text-xs text-muted-foreground mt-1 truncate">{img.description}</p>}
                      <p className="text-[10px] text-muted-foreground">{img.date_taken}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Eye Records */}
        {isEyeClinic && (
          <TabsContent value="eye" className="mt-4 space-y-4">
            {patientId && <EyeRecordsTab patientId={patientId} />}
          </TabsContent>
        )}

        {/* Consent Forms */}
        <TabsContent value="consents" className="mt-4 space-y-3">
          {consentForms.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No consent forms found.</CardContent></Card>
          ) : consentForms.map((cf: any) => (
            <Card key={cf.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{cf.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(cf.created_at).toLocaleDateString()}</p>
                </div>
                <Badge className={cf.status === "signed" ? "bg-emerald-100 text-emerald-700" : cf.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                  {cf.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Lab cases */}
        <TabsContent value="lab" className="mt-4">
          {patientId && (
            <PatientLabCasesSection
              patientId={patientId}
              onOrder={() => setLabCaseOpen(true)}
              onOpenCentral={(caseId) => navigate(`${basePath}/lab-work${caseId ? `?caseId=${caseId}` : ""}`)}
            />
          )}
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Patient Documents</h3>
            <Button type="button" size="sm" variant="outline" onClick={(e) => { e.preventDefault(); setUploadAction("upload-document"); }}>
              <Upload className="mr-1 h-3 w-3" /> Upload
            </Button>
          </div>
          {documents.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No documents uploaded.</CardContent></Card>
          ) : documents.map((doc: any) => (
            <Card key={doc.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <Badge variant="outline" className="text-[10px] capitalize mt-1">{doc.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                  <Button size="sm" variant="ghost" onClick={() => openPatientDocument(doc.file_url)}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <EditPatientDialog patient={patient} open={editOpen} onOpenChange={setEditOpen} />

      <CreateInvoiceDialog open={invoiceOpen} onOpenChange={(o) => { setInvoiceOpen(o); if (!o) setInvoiceLines(undefined); }} preselectedPatientId={patientId} preselectedLines={invoiceLines} />
      <Dialog open={!!completeItem} onOpenChange={(o) => { if (!o) setCompleteItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procedure completed</DialogTitle>
            <DialogDescription>
              {canBill
                ? <>Generate invoice for <span className="font-medium text-foreground">{completeItem?.description}{completeItem?.tooth_number ? ` (tooth ${completeItem.tooth_number})` : ""}</span> ({formatCurrency(Number(completeItem?.estimated_cost || 0))})?</>
                : <>Mark <span className="font-medium text-foreground">{completeItem?.description}</span> as done? Billing staff will invoice it.</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              const it = completeItem; setCompleteItem(null);
              if (it) updateItemStatus.mutate({ id: it.id, status: "completed" });
            }}>Mark done only</Button>
            {canBill && (
              <Button onClick={() => {
                const it = completeItem; setCompleteItem(null);
                if (!it) return;
                updateItemStatus.mutate({ id: it.id, status: "completed" });
                setInvoiceLines([{
                  key: it.id,
                  treatmentId: it.treatment_id ?? null,
                  description: it.tooth_number ? `${it.description} — tooth ${it.tooth_number}` : it.description,
                  unitPrice: Number(it.estimated_cost || 0),
                  quantity: 1,
                }]);
                setInvoiceOpen(true);
              }}>Generate invoice</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <InvoiceDetailDialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }} invoice={selectedInvoice} />
      <BookAppointmentDialog open={bookOpen} onOpenChange={setBookOpen} preselectedPatientId={patientId} />
      <CreatePrescriptionDialog open={prescriptionOpen} onOpenChange={setPrescriptionOpen} preselectedPatientId={patientId} />
      <CreateLabCaseDialog open={labCaseOpen} onOpenChange={setLabCaseOpen} preselectedPatientId={patientId} />

      {/* Clinical Note Dialog - Enhanced with complaint/diagnosis fields */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add SOAP Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Start from a template</Label>
              <div className="flex flex-wrap gap-2">
                {visitNoteTemplates.map((template) => (
                  <Button
                    key={template.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setNoteForm({ ...template.note })}
                  >
                    <Zap className="mr-1 h-3 w-3" /> {template.label}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">Tip: type a shortcut like <code>.endo-prep</code>, <code>.post-op</code> or <code>.scale</code> then space to fill it in. Tap the mic to dictate.</p>
            <div className="space-y-1"><Label className="text-xs font-semibold text-blue-700">S — Patient Complaint</Label><SmartSoapField value={noteForm.subjective} onChange={v => setNoteForm(f => ({ ...f, subjective: v }))} placeholder="Patient complaints, symptoms, chief concern..." /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-green-700">O — Clinical Findings</Label><SmartSoapField value={noteForm.objective} onChange={v => setNoteForm(f => ({ ...f, objective: v }))} placeholder={terms.showDentalChart ? "Clinical exam, vitals, dental chart findings..." : "Clinical exam, vitals, examination findings..."} /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-amber-700">A — Diagnosis</Label><SmartSoapField value={noteForm.assessment} onChange={v => setNoteForm(f => ({ ...f, assessment: v }))} placeholder="Diagnosis, differential diagnosis..." /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold text-red-700">P — Treatment Plan</Label><SmartSoapField value={noteForm.plan} onChange={v => setNoteForm(f => ({ ...f, plan: v }))} placeholder="Treatment plan, prescriptions, follow-up..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button className="bg-secondary hover:bg-secondary/90" disabled={createNote.isPending} onClick={() => {
              const safeNote = Object.fromEntries(Object.entries(noteForm).map(([key, value]) => [key, value.trim().slice(0, 2000)])) as typeof noteForm;
              if (!Object.values(safeNote).some(Boolean)) {
                toast({ title: "Add at least one note section", variant: "destructive" });
                return;
              }
              createNote.mutate({ patient_id: patientId!, ...safeNote, created_by: user?.id }, {
                onSuccess: () => { setNoteDialogOpen(false); setNoteForm({ subjective: "", objective: "", assessment: "", plan: "" }); },
              });
            }}>{createNote.isPending ? "Saving..." : "Save Note"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog - with supporting note */}
      <Dialog open={imageDialogOpen} onOpenChange={(open) => setUploadAction(open ? "upload-image" : null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Patient Image</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">File *</Label><Input
              type="file"
              accept="image/png,image/jpeg"
              onPointerDown={() => { filePickerOpenRef.current = true; }}
              onClick={() => { filePickerOpenRef.current = true; }}
              {...({ onCancel: () => { filePickerOpenRef.current = false; } } as Record<string, unknown>)}
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] || null);
                window.setTimeout(() => { filePickerOpenRef.current = false; }, 250);
              }}
            /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={imageForm.imageType} onValueChange={v => setImageForm(f => ({ ...f, imageType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {terms.imageTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {terms.showDentalChart && (
                <div className="space-y-1"><Label className="text-xs">{terms.siteLabel}</Label><Input type="number" value={imageForm.toothNumber} onChange={e => setImageForm(f => ({ ...f, toothNumber: e.target.value }))} /></div>
              )}
            </div>
            <div className="space-y-1"><Label className="text-xs">Supporting Note / Description</Label><Textarea value={imageForm.description} onChange={e => setImageForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe findings, context for this image..." /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setUploadAction(null); }}>Cancel</Button>
            <Button type="button" className="bg-secondary hover:bg-secondary/90" disabled={uploadImage.isPending || !selectedFile} onClick={(e) => {
              e.preventDefault();
              if (!selectedFile || !patientId) return;
              uploadImage.mutate({ file: selectedFile, patientId, imageType: imageForm.imageType, toothNumber: imageForm.toothNumber ? Number(imageForm.toothNumber) : undefined, description: imageForm.description, userId: user?.id }, {
                onSuccess: () => { setUploadAction(null); setSelectedFile(null); setImageForm({ imageType: terms.defaultImageType, toothNumber: "", description: "" }); },
              });
            }}>{uploadImage.isPending ? "Uploading..." : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={(open) => setUploadAction(open ? "upload-document" : null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Patient Document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">File *</Label><Input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onPointerDown={() => { filePickerOpenRef.current = true; }}
              onClick={() => { filePickerOpenRef.current = true; }}
              {...({ onCancel: () => { filePickerOpenRef.current = false; } } as Record<string, unknown>)}
              onChange={(e) => {
                setSelectedDocFile(e.target.files?.[0] || null);
                window.setTimeout(() => { filePickerOpenRef.current = false; }, 250);
              }}
            /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={docForm.title} onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={docForm.category} onValueChange={v => setDocForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="consent">Consent</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="scanned_consent">Scanned Consent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Input value={docForm.notes} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setUploadAction(null); }}>Cancel</Button>
            <Button type="button" className="bg-secondary hover:bg-secondary/90" disabled={uploadDoc.isPending || !selectedDocFile || !docForm.title} onClick={(e) => {
              e.preventDefault();
              if (!selectedDocFile || !patientId) return;
              uploadDoc.mutate({ file: selectedDocFile, patientId, title: docForm.title, category: docForm.category, notes: docForm.notes, userId: user?.id }, {
                onSuccess: () => { setUploadAction(null); setSelectedDocFile(null); setDocForm({ title: "", category: "other", notes: "" }); },
              });
            }}>{uploadDoc.isPending ? "Uploading..." : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
