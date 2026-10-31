import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export function useProfitabilityData() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["profitability", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return {
          label: format(d, "MMM yyyy"),
          start: format(startOfMonth(d), "yyyy-MM-dd"),
          end: format(endOfMonth(d), "yyyy-MM-dd"),
        };
      });

      const results = await Promise.all(
        months.map(async (m) => {
          const [{ data: payments }, { data: expenses }] = await Promise.all([
            (supabase as any).from("payments").select("amount").eq("org_id", orgId).gte("payment_date", m.start).lte("payment_date", m.end),
            (supabase as any).from("expenses").select("amount").eq("org_id", orgId).gte("expense_date", m.start).lte("expense_date", m.end),
          ]);
          const revenue = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
          const expense = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
          return {
            month: m.label,
            revenue,
            expenses: expense,
            profit: revenue - expense,
            margin: revenue > 0 ? Math.round(((revenue - expense) / revenue) * 100) : 0,
          };
        })
      );

      const totals = results.reduce(
        (acc, r) => ({
          revenue: acc.revenue + r.revenue,
          expenses: acc.expenses + r.expenses,
          profit: acc.profit + r.profit,
        }),
        { revenue: 0, expenses: 0, profit: 0 }
      );

      return {
        monthly: results,
        totals: {
          ...totals,
          margin: totals.revenue > 0 ? Math.round(((totals.revenue - totals.expenses) / totals.revenue) * 100) : 0,
        },
      };
    },
  });
}

export function useExpenseBreakdown() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["expense-breakdown", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const { data } = await (supabase as any)
        .from("expenses")
        .select("category, amount")
        .eq("org_id", orgId)
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd);

      const byCategory: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
      });

      return Object.entries(byCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
  });
}
