import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Stethoscope } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { usePatients } from "@/hooks/usePatients";
import { useTreatments } from "@/hooks/useTreatments";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useStaff } from "@/hooks/useStaff";
import { DentalLineFieldsRow, CLINICAL_PROVIDER_ROLES } from "@/components/dashboard/DentalLineFieldsRow";

const paymentMethods = ["Cash", "Bank Transfer", "POS", "Card"];

const invoiceSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  lineItems: z.array(z.object({
    treatmentId: z.string().optional().default(""),
    quantity: z.coerce.number().min(1, "Min 1"),
    /** Set for lines carried in from a treatment plan (plan price wins over catalog price). */
    description: z.string().optional(),
    unitPrice: z.coerce.number().min(0).optional(),
    key: z.string().optional(),
    toothNumber: z.string().optional(),
    surfaces: z.string().optional(),
    cdtCode: z.string().optional(),
    providerId: z.string().optional(),
    secondaryProviderId: z.string().optional(),
    splitRatio: z.coerce.number().min(0).max(100).optional(),
  }).refine((l) => !!l.treatmentId || !!l.description?.trim(), { message: "Select a treatment", path: ["treatmentId"] })).min(1, "Add at least one item"),
  discount: z.coerce.number().min(0).max(100).optional(),
  paymentMethod: z.string().min(1, "Select payment method"),
  amountPaid: z.coerce.number().min(0).optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
  preselectedTreatmentIds?: string[];
  /** Pre-priced lines (e.g. plan items). `key` identifies each line back to the caller. */
  preselectedLines?: { key: string; treatmentId?: string | null; description: string; unitPrice: number; quantity?: number }[];
  /** Fires after the invoice is saved with the keys of preselected lines that were kept. */
  onCreated?: (keptKeys: string[]) => void;
}

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function CreateInvoiceDialog({ open, onOpenChange, preselectedPatientId, preselectedTreatmentIds, preselectedLines, onCreated }: CreateInvoiceDialogProps) {
  const { data: patients = [] } = usePatients();
  const { data: treatments = [] } = useTreatments();
  const createInvoice = useCreateInvoice();
  const { data: staff = [] } = useStaff();
  const providers = staff.filter((m) => CLINICAL_PROVIDER_ROLES.includes(String(m.role).toLowerCase()) && m.status !== "inactive");
  const [dentalOpen, setDentalOpen] = useState<Record<string, boolean>>({});

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: preselectedPatientId || "",
      lineItems: [{ treatmentId: "", quantity: 1 }],
      discount: 0,
      paymentMethod: "",
      amountPaid: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  // Carry the patient and the treatment already chosen elsewhere into this invoice
  useEffect(() => {
    if (!open) return;
    form.reset({
      patientId: preselectedPatientId || "",
      lineItems: [
        ...(preselectedLines || []).map((l) => ({ treatmentId: l.treatmentId || "", quantity: l.quantity || 1, description: l.description, unitPrice: l.unitPrice, key: l.key })),
        ...(preselectedTreatmentIds || []).map((id) => ({ treatmentId: id, quantity: 1 })),
      ].length
        ? [
            ...(preselectedLines || []).map((l) => ({ treatmentId: l.treatmentId || "", quantity: l.quantity || 1, description: l.description, unitPrice: l.unitPrice, key: l.key })),
            ...(preselectedTreatmentIds || []).map((id) => ({ treatmentId: id, quantity: 1 })),
          ]
        : [{ treatmentId: "", quantity: 1 }],
      discount: 0,
      paymentMethod: "",
      amountPaid: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedPatientId, JSON.stringify(preselectedTreatmentIds || []), JSON.stringify(preselectedLines || [])]);

  const watchedItems = form.watch("lineItems");
  const watchedDiscount = form.watch("discount") || 0;

  const unitOf = (item: { treatmentId?: string; unitPrice?: number }) =>
    item.unitPrice != null && !Number.isNaN(Number(item.unitPrice))
      ? Number(item.unitPrice)
      : Number(treatments.find((t) => t.id === item.treatmentId)?.price) || 0;
  const subtotal = watchedItems.reduce((sum, item) => sum + unitOf(item) * (item.quantity || 0), 0);

  const discountAmount = (subtotal * watchedDiscount) / 100;
  const total = subtotal - discountAmount;

  async function onSubmit(data: InvoiceForm) {
    const patient = patients.find((p) => p.id === data.patientId);
    const paid = data.amountPaid || 0;

    const lineItemsData = data.lineItems.map((li) => {
      const treatment = treatments.find((t) => t.id === li.treatmentId);
      const unitPrice = unitOf(li);
      return {
        treatment_id: li.treatmentId || null,
        description: li.description?.trim() || treatment?.name || "",
        quantity: li.quantity,
        unit_price: unitPrice,
        line_total: unitPrice * li.quantity,
        tooth_number: li.toothNumber,
        surfaces: li.surfaces,
        cdt_code: li.cdtCode,
        provider_id: li.providerId,
        secondary_provider_id: li.secondaryProviderId || null,
        split_ratio: li.splitRatio,
      };
    });

    try {
      await createInvoice.mutateAsync({
        patient_id: data.patientId,
        discount_percent: data.discount || 0,
        payment_method: data.paymentMethod,
        amount_paid: paid,
        line_items: lineItemsData,
      });
      const status = paid >= total ? "paid" : paid > 0 ? "partial" : "pending";
      toast({
        title: "Invoice created",
        description: `${formatCurrency(total)} for ${patient?.first_name} ${patient?.last_name} — ${status}`,
      });
      form.reset();
      onOpenChange(false);
      onCreated?.(data.lineItems.map((l) => l.key).filter(Boolean) as string[]);
    } catch (err: any) {
      toast({ title: "Error creating invoice", description: err.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>Generate a new patient invoice.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Patient */}
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

            {/* Line Items */}
            <div className="space-y-2">
              <FormLabel>Treatment Items *</FormLabel>
              {fields.map((field, index) => {
                const line = watchedItems[index] || ({} as any);
                const lineTotal = unitOf(line) * (line.quantity || 0);
                const isPlanLine = line.description !== undefined;

                return (
                  <div key={field.id} className="space-y-1.5">
                  <div className="flex items-end gap-2">
                    {isPlanLine ? (
                      <>
                        <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input placeholder="Description" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl><Input type="number" min={0} placeholder="Price ₦" {...field} value={field.value ?? ""} /></FormControl>
                          </FormItem>
                        )} />
                      </>
                    ) : (
                    <FormField control={form.control} name={`lineItems.${index}.treatmentId`} render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select treatment" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {treatments.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name} — {formatCurrency(Number(t.price))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    )}
                    <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input type="number" min={1} placeholder="Qty" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <span className="text-sm font-medium w-24 text-right pb-2">{formatCurrency(lineTotal)}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    <Button type="button" variant={dentalOpen[field.id] || line.toothNumber || line.cdtCode ? "secondary" : "ghost"} size="icon" className="h-9 w-9 shrink-0" title="Tooth, surfaces, code and provider (optional)" aria-label="Dental details" onClick={() => setDentalOpen((o) => ({ ...o, [field.id]: !o[field.id] }))}>
                      <Stethoscope className="h-4 w-4" />
                    </Button>
                  </div>
                  {(dentalOpen[field.id] || line.toothNumber || line.cdtCode || line.surfaces || line.providerId) && (
                    <DentalLineFieldsRow
                      providers={providers}
                      value={{ tooth_number: line.toothNumber, surfaces: line.surfaces, cdt_code: line.cdtCode, provider_id: line.providerId }}
                      onChange={(v) => {
                        form.setValue(`lineItems.${index}.toothNumber`, v.tooth_number ?? "");
                        form.setValue(`lineItems.${index}.surfaces`, v.surfaces ?? "");
                        form.setValue(`lineItems.${index}.cdtCode`, v.cdt_code ?? "");
                        form.setValue(`lineItems.${index}.providerId`, v.provider_id ?? "");
                      }}
                    />
                  )}
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ treatmentId: "", quantity: 1 })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
              </Button>
              {form.formState.errors.lineItems?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.lineItems.message}</p>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="discount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="amountPaid" render={({ field }) => (
              <FormItem>
                <FormLabel>Amount Paid (partial payment supported)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Invoice Summary */}
            <div className="rounded-lg border p-4 bg-muted/30 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {watchedDiscount > 0 && (
                <div className="flex justify-between text-destructive"><span>Discount ({watchedDiscount}%)</span><span>-{formatCurrency(discountAmount)}</span></div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
              <div className="flex justify-between text-muted-foreground">
                <span>Balance Due</span>
                <span>{formatCurrency(Math.max(0, total - (form.watch("amountPaid") || 0)))}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-secondary hover:bg-secondary/90" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
