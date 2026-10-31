import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface DentistSchedule {
  id: string;
  org_id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_available: boolean;
  staff?: { full_name: string; role: string };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export { DAYS as DAY_NAMES };

export function useDentistSchedules(staffId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["dentist-schedules", orgId, staffId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("dentist_schedules")
        .select("*, staff:staff_id(full_name, role)")
        .eq("org_id", orgId)
        .order("day_of_week");
      if (staffId) q = q.eq("staff_id", staffId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DentistSchedule[];
    },
  });
}

export function useUpsertSchedule() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (schedule: { staff_id: string; day_of_week: number; start_time: string; end_time: string; break_start: string | null; break_end: string | null; is_available: boolean }) => {
      const { error } = await (supabase as any).from("dentist_schedules").upsert(
        { ...schedule, org_id: currentOrg?.org_id },
        { onConflict: "staff_id,day_of_week" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dentist-schedules"] });
      toast({ title: "Schedule saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
