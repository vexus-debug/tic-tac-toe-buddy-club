import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export function usePatientGrowthRate() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["analytics-patient-growth", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

      const [thisMonth, lastMonth] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("org_id", orgId!).gte("created_at", thisMonthStart),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("org_id", orgId!).gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
      ]);

      const current = thisMonth.count || 0;
      const previous = lastMonth.count || 0;
      const rate = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

      return { current, previous, rate: Math.round(rate) };
    },
  });
}

export function useAppointmentCompletionRate() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["analytics-completion-rate", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const [total, completed, noShow] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("org_id", orgId!).gte("appointment_date", monthStart).lte("appointment_date", monthEnd),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("org_id", orgId!).eq("status", "completed").gte("appointment_date", monthStart).lte("appointment_date", monthEnd),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("org_id", orgId!).eq("status", "cancelled").gte("appointment_date", monthStart).lte("appointment_date", monthEnd),
      ]);

      const totalCount = total.count || 0;
      const completedCount = completed.count || 0;
      const noShowCount = noShow.count || 0;

      return {
        total: totalCount,
        completed: completedCount,
        noShow: noShowCount,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        noShowRate: totalCount > 0 ? Math.round((noShowCount / totalCount) * 100) : 0,
      };
    },
  });
}

export function useAverageTreatmentValue() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["analytics-avg-treatment-value", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoice_items")
        .select("line_total, invoice_id, invoices!inner(org_id)")
        .eq("invoices.org_id", orgId!);

      if (!data || data.length === 0) return { average: 0, count: 0 };
      const total = data.reduce((sum, item) => sum + Number(item.line_total), 0);
      return { average: Math.round(total / data.length), count: data.length };
    },
  });
}

export function useChairUtilization() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["analytics-chair-utilization", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const [chairs, appointments] = await Promise.all([
        supabase.from("clinic_chairs").select("id, name").eq("org_id", orgId!),
        supabase.from("appointments").select("chair, id").eq("org_id", orgId!).gte("appointment_date", monthStart).lte("appointment_date", monthEnd),
      ]);

      const chairCount = chairs.data?.length || 3;
      const appointmentCount = appointments.data?.length || 0;
      // Assume ~8 slots per chair per working day, ~22 working days
      const totalSlots = chairCount * 8 * 22;
      const utilization = totalSlots > 0 ? Math.round((appointmentCount / totalSlots) * 100) : 0;

      // Per-chair breakdown
      const chairMap: Record<string, number> = {};
      (appointments.data || []).forEach((a) => {
        const chair = a.chair || "Unassigned";
        chairMap[chair] = (chairMap[chair] || 0) + 1;
      });

      return {
        overall: Math.min(utilization, 100),
        totalAppointments: appointmentCount,
        chairCount,
        perChair: Object.entries(chairMap).map(([name, count]) => ({
          name,
          count,
          utilization: Math.min(Math.round((count / (8 * 22)) * 100), 100),
        })),
      };
    },
  });
}

export function usePatientLifetimeValue() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["analytics-patient-ltv", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("patient_id, total")
        .eq("org_id", orgId!)
        .not("patient_id", "is", null);

      if (!invoices || invoices.length === 0) return { topPatients: [], averageLTV: 0 };

      const patientTotals: Record<string, number> = {};
      invoices.forEach((inv) => {
        if (inv.patient_id) {
          patientTotals[inv.patient_id] = (patientTotals[inv.patient_id] || 0) + Number(inv.total);
        }
      });

      const patientIds = Object.keys(patientTotals);
      const { data: patients } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .in("id", patientIds.slice(0, 50));

      const patientNameMap: Record<string, string> = {};
      (patients || []).forEach((p) => { patientNameMap[p.id] = `${p.first_name} ${p.last_name}`; });

      const sorted = Object.entries(patientTotals)
        .map(([id, total]) => ({ id, name: patientNameMap[id] || "Unknown", total }))
        .sort((a, b) => b.total - a.total);

      const allValues = Object.values(patientTotals);
      const averageLTV = allValues.length > 0 ? Math.round(allValues.reduce((s, v) => s + v, 0) / allValues.length) : 0;

      return { topPatients: sorted.slice(0, 10), averageLTV };
    },
  });
}

export function useMostProfitableTreatments() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["analytics-profitable-treatments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoice_items")
        .select("description, line_total, quantity, invoices!inner(org_id)")
        .eq("invoices.org_id", orgId!);

      if (!data || data.length === 0) return [];

      const treatmentRevenue: Record<string, { revenue: number; count: number }> = {};
      data.forEach((item) => {
        const name = item.description || "Unknown";
        if (!treatmentRevenue[name]) treatmentRevenue[name] = { revenue: 0, count: 0 };
        treatmentRevenue[name].revenue += Number(item.line_total);
        treatmentRevenue[name].count += Number(item.quantity);
      });

      return Object.entries(treatmentRevenue)
        .map(([name, { revenue, count }]) => ({ name, revenue, count, avgValue: Math.round(revenue / count) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);
    },
  });
}
