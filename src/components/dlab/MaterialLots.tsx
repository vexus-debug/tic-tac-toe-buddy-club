import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCheck2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";
import { type LabCaseRow } from "@/hooks/useLabCases";
import { clientOf, patientOf } from "@/hooks/useDentalLab";
import { conformityBlockers, printConformity, validateMaterialLot, type MaterialLot } from "@/lib/labConformity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLabRecords } from "@/hooks/useLabRecords";
import { usableLots, materialSpecs } from "@/lib/labCatalog";

const today = () => new Date().toISOString().slice(0, 10);
const blank: MaterialLot = { material: "", manufacturer: "", lot: "", shade: "", expiry: "" };

export function useCaseLots(caseId: string) {
  const { currentOrg } = useOrg();
  return useQuery({
    queryKey: ["lab_records", currentOrg?.org_id, "material_lot", caseId],
    enabled: !!currentOrg?.org_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("lab_records").select("id, data, case_id")
        .eq("org_id", currentOrg!.org_id).eq("kind", "material_lot").eq("case_id", caseId).order("created_at");
      if (error) throw error;
      return (data || []) as { id: string; data: MaterialLot }[];
    },
  });
}

/** Material lot traceability + Statement of Conformity for one case. */
export function MaterialLots({ c, teeth }: { c: LabCaseRow; teeth: string[] }) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const { data: lots = [] } = useCaseLots(c.id);
  const [v, setV] = useState<MaterialLot>(blank);
  const [busy, setBusy] = useState(false);
  const { data: stock = [] } = useLabRecords("materials");
  const usable = usableLots(stock as any, today());
  const [stockId, setStockId] = useState("");
  const [units, setUnits] = useState("1");
  const picked = usable.find((r: any) => r.id === stockId) as any;

  const useFromStock = async () => {
    if (!stockId) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc("lab_use_stock_lot", { p_case_id: c.id, p_stock_id: stockId, p_units: Number(units) });
    setBusy(false);
    if (error) { toast({ title: "Could not use this lot", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lot recorded and taken off stock" });
    setStockId(""); setUnits("1");
    qc.invalidateQueries({ queryKey: ["lab_records"] });
  };

  const add = async () => {
    const errs = validateMaterialLot(v, today());
    if (errs.length) { toast({ title: "Lot not added", description: errs.join(". "), variant: "destructive" }); return; }
    setBusy(true);
    const data = { ...v, lot: v.lot.trim(), material: v.material.trim(), expiry: v.expiry || null };
    const { error } = await (supabase as any).from("lab_records").insert({
      org_id: currentOrg?.org_id, kind: "material_lot", case_id: c.id, title: `${data.material} · ${data.lot}`,
      status: "used", amount: 0, record_date: today(), data,
    });
    setBusy(false);
    if (error) { toast({ title: "Could not save lot", description: error.message, variant: "destructive" }); return; }
    setV(blank);
    qc.invalidateQueries({ queryKey: ["lab_records"] });
  };

  const remove = async (id: string) => {
    const fromStock = !!(lots.find((l) => l.id === id)?.data as any)?.stock_id;
    if (!confirm(fromStock ? "Remove this lot from the case and put the units back in stock?" : "Remove this material lot from the case?")) return;
    const { error } = fromStock
      ? await (supabase as any).rpc("lab_return_stock_lot", { p_usage_id: id })
      : await (supabase as any).from("lab_records").delete().eq("id", id);
    if (error) toast({ title: "Could not remove", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["lab_records"] });
  };

  const printStatement = async () => {
    const list = lots.map((l) => l.data);
    const blockers = conformityBlockers({ qc_status: (c as any).qc_status, lots: list, doctor: c.clinic_doctor_name });
    if (blockers.length) { toast({ title: "Statement blocked", description: blockers.join(". "), variant: "destructive" }); return; }
    const { data: rec } = await (supabase as any).from("lab_records").select("data").eq("kind", "qc").eq("case_id", c.id)
      .eq("status", "passed").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const ok = printConformity({
      labName: (currentOrg as any)?.org_name || (currentOrg as any)?.name || "Dental Laboratory",
      case_number: c.case_number, patient: patientOf(c), doctor: c.clinic_doctor_name, clinic: clientOf(c),
      teeth, work_type: c.work_type, shade: c.shade, lots: list, qc_status: (c as any).qc_status,
      inspector: rec?.data?.inspector || null, releaseDate: today(),
    });
    if (!ok) toast({ title: "Allow pop-ups to print the statement", variant: "destructive" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Materials used (lot traceability)</p>
        <Button size="sm" variant="outline" onClick={printStatement}
          title={conformityBlockers({ qc_status: (c as any).qc_status, lots: lots.map((l) => l.data), doctor: c.clinic_doctor_name }).join(". ") || "Print the release statement"}><FileCheck2 className="mr-1 h-3.5 w-3.5" />Statement of Conformity</Button>
      </div>
      {lots.length > 0 && (
        <ul className="divide-y rounded-lg border text-sm">
          {lots.map((l) => (
            <li key={l.id} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{l.data.material}{l.data.manufacturer ? ` (${l.data.manufacturer})` : ""} · <span className="font-mono">{l.data.lot}</span>{l.data.expiry ? ` · exp ${l.data.expiry}` : ""}{(l.data as any).units ? ` · ${(l.data as any).units} used` : ""}</span>
              <Button size="icon" variant="ghost" aria-label="Remove lot" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2 rounded-lg border p-2">
        <p className="text-xs text-muted-foreground">From stock (takes units off Materials & Lots)</p>
        {usable.length === 0 ? <p className="text-xs text-muted-foreground">No usable lots in stock. Add them under Catalogue & Stock → Materials & Lots, or type a lot below.</p> : (
          <div className="flex flex-wrap gap-2">
            <Select value={stockId} onValueChange={setStockId}>
              <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Choose a lot" /></SelectTrigger>
              <SelectContent>{usable.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.title}{materialSpecs(r) ? ` · ${materialSpecs(r)}` : ""} · {r.data?.lot || "no lot"} · {Number(r.amount)} {r.data?.unit || "units"} left{r.record_date ? ` · exp ${r.record_date}` : ""}</SelectItem>
              ))}</SelectContent>
            </Select>
            <Input type="number" min={0.01} step="any" aria-label="Units used" className="w-24" value={units} onChange={(e) => setUnits(e.target.value)} />
            <Button size="sm" disabled={busy || !stockId || !(Number(units) > 0) || (picked && Number(units) > Number(picked.amount))} onClick={useFromStock}>Use</Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Or type a lot that is not in stock:</p>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Material (e.g. Zirconia)" value={v.material} onChange={(e) => setV({ ...v, material: e.target.value })} />
        <Input placeholder="Manufacturer" value={v.manufacturer} onChange={(e) => setV({ ...v, manufacturer: e.target.value })} />
        <Input placeholder="Lot / batch no." value={v.lot} onChange={(e) => setV({ ...v, lot: e.target.value })} />
        <Input type="date" aria-label="Expiry date" value={v.expiry || ""} onChange={(e) => setV({ ...v, expiry: e.target.value })} />
      </div>
      <Button size="sm" disabled={busy} onClick={add}><Plus className="mr-1 h-3.5 w-3.5" />Add lot</Button>
    </div>
  );
}
