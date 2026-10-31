import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Wallet } from "lucide-react";
import {
  useAssociateContracts,
  useMyPayouts,
  useMyStaffId,
  usePayoutItems,
  usePayStatement,
} from "@/hooks/useAssociatePay";
import { KpiCards, StatementLines, StatementSummary, naira, printPayStub } from "@/components/dashboard/associate/PayStatementView";
import { associateKpis } from "@/lib/associatePay";
import { Printer } from "lucide-react";

export default function MyEarningsPage() {
  const { data: me, isLoading } = useMyStaffId();
  const { data: contracts = [] } = useAssociateContracts();
  const contract = contracts.find((c) => c.staff_id === me?.id);
  const now = new Date();
  const [from, setFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const { data: statement, isFetching } = usePayStatement(me?.id, contract, from, to);
  const { data: payouts = [] } = useMyPayouts(me?.id);
  const [openPayout, setOpenPayout] = useState<any | null>(null);
  const { data: items = [] } = usePayoutItems(openPayout?.id ?? null);

  return (
    <div className="space-y-6">
      <PageHeader title="My Earnings" description="Your production, lab fee share and pay statements" />

      {!isLoading && !me && (
        <EmptyState icon={Wallet} title="No staff profile linked" description="Ask the clinic owner to link your login to your staff profile." />
      )}
      {me && !contract && (
        <EmptyState icon={Wallet} title="No contract yet" description="Your clinic hasn't set up your pay terms. Ask the owner to add them under Commissions." />
      )}

      {contract && (
        <Card className="glass-card">
          <CardHeader className="border-b border-border/30 pb-3">
            <CardTitle className="text-base">This period</CardTitle>
            <CardDescription>
              {contract.commission_rate}% of {contract.compensation_basis === "collections" ? "money collected" : "work billed"}
              {" · "}you carry {contract.lab_fee_share}% of lab fees
              {contract.daily_minimum > 0 ? ` · ${naira(contract.daily_minimum)} daily minimum` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
            {isFetching && <p className="text-sm text-muted-foreground">Calculating…</p>}
            {statement && (<>
              <KpiCards k={associateKpis(statement, contract.daily_minimum)} />
              <StatementSummary s={statement} />
              <StatementLines lines={statement.lines} />
              <Button size="sm" variant="outline" onClick={() => printPayStub({ title: `Estimate ${from} – ${to}`, staffName: (me as any)?.full_name || "Me", lines: statement.lines, total: statement.totalPayable })}>
                <Printer className="mr-2 h-4 w-4" /> Print / save PDF
              </Button>
            </>)}
            <p className="text-xs text-muted-foreground">Estimate only — your final payout is confirmed by the clinic.</p>
          </CardContent>
        </Card>
      )}

      {me && (
        <Card className="glass-card overflow-hidden">
          <CardHeader className="border-b border-border/30 pb-3">
            <CardTitle className="text-base">Pay statements</CardTitle>
            <CardDescription>{payouts.length} statement{payouts.length === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {payouts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No statements yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.period_start} – {p.period_end}</td>
                      <td className="px-4 py-3 text-right font-semibold">{naira(p.calculated_amount)}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{p.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpenPayout(p)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!openPayout} onOpenChange={(o) => !o && setOpenPayout(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Statement {openPayout?.period_start} – {openPayout?.period_end}</DialogTitle></DialogHeader>
          <StatementLines lines={items} />
          <div className="flex justify-between text-sm">
            <span>Total: <b>{naira(openPayout?.calculated_amount)}</b></span>
            <span>Paid: <b>{naira(openPayout?.paid_amount)}</b></span>
          </div>
          <Button size="sm" variant="outline" className="self-start" onClick={() => openPayout && printPayStub({ title: `Statement ${openPayout.period_start} – ${openPayout.period_end}`, staffName: (me as any)?.full_name || "Me", lines: items, total: openPayout.calculated_amount, paid: openPayout.paid_amount })}>
            <Printer className="mr-2 h-4 w-4" /> Print / save PDF
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
