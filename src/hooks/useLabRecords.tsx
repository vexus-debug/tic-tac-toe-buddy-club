import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface LabRecord {
  id: string;
  kind: string;
  title: string;
  status: string;
  amount: number;
  record_date: string | null;
  data: Record<string, any>;
  created_at: string;
}

export function useLabRecords(kind: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab_records", orgId, kind],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lab_records").select("*").eq("org_id", orgId).eq("kind", kind)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LabRecord[];
    },
  });
}

export function useSaveLabRecord(kind: string) {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (rec: Partial<LabRecord>) => {
      const payload = { title: rec.title, status: rec.status, amount: rec.amount ?? 0, record_date: rec.record_date || null, data: rec.data ?? {} };
      const q = rec.id
        ? (supabase as any).from("lab_records").update(payload).eq("id", rec.id)
        : (supabase as any).from("lab_records").insert({ ...payload, kind, org_id: currentOrg?.org_id });
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_records"] }); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteLabRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("lab_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_records"] }); toast({ title: "Removed" }); },
    onError: (e: any) => toast({ title: "Could not remove", description: e.message, variant: "destructive" }),
  });
}
