import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

import { usePatients } from "@/hooks/usePatients";
import { useDentists } from "@/hooks/useStaff";
import { useCreateLabCase } from "@/hooks/useLabCases";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { useAuth } from "@/hooks/useAuth";
import { usePatientVisits } from "@/hooks/usePatientProfile";
import { pickDefaultDentist, latestClinicalNote } from "@/lib/labCasePrefill";

const JOB_INSTRUCTION_OPTIONS = [
  "Courier Charge",
  "Acrylic Dentures",
  "Flexible Dentures",
  "AJC Crowns",
  "PFM Crowns",
  "Zirconia Crowns",
  "Shell Crowns (Gold)",
  "Shell Crowns (Silver)",
  "VFR",
  "Orthodontic Appliances",
  "Denture Repair",
  "Crown Repair",
  "Gingival Masking",
] as const;

const REMARK_OPTIONS = ["Express", "Rejected", "Damaged", "Repeat", "Remake"] as const;

const labCaseSchema = z
  .object({
    clientType: z.enum(["internal", "external"]).default("internal"),
    // In-house work
    patientId: z.string().optional(),
    dentistId: z.string().optional(),
    // Outside work sent in by another clinic / dentist
    externalClientName: z.string().optional(),
    externalContactPerson: z.string().optional(),
    externalClientPhone: z.string().optional(),
    externalClientEmail: z.string().optional(),
    externalPatientName: z.string().optional(),
    jobInstructions: z.array(z.string()).min(1, "Select at least one"),
    cost: z.coerce.number().min(0, "Must be >= 0"),
    dueDate: z.date({ required_error: "Select delivery date" }),
    urgency: z.enum(["normal", "urgent"]).default("normal"),
    // Optional extras (hidden until "More details" is opened)
    clinicCode: z.string().optional(),
    jobDescription: z.string().optional(),
    shade: z.string().optional(),
    discount: z.coerce.number().min(0).default(0),
    isPaid: z.boolean().default(false),
    remark: z.string().optional(),
    instructions: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.clientType === "internal") {
      if (!data.patientId) ctx.addIssue({ code: "custom", path: ["patientId"], message: "Select a patient" });
      if (!data.dentistId) ctx.addIssue({ code: "custom", path: ["dentistId"], message: "Select a clinician" });
    } else {
      if (!data.externalClientName)
        ctx.addIssue({ code: "custom", path: ["externalClientName"], message: "Enter the clinic or dentist name" });
      if (!data.externalPatientName)
        ctx.addIssue({ code: "custom", path: ["externalPatientName"], message: "Enter the patient name / case reference" });
    }
  });

type LabCaseFormValues = z.infer<typeof labCaseSchema>;

interface CreateLabCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
  /** Carried over from the chart/plan so the lab ticket isn't re-typed. */
  preselectedTooth?: string;
  preselectedShade?: string;
  preselectedWork?: string;
}

const emptyValues = (patientId?: string): LabCaseFormValues => ({
  clientType: "internal",
  patientId: patientId || "",
  dentistId: "",
  externalClientName: "",
  externalContactPerson: "",
  externalClientPhone: "",
  externalClientEmail: "",
  externalPatientName: "",
  jobInstructions: [],
  cost: 0,
  dueDate: undefined as unknown as Date,
  urgency: "normal",
  clinicCode: "",
  jobDescription: "",
  shade: "",
  discount: 0,
  isPaid: false,
  remark: "none",
  instructions: "",
});

