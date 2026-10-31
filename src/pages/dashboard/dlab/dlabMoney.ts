import { useMemo } from "react";
import { useLabCases } from "@/hooks/useLabCases";
import { useLabRecords } from "@/hooks/useLabRecords";
import { clientOf, isOverdue } from "@/hooks/useDentalLab";
import { normalizeStage } from "@/config/dentalLab";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import { clientKey } from "./dlabLinks";

export const money = (n: number) => `₦${Math.round(Number(n || 0)).toLocaleString()}`;
/** One normalisation everywhere, so "Apex Dental" and "apex dental clinic" share one balance. */
const key = (s: string) => clientKey(s) || (s || "").trim().toLowerCase();

export interface ClientSummary {
  name: string; cases: number; active: number; late: number; billed: number; wip: number; paid: number; credits: number; balance: number; lastCase: string | null;
}

/** Per-client totals: billed = fees of cases, minus payments received and credit notes. */
export function useClientSummaries() {
  const cases = useLabCases();
  const payments = useLabRecords("client-payments");
  const credits = useLabRecords("credit-notes");
  const invoices = useLabInvoices();
  const data = useMemo(() => {
    const m = new Map<string, ClientSummary>();
    const get = (name: string) => {
      const k = key(name);
      if (!m.has(k)) m.set(k, { name, cases: 0, active: 0, late: 0, billed: 0, wip: 0, paid: 0, credits: 0, balance: 0, lastCase: null });
      return m.get(k)!;
    };
    (cases.data || []).filter((c) => c.status !== "cancelled").forEach((c) => {
      const s = get(clientOf(c));
      s.cases++;
      if (normalizeStage(c.status) !== "delivered") s.active++;
      if (isOverdue(c)) s.late++;
      const fee = Number(c.lab_fee || 0) - Number(c.discount || 0);
      const inv = (invoices.data || []).find((i) => i.lab_case_id === c.id);
      // Only invoiced or delivered work is billed; unfinished work is WIP.
      if (inv) s.billed += Number(inv.total_amount || 0);
      else if (normalizeStage(c.status) === "delivered") s.billed += fee;
      else s.wip += fee;
      if (!s.lastCase || c.created_at > s.lastCase) s.lastCase = c.created_at;
    });
    (invoices.data || []).filter((i) => !i.lab_case_id).forEach((i) => { get(i.clinic_code).billed += Number(i.total_amount || 0); });
    (payments.data || []).filter((p) => p.status !== "bounced").forEach((p) => { get(p.title).paid += Number(p.amount || 0); });
    (credits.data || []).filter((p) => p.status !== "void").forEach((p) => { get(p.title).credits += Number(p.amount || 0); });
    m.forEach((s) => { s.balance = s.billed - s.paid - s.credits; });
    return [...m.values()].sort((a, b) => b.balance - a.balance);
  }, [cases.data, payments.data, credits.data, invoices.data]);
  return { data, isLoading: cases.isLoading || payments.isLoading || credits.isLoading || invoices.isLoading, cases: cases.data || [], invoices: invoices.data || [], payments: payments.data || [], credits: credits.data || [] };
}

export const sameClient = (a: string, b: string) => key(a) === key(b);
