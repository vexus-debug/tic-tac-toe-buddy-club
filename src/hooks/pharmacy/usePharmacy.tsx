import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

export interface PharmacyDrug {
  id: string; org_id: string; name: string; generic_name: string | null; form: string | null;
  strength: string | null; batch_number: string | null; expiry_date: string | null;
  unit_price: number; stock_quantity: number; reorder_level: number; is_active: boolean;
}

export interface DispenseItem {
  drug_id?: string | null; drug_name: string; quantity: number; unit_price: number; total: number;
}

function toasts(qc: ReturnType<typeof useQueryClient>, keys: string[], msg: string) {
  return {
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast({ title: msg });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  };
}

export function usePharmacyDrugs() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["pharmacy_drugs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("pharmacy_drugs").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data || []) as PharmacyDrug[];
    },
  });
}

export function useSaveDrug() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: Partial<PharmacyDrug>) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await db.from("pharmacy_drugs").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await db.from("pharmacy_drugs").insert({ ...input, org_id: currentOrg?.org_id });
        if (error) throw error;
      }
    },
    ...toasts(qc, ["pharmacy_drugs"], "Drug saved"),
  });
}

export function useDeleteDrug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("pharmacy_drugs").delete().eq("id", id);
      if (error) throw error;
    },
    ...toasts(qc, ["pharmacy_drugs"], "Drug removed"),
  });
}

export function useDispenses() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["pharmacy_dispenses", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("pharmacy_dispenses")
        .select("*, pharmacy_dispense_items(*)")
        .eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useCreateDispense() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      patient_name: string; patient_id?: string | null; notes?: string;
      items: DispenseItem[]; createInvoice?: boolean;
    }) => {
      const orgId = currentOrg?.org_id;
      const { data: user } = await supabase.auth.getUser();
      const total = input.items.reduce((s, i) => s + Number(i.total || 0), 0);

      let invoiceId: string | null = null;
      if (input.createInvoice && total > 0) {
        const { data: inv, error: invErr } = await db.from("invoices").insert({
          org_id: orgId, patient_id: input.patient_id || null,
          invoice_number: `PH-${Date.now().toString().slice(-8)}`,
          subtotal: total, total, status: "unpaid", notes: "Pharmacy dispense",
        }).select("id").single();
        if (!invErr) {
          invoiceId = inv.id;
          await db.from("invoice_items").insert(
            input.items.map((i) => ({
              org_id: orgId, invoice_id: inv.id, description: i.drug_name,
              quantity: i.quantity, unit_price: i.unit_price, total: i.total,
            }))
          );
        }
      }

      const { data: disp, error } = await db.from("pharmacy_dispenses").insert({
        org_id: orgId, patient_name: input.patient_name, patient_id: input.patient_id || null,
        notes: input.notes || null, total_amount: total, invoice_id: invoiceId,
        dispensed_by: user?.user?.id || null,
      }).select("id").single();
      if (error) throw error;

      const { error: itemErr } = await db.from("pharmacy_dispense_items").insert(
        input.items.map((i) => ({
          org_id: orgId, dispense_id: disp.id, drug_id: i.drug_id || null,
          drug_name: i.drug_name, quantity: i.quantity, unit_price: i.unit_price, total: i.total,
        }))
      );
      if (itemErr) throw itemErr;

      // Decrement stock
      for (const i of input.items) {
        if (!i.drug_id) continue;
        const { data: drug } = await db.from("pharmacy_drugs").select("stock_quantity").eq("id", i.drug_id).maybeSingle();
        if (drug) {
          await db.from("pharmacy_drugs")
            .update({ stock_quantity: Math.max(0, Number(drug.stock_quantity) - Number(i.quantity)) })
            .eq("id", i.drug_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacy_dispenses"] });
      qc.invalidateQueries({ queryKey: ["pharmacy_drugs"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Dispensed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
