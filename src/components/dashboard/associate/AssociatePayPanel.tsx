import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Save } from "lucide-react";
import { useStaff } from "@/hooks/useStaff";
import {
  DEFAULT_CONTRACT,
  useAssociateContracts,
  useCreatePayoutFromStatement,
  usePayStatement,
  useSaveAssociateContract,
  type ContractRow,
} from "@/hooks/useAssociatePay";
import { StatementLines, StatementSummary } from "./PayStatementView";

export function AssociatePayPanel() {
  const { data: staff = [] } = useStaff();
  const clinicians = (staff as any[]).filter((s) => ["dentist", "hygienist"].includes(s.role) && s.status !== "inactive");
  const { data: contracts = [] } = useAssociateContracts();
  const save = useSaveAssociateContract();
  const createPayout = useCreatePayoutFromStatement();

  const [staffId, setStaffId] = useState("");
  const now = new Date();
  const [from, setFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const saved = useMemo(() => contracts.find((c) => c.staff_id === staffId), [contracts, staffId]);
  const [draft, setDraft] = useState<ContractRow | null>(null);

  useEffect(() => {
    if (!staffId) { setDraft(null); return; }
    setDraft(saved ? { ...saved } : { ...DEFAULT_CONTRACT, staff_id: staffId });
  }, [staffId, saved]);

  const { data: statement, isFetching } = usePayStatement(staffId || undefined, saved, from, to);
  const set = (k: keyof ContractRow, v: any) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <Card className="glass-card">
      <CardHeader className="border-b border-border/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Calculator className="h-4 w-4" /> Associate pay</CardTitle>
        <CardDescription>Set each dentist's contract, then calculate their pay from the work billed under their name.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-1">
          <Label className="text-xs">Dentist</Label>
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className="sm:max-w-sm"><SelectValue placeholder="Select a dentist" /></SelectTrigger>
            <SelectContent>
              {clinicians.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.full_name}{contracts.some((k) => k.staff_id === c.id) ? "" : " — no contract"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {draft && (
          <div className="grid gap-3 rounded-lg border border-border/50 p-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Paid on</Label>
              <Select value={draft.compensation_basis} onValueChange={(v) => set("compensation_basis", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production (work billed)</SelectItem>
                  <SelectItem value="collections">Collections (money received)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Commission %</Label>
              <Input type="number" min={0} max={100} value={draft.commission_rate} onChange={(e) => set("commission_rate", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dentist's share of lab fees %</Label>
              <Input type="number" min={0} max={100} value={draft.lab_fee_share} onChange={(e) => set("lab_fee_share", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Daily minimum (₦)</Label>
              <Input type="number" min={0} value={draft.daily_minimum} onChange={(e) => set("daily_minimum", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pay frequency</Label>
              <Select value={draft.payout_frequency} onValueChange={(v) => set("payout_frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start date</Label>
              <Input type="date" value={draft.start_date || ""} onChange={(e) => set("start_date", e.target.value || null)} />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={draft.notes || ""} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <Button size="sm" onClick={() => save.mutate(draft)} disabled={save.isPending}>
                <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving..." : "Save contract"}
              </Button>
            </div>
          </div>
        )}

        {staffId && !saved && <p className="text-sm text-muted-foreground">Save a contract to calculate pay.</p>}

        {saved && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
            {isFetching && <p className="text-sm text-muted-foreground">Calculating…</p>}
            {statement && (
              <>
                <StatementSummary s={statement} />
                <StatementLines lines={statement.lines} />
                <Button
                  onClick={() => createPayout.mutate({ staffId, from, to, statement })}
                  disabled={createPayout.isPending || statement.totalPayable <= 0}
                >
                  {createPayout.isPending ? "Creating..." : "Create payout from this statement"}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
