import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { format, subMonths, startOfMonth, endOfMonth, subDays, getDay, getHours, parseISO } from "date-fns";

// Phase 5: Staff Performance
export function useStaffPerformance() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["analytics-staff-performance", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const [staffRes, appointmentsRes, reviewsRes, invoicesRes] = await Promise.all([
        (supabase as any).from("staff").select("id, full_name, role").eq("org_id", orgId),
        (supabase as any).from("appointments").select("staff_id, status").eq("org_id", orgId).gte("appointment_date", monthStart).lte("appointment_date", monthEnd),
        (supabase as any).from("patient_reviews").select("staff_id, rating").eq("org_id", orgId),
        (supabase as any).from("invoices").select("id, total").eq("org_id", orgId).gte("invoice_date", monthStart).lte("invoice_date", monthEnd),
      ]);

      const staff = staffRes.data || [];
      const appointments = appointmentsRes.data || [];
      const reviews = reviewsRes.data || [];

      return staff.map((s: any) => {
        const appts = appointments.filter((a: any) => a.staff_id === s.id);
        const completed = appts.filter((a: any) => a.status === "completed").length;
        const staffReviews = reviews.filter((r: any) => r.staff_id === s.id);
        const avgRating = staffReviews.length > 0
          ? staffReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / staffReviews.length
          : null;
        return {
          id: s.id,
          name: s.full_name,
          role: s.role,
          totalAppointments: appts.length,
          completedAppointments: completed,
          completionRate: appts.length > 0 ? Math.round((completed / appts.length) * 100) : 0,
          avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          reviewCount: staffReviews.length,
        };
      }).sort((a: any, b: any) => b.totalAppointments - a.totalAppointments);
    },
  });
}

// Phase 5: Lab Performance
export function useLabPerformance() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["analytics-lab-performance", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: cases } = await (supabase as any)
        .from("lab_cases")
        .select("work_type, status, lab_fee, clinic_fee, created_at, completed_date, due_date")
        .eq("org_id", orgId);

      if (!cases || cases.length === 0) return { byType: [], overall: { total: 0, completed: 0, avgTurnaround: 0, onTime: 0 } };

      const completed = cases.filter((c: any) => c.status === "completed" && c.completed_date && c.created_at);
      const turnarounds = completed.map((c: any) => {
        const start = new Date(c.created_at).getTime();
        const end = new Date(c.completed_date).getTime();
        return Math.round((end - start) / (1000 * 60 * 60 * 24));
      });
      const avgTurnaround = turnarounds.length > 0 ? Math.round(turnarounds.reduce((s: number, v: number) => s + v, 0) / turnarounds.length) : 0;

      const onTime = completed.filter((c: any) => c.due_date && new Date(c.completed_date) <= new Date(c.due_date)).length;

      const typeMap: Record<string, { count: number; revenue: number; completed: number }> = {};
      cases.forEach((c: any) => {
        if (!typeMap[c.work_type]) typeMap[c.work_type] = { count: 0, revenue: 0, completed: 0 };
        typeMap[c.work_type].count++;
        typeMap[c.work_type].revenue += Number(c.clinic_fee || 0);
        if (c.status === "completed") typeMap[c.work_type].completed++;
      });

      return {
        byType: Object.entries(typeMap).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.count - a.count),
        overall: {
          total: cases.length,
          completed: completed.length,
          avgTurnaround,
          onTimeRate: completed.length > 0 ? Math.round((onTime / completed.length) * 100) : 0,
        },
      };
    },
  });
}

// Phase 5: Chair Utilization Heatmap
export function useChairHeatmap() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["analytics-chair-heatmap", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data } = await (supabase as any)
        .from("appointments")
        .select("appointment_date, appointment_time, chair")
        .eq("org_id", orgId)
        .gte("appointment_date", thirtyDaysAgo);

      // Build heatmap: day (0-6) x hour (8-18)
      const heatmap: number[][] = Array.from({ length: 7 }, () => Array(11).fill(0));
      (data || []).forEach((a: any) => {
        const day = getDay(parseISO(a.appointment_date));
        const hour = parseInt(a.appointment_time?.split(":")[0] || "9", 10);
        if (hour >= 8 && hour <= 18) {
          heatmap[day][hour - 8]++;
        }
      });

      return heatmap;
    },
  });
}

// Phase 5: No-Show Analytics
export function useNoShowAnalytics() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["analytics-no-show", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");
      const { data } = await (supabase as any)
        .from("appointments")
        .select("appointment_date, status, patients(first_name, last_name)")
        .eq("org_id", orgId)
        .gte("appointment_date", sixMonthsAgo);

      if (!data || data.length === 0) return { monthlyRates: [], topNoShows: [], overall: 0 };

      const monthMap: Record<string, { total: number; noShows: number }> = {};
      const patientNoShows: Record<string, { name: string; count: number }> = {};

      data.forEach((a: any) => {
        const month = a.appointment_date.substring(0, 7);
        if (!monthMap[month]) monthMap[month] = { total: 0, noShows: 0 };
        monthMap[month].total++;
        if (a.status === "cancelled" || a.status === "no_show") {
          monthMap[month].noShows++;
          const name = a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "Unknown";
          const key = name;
          if (!patientNoShows[key]) patientNoShows[key] = { name, count: 0 };
          patientNoShows[key].count++;
        }
      });

      const totalAppts = data.length;
      const totalNoShows = data.filter((a: any) => a.status === "cancelled" || a.status === "no_show").length;

      return {
        monthlyRates: Object.entries(monthMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, d]) => ({ month, rate: d.total > 0 ? Math.round((d.noShows / d.total) * 100) : 0, total: d.total, noShows: d.noShows })),
        topNoShows: Object.values(patientNoShows).sort((a, b) => b.count - a.count).slice(0, 10),
        overall: totalAppts > 0 ? Math.round((totalNoShows / totalAppts) * 100) : 0,
      };
    },
  });
}

// Phase 5: Demand Forecasting
export function useDemandForecast() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["analytics-demand-forecast", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");
      const { data } = await (supabase as any)
        .from("appointments")
        .select("appointment_date")
        .eq("org_id", orgId)
        .gte("appointment_date", sixMonthsAgo);

      if (!data || data.length === 0) return { byMonth: [], byDayOfWeek: [] };

      const monthMap: Record<string, number> = {};
      const dayMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

      data.forEach((a: any) => {
        const month = a.appointment_date.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + 1;
        const day = getDay(parseISO(a.appointment_date));
        dayMap[day]++;
      });

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return {
        byMonth: Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
        byDayOfWeek: Object.entries(dayMap).map(([day, count]) => ({ day: dayNames[parseInt(day)], count })),
      };
    },
  });
}

// Phase 5: Referral Analytics
export function useReferralAnalytics() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["analytics-referrals", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("patients")
        .select("referral_source, created_at")
        .eq("org_id", orgId);

      if (!data || data.length === 0) return { sources: [], total: 0 };

      const sourceMap: Record<string, number> = {};
      data.forEach((p: any) => {
        const source = p.referral_source || "Unknown";
        sourceMap[source] = (sourceMap[source] || 0) + 1;
      });

      return {
        sources: Object.entries(sourceMap)
          .map(([source, count]) => ({ source, count, percentage: Math.round((count / data.length) * 100) }))
          .sort((a, b) => b.count - a.count),
        total: data.length,
      };
    },
  });
}
