import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from "date-fns";

export function useRevenueTrend() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["reports-revenue-trend", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const now = new Date();
      const months: { month: string; start: string; end: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        months.push({ month: format(d, "MMM"), start: format(startOfMonth(d), "yyyy-MM-dd"), end: format(endOfMonth(d), "yyyy-MM-dd") });
      }
      const { data } = await supabase
        .from("payments")
        .select("amount, payment_date")
        .eq("org_id", orgId!)
        .gte("payment_date", months[0].start)
        .lte("payment_date", months[months.length - 1].end);
      return months.map((m) => ({
        month: m.month,
        revenue: (data || []).filter((p) => p.payment_date >= m.start && p.payment_date <= m.end)
          .reduce((sum, p) => sum + Number(p.amount), 0),
      }));
    },
  });
}

export function useTreatmentDistribution() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["reports-treatment-distribution", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("treatments(category)")
        .eq("org_id", orgId!)
        .not("treatment_id", "is", null);
      const counts: Record<string, number> = {};
      (data || []).forEach((a: any) => { const cat = a.treatments?.category || "Other"; counts[cat] = (counts[cat] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });
}

export function useWeeklyAppointmentTrends() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["reports-weekly-trends", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const { data } = await supabase
        .from("appointments")
        .select("appointment_date")
        .eq("org_id", orgId!)
        .gte("appointment_date", weekStart)
        .lte("appointment_date", weekEnd);
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const counts: Record<string, number> = {};
      days.forEach((d) => (counts[d] = 0));
      (data || []).forEach((a) => { const dayIndex = new Date(a.appointment_date).getDay(); const idx = dayIndex === 0 ? 6 : dayIndex - 1; counts[days[idx]]++; });
      return days.map((day) => ({ day, count: counts[day] }));
    },
  });
}

export function useDentistPerformance() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["reports-dentist-performance", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const { data: appointments } = await supabase
        .from("appointments")
        .select("staff_id, staff(full_name)")
        .eq("org_id", orgId!)
        .gte("appointment_date", monthStart)
        .lte("appointment_date", monthEnd);
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total")
        .eq("org_id", orgId!)
        .gte("invoice_date", monthStart)
        .lte("invoice_date", monthEnd);

      const staffMap: Record<string, { name: string; appointments: number; revenue: number }> = {};
      (appointments || []).forEach((a: any) => {
        const id = a.staff_id;
        if (!staffMap[id]) { staffMap[id] = { name: a.staff?.full_name || "Unknown", appointments: 0, revenue: 0 }; }
        staffMap[id].appointments++;
      });
      const totalRevenue = (invoices || []).reduce((s, i: any) => s + Number(i.total), 0);
      Object.values(staffMap).forEach((s) => { s.revenue = Math.round((s.appointments / (appointments?.length || 1)) * totalRevenue); });
      return Object.values(staffMap).sort((a, b) => b.appointments - a.appointments);
    },
  });
}
