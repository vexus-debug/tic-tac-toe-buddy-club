import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Save } from "lucide-react";
import { DEFAULT_CONTRACT, useAssociateContracts, useSaveAssociateContract, type ContractRow } from "@/hooks/useAssociatePay";

/** "Compensation & Contract" tab inside the staff edit dialog. */
export function ContractTermsTab({ staffId }: { staffId: string }) {
  const { data: contracts = [], isLoading } = useAssociateContracts();
  const save = useSaveAssociateContract();
  const saved = contracts.find((c) => c.staff_id === staffId);
  const [d, setD] = useState<ContractRow>({ ...DEFAULT_CONTRACT, staff_id: staffId });
  useEffect(() => { setD(saved ? { ...saved } : { ...DEFAULT_CONTRACT, staff_id: staffId }); }, [saved, staffId]);
  const set = (k: keyof ContractRow, v: any) => setD((x) => ({ ...x, [k]: v }));

  if (isLoading) return <p className="py-6 text-sm text-muted-foreground">Loading contract…</p>;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Compensation basis</Label>
          <ToggleGroup type="single" variant="outline" className="justify-start" value={d.compensation_basis} onValueChange={(v) => v && set("compensation_basis", v)}>
            <ToggleGroupItem value="production" className="text-xs">Gross Production</ToggleGroupItem>
            <ToggleGroupItem value="collections" className="text-xs">Collected Revenue</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1"><Label className="text-xs">Commission %</Label><Input type="number" min={0} max={100} value={d.commission_rate} onChange={(e) => set("commission_rate", Number(e.target.value))} /></div>
          <div className="space-y-1"><Label className="text-xs">Lab fee share %</Label><Input type="number" min={0} max={100} value={d.lab_fee_share} onChange={(e) => set("lab_fee_share", Number(e.target.value))} /></div>
          <div className="space-y-1"><Label className="text-xs">Daily draw (₦)</Label><Input type="number" min={0} value={d.daily_minimum} onChange={(e) => set("daily_minimum", Number(e.target.value))} /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Contract status</Label>
          <Select value={d.contract_status || "active"} onValueChange={(v) => { set("contract_status", v); set("is_active", v === "active"); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pay frequency</Label>
          <Select value={d.payout_frequency} onValueChange={(v) => set("payout_frequency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="biweekly">Every 2 weeks</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Start date</Label><Input type="date" value={d.start_date || ""} onChange={(e) => set("start_date", e.target.value || null)} /></div>
        <div className="space-y-1"><Label className="text-xs">End / renewal date</Label><Input type="date" value={d.end_date || ""} onChange={(e) => set("end_date", e.target.value || null)} /></div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea rows={2} value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} /></div>
      <Button size="sm" onClick={() => save.mutate(d)} disabled={save.isPending}>
        <Save className="mr-2 h-4 w-4" />{save.isPending ? "Saving..." : "Save contract"}
      </Button>
    </div>
  );
}
