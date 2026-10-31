import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { differenceInDays, addDays } from "date-fns";
import { Plus, Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLabRecords, type LabRecord } from "@/hooks/useLabRecords";
import type { LabInvoiceRow } from "@/hooks/useLabInvoices";
import { clientOf } from "@/hooks/useDentalLab";
import { agingRisk, creditState, shouldHold, termDays, type AgingRisk, type CreditState } from "@/lib/labClients";
import { useClientSummaries, money, sameClient } from "./dlabMoney";
import { NewCaseDialog } from "./DlabCasesPage";
import { ClientFormDialog } from "./ClientFormDialog";
import { ClientAccount360Drawer } from "./ClientAccount360Drawer";

export interface ClientRow {
  name: string; profile: LabRecord | null; doctors: number; active: number; casesCount: number;
  billed: number; paid: number; creditsTotal: number; balance: number;
  risk: AgingRisk; credit: CreditState; onHold: boolean; overdue30: boolean;
  cases: any[]; invoices: LabInvoiceRow[]; payments: LabRecord[]; credits: LabRecord[];
}

const RISK: Record<AgingRisk, { label: string; v: "outline" | "secondary" | "destructive" }> = {
  current: { label: "Current", v: "outline" }, overdue: { label: "Overdue", v: "secondary" }, high_risk: { label: "High risk", v: "destructive" },
};

export default function DlabClientsPage() {
  const s = useClientSummaries();
  const profiles = useLabRecords("client-profiles");
  const [q, setQ] = useState("");
  const [newFor, setNewFor] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ record: LabRecord | null; name: string } | null>(null);
  const [params] = useSearchParams();
  const [openName, setOpenName] = useState<string | null>(params.get("open"));

  const rows: ClientRow[] = useMemo(() => {
    const profs = profiles.data || [];
    const names = new Map<string, string>();
    s.data.forEach((c) => names.set(c.name.toLowerCase(), c.name));
    profs.forEach((p) => { if (![...names.values()].some((n) => sameClient(n, p.title))) names.set(p.title.toLowerCase(), p.title); });
    const today = new Date();
    return [...names.values()].map((name) => {
      const sum = s.data.find((c) => sameClient(c.name, name));
      const profile = profs.find((p) => sameClient(p.title, name)) || null;
      const invoices = s.invoices.filter((i) => sameClient(i.clinic_code || "", name)) as LabInvoiceRow[];
      const days = termDays(profile?.data?.terms);
      const pastDue = invoices.filter((i) => Number(i.total_amount || 0) - Number(i.amount_paid || 0) > 0 && i.status !== "void")
        .map((i) => differenceInDays(today, addDays(new Date(i.invoice_date || i.created_at), days)));
      const oldest = pastDue.length ? Math.max(...pastDue) : null;
      const balance = sum?.balance || 0;
      const credit = creditState(Number(profile?.amount || 0), balance);
      return {
        name: profile?.title || name, profile, doctors: (profile?.data?.doctors || []).length,
        active: sum?.active || 0, casesCount: sum?.cases || 0, billed: sum?.billed || 0, paid: sum?.paid || 0, creditsTotal: sum?.credits || 0, balance,
        risk: agingRisk(oldest, balance), credit, onHold: shouldHold(profile?.status === "hold", credit), overdue30: (oldest ?? 0) > 30 && balance > 0,
        cases: s.cases.filter((c: any) => c.status !== "cancelled" && sameClient(clientOf(c), name)),
        invoices, payments: s.payments.filter((p) => p.status !== "bounced" && sameClient(p.title, name)), credits: s.credits.filter((p) => p.status !== "void" && sameClient(p.title, name)),
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [s.data, s.invoices, s.cases, s.payments, s.credits, profiles.data]);

  const list = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  const totalAR = rows.reduce((a, r) => a + Math.max(0, r.balance), 0);
  const withBal = rows.filter((r) => r.balance > 0);
  const kpis = [
    ["Active practices", String(rows.filter((r) => r.active > 0 || r.profile).length)],
    ["Receivables outstanding", money(totalAR)],
    ["On credit hold", String(rows.filter((r) => r.onHold).length)],
    ["30+ day delinquency", withBal.length ? `${Math.round((rows.filter((r) => r.overdue30).length / withBal.length) * 100)}%` : "0%"],
  ];
  const open = rows.find((r) => openName && sameClient(r.name, openName)) || null;
  const loading = s.isLoading || profiles.isLoading;

  return (
    <div className="space-y-5">
      <PageHeader title="Clients" description="Practices, doctors, credit terms and account balances.">
        <Button variant="outline" onClick={() => setEdit({ record: null, name: "" })}><UserPlus className="mr-1 h-4 w-4" />New client</Button>
        <Button onClick={() => setNewFor("")}><Plus className="mr-1 h-4 w-4" />New case</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([l, v]) => <Card key={l}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-bold tabular-nums">{v}</p></CardContent></Card>)}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search practices…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && !list.length && <p className="py-10 text-center text-sm text-muted-foreground">No clients yet. Add one, or they appear when you receive their first case.</p>}

      {!!list.length && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr>
              <th className="px-3 py-2">Practice</th><th className="px-3">Contact</th><th className="px-3 text-right">Doctors</th><th className="px-3 text-right">Active</th>
              <th className="px-3 text-right">Balance</th><th className="px-3">Aging</th><th className="px-3">Credit</th><th className="px-3" />
            </tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.name} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => setOpenName(r.name)}>
                <td className="px-3 py-2 font-medium">{r.name}{!r.profile && <span className="ml-2 text-xs text-muted-foreground">(no profile)</span>}</td>
                <td className="px-3 text-xs">{r.profile?.data?.contact_name || "—"}<br /><span className="text-muted-foreground">{r.profile?.data?.phone || ""}</span></td>
                <td className="px-3 text-right tabular-nums">{r.doctors}</td>
                <td className="px-3 text-right tabular-nums">{r.active}</td>
                <td className={`px-3 text-right font-semibold tabular-nums ${r.balance > 0 ? "text-destructive" : ""}`}>{money(r.balance)}</td>
                <td className="px-3"><Badge variant={RISK[r.risk].v}>{RISK[r.risk].label}</Badge></td>
                <td className="px-3">{r.onHold ? <Badge variant="destructive">Credit hold</Badge> : <Badge variant="outline">Active</Badge>}</td>
                <td className="px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => setNewFor(r.name)}><Plus className="mr-1 h-3.5 w-3.5" />Case</Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <ClientAccount360Drawer row={open} onClose={() => setOpenName(null)} onEdit={(r) => setEdit({ record: r.profile, name: r.name })} />
      <ClientFormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} record={edit?.record} defaultName={edit?.name} />
      <NewCaseDialog open={newFor !== null} onOpenChange={(o) => !o && setNewFor(null)} defaultClient={newFor || ""} />
    </div>
  );
}