export function CreateLabCaseDialog({ open, onOpenChange, preselectedPatientId, preselectedTooth, preselectedShade, preselectedWork }: CreateLabCaseDialogProps) {
  const { user } = useAuth();
  const terms = useClinicTerms();
  const { data: patients = [] } = usePatients();
  const { data: dentists = [] } = useDentists();
  const { data: visits = [] } = usePatientVisits(preselectedPatientId);
  const createLabCase = useCreateLabCase();
  const [showMore, setShowMore] = useState(false);

  const form = useForm<LabCaseFormValues>({
    resolver: zodResolver(labCaseSchema),
    defaultValues: emptyValues(preselectedPatientId),
  });

  const clientType = form.watch("clientType");

  // Carry the patient chosen elsewhere (e.g. their own page) into this form
  useEffect(() => {
    if (!open) return;
    const v = emptyValues(preselectedPatientId);
    // Signed-in dentist first; otherwise the patient's most recent attending dentist.
    v.dentistId = pickDefaultDentist(dentists as any[], user?.id, visits as any[]);
    if (preselectedTooth) v.jobDescription = `Tooth #${preselectedTooth}${preselectedWork ? ` — ${preselectedWork}` : ""}`;
    if (preselectedShade) v.shade = preselectedShade;
    const note = latestClinicalNote(visits as any[]);
    if (note) v.instructions = `Clinical note: ${note}`;
    const known = (JOB_INSTRUCTION_OPTIONS as readonly string[]).find((j) => preselectedWork && j.toLowerCase().includes(preselectedWork.toLowerCase().split(" ")[0]));
    if (known) v.jobInstructions = [known];
    form.reset(v);
    setShowMore(!!(preselectedTooth || preselectedShade || note));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedPatientId, preselectedTooth, preselectedShade, dentists.length, visits.length]);

  function onSubmit(data: LabCaseFormValues) {
    const workType = data.jobInstructions.join(", ");
    const isExternal = data.clientType === "external";
    // The doctor's name comes from the chosen clinician — no need to type it again
    const doctorName = isExternal
      ? data.externalContactPerson || data.externalClientName || ""
      : dentists.find((d) => d.id === data.dentistId)?.full_name || "";
    createLabCase.mutate(
      {
        client_type: data.clientType,
        patient_id: isExternal ? null : data.patientId,
        dentist_id: isExternal ? null : data.dentistId,
        external_client_name: isExternal ? data.externalClientName || "" : null,
        external_contact_person: isExternal ? data.externalContactPerson || "" : null,
        external_client_phone: isExternal ? data.externalClientPhone || "" : null,
        external_client_email: isExternal ? data.externalClientEmail || "" : null,
        external_patient_name: isExternal ? data.externalPatientName || "" : null,
        work_type: workType,
        clinic_code: data.clinicCode || "",
        clinic_doctor_name: doctorName,
        job_instructions: data.jobInstructions,
        job_description: data.jobDescription || "",
        shade: data.shade || "",
        lab_fee: data.cost,
        discount: data.discount,
        due_date: format(data.dueDate, "yyyy-MM-dd"),
        urgency: data.urgency,
        is_urgent: data.urgency === "urgent",
        is_paid: data.isPaid,
        remark: data.remark === "none" ? "" : (data.remark || ""),
        instructions: data.instructions || "",
      },
      {
        onSuccess: () => {
          form.reset(emptyValues());
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Lab Case</DialogTitle>
          <DialogDescription>Five details are all that's needed — the rest is optional.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Where the work comes from */}
            <FormField control={form.control} name="clientType" render={({ field }) => (
              <FormItem>
                <FormLabel>Who is this work for?</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={field.value === "internal" ? "default" : "outline"}
                    onClick={() => field.onChange("internal")}
                  >
                    Our own patient
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "external" ? "default" : "outline"}
                    onClick={() => field.onChange("external")}
                  >
                    Outside client
                  </Button>
                </div>
              </FormItem>
            )} />

            {clientType === "internal" ? (
              /* Patient & Clinician */
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField control={form.control} name="patientId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dentistId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{terms.clinician} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={`Select ${terms.clinician.toLowerCase()}`} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dentists.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            ) : (
              /* Outside clinic / dentist sending work to our lab */
              <div className="space-y-3 rounded-lg border p-3 bg-muted/10">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField control={form.control} name="externalClientName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic / Dentist *</FormLabel>
                      <FormControl><Input placeholder="e.g. Bright Smile Dental" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="externalPatientName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient name / reference *</FormLabel>
                      <FormControl><Input placeholder="e.g. Mr A. Bello" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField control={form.control} name="externalContactPerson" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact person</FormLabel>
                      <FormControl><Input placeholder="Dr. Name" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="externalClientPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="080..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="externalClientEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="name@clinic.com" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

            {/* Job Instructions */}
            <FormField control={form.control} name="jobInstructions" render={() => (
              <FormItem>
                <FormLabel>Job Instructions *</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/20">
                  {JOB_INSTRUCTION_OPTIONS.map((option) => (
                    <FormField
                      key={option}
                      control={form.control}
                      name="jobInstructions"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                field.onChange(
                                  checked ? [...current, option] : current.filter((v: string) => v !== option)
                                );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-xs font-normal cursor-pointer">{option}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Cost & Delivery date */}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (₦) *</FormLabel>
                  <FormControl><Input type="number" min={0} step={100} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Delivery Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Urgency */}
            <FormField control={form.control} name="urgency" render={({ field }) => (
              <FormItem>
                <FormLabel>Urgency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select urgency" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />


            <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setShowMore((s) => !s)}>
              <ChevronDown className={cn("mr-1.5 h-4 w-4 transition-transform", showMore && "rotate-180")} />
              {showMore ? "Hide extra details" : "More details (optional)"}
            </Button>

            {showMore && (
              <div className="space-y-4 rounded-lg border p-3 bg-muted/10">
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField control={form.control} name="clinicCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic Code</FormLabel>
                      <FormControl><Input placeholder="e.g. VC-001" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="shade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shade</FormLabel>
                      <FormControl><Input placeholder="e.g. A2, B1" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="discount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (₦)</FormLabel>
                      <FormControl><Input type="number" min={0} step={100} {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="jobDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl><Textarea placeholder="Additional job details..." rows={2} {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="remark" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remark</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select remark" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {REMARK_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="isPaid" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="text-sm font-medium">Payment Status</FormLabel>
                      <p className="text-xs text-muted-foreground">{field.value ? "Paid" : "Unpaid"}</p>
                    </div>
                  </FormItem>
                )} />

                <FormField control={form.control} name="instructions" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions</FormLabel>
                    <FormControl><Textarea placeholder="Additional notes..." rows={2} {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-secondary hover:bg-secondary/90" disabled={createLabCase.isPending}>
                {createLabCase.isPending ? "Creating..." : "Register Lab Case"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
