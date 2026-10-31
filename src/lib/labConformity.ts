// Phase 3 — material traceability, custom-made device conformity statement, dentist impression scorecard.

export interface MaterialLot {
  material: string;
  manufacturer?: string;
  lot: string;
  shade?: string;
  expiry?: string | null; // YYYY-MM-DD
}

/** Clinical (clinic-side) faults tracked per prescribing dentist. */
export const CLINICAL_FAULTS = ["Distorted impression", "Inadequate occlusal clearance", "Ambiguous margin", "Prep changed", "New impression", "Shade"] as const;

/** Returns a list of problems; empty means the lot can be bound to the case. */
export function validateMaterialLot(l: Partial<MaterialLot>, todayYmd: string): string[] {
  const errs: string[] = [];
  if (!l.material?.trim()) errs.push("Material is required");
  const lot = (l.lot || "").trim();
  if (!lot) errs.push("Lot / batch number is required");
  else if (!/^[A-Za-z0-9][A-Za-z0-9\-_/.]{1,39}$/.test(lot)) errs.push("Lot number has invalid characters");
  if (l.expiry && l.expiry.slice(0, 10) < todayYmd) errs.push("Material lot is expired");
  return errs;
}

/** Cases that used a given lot — the recall list. */
export function casesUsingLot<T extends { case_id?: string | null; data?: Partial<MaterialLot> | null }>(lots: T[], lot: string) {
  const want = lot.trim().toUpperCase();
  return [...new Set(lots.filter((r) => (r.data?.lot || "").trim().toUpperCase() === want).map((r) => r.case_id).filter(Boolean))] as string[];
}

export interface ConformityInput {
  labName: string;
  case_number: string;
  patient: string;
  doctor?: string | null;
  clinic: string;
  teeth: string[];
  work_type: string;
  shade?: string | null;
  lots: MaterialLot[];
  qc_status?: string | null;
  inspector?: string | null;
  releaseDate: string;
}

/** A statement can only be issued after a passed QC and with at least one bound material lot. */
export function conformityBlockers(d: Pick<ConformityInput, "qc_status" | "lots" | "doctor">): string[] {
  const b: string[] = [];
  if (d.qc_status !== "passed") b.push("Case has not passed QC");
  if (!d.lots.length) b.push("No material lot is recorded");
  if (!d.doctor?.trim()) b.push("Prescribing dentist is missing");
  return b;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function conformityHtml(d: ConformityInput): string {
  const lots = d.lots.map((l) => `<tr><td>${esc(l.material)}</td><td>${esc(l.manufacturer || "—")}</td><td>${esc(l.lot)}</td><td>${esc(l.shade || "—")}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Statement of Conformity ${esc(d.case_number)}</title><style>
@page{size:A4;margin:16mm}body{font-family:system-ui,Arial,sans-serif;color:#000;font-size:12px}h1{font-size:18px;margin:0 0 4px}
table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #000;padding:4px;text-align:left}
.g{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin:10px 0}.sig{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:24px}.sig div{border-top:1px solid #000;padding-top:4px}
</style></head><body>
<h1>Statement of Conformity — Custom-Made Medical Device</h1>
<p>${esc(d.labName)} · Case <b>${esc(d.case_number)}</b></p>
<div class="g"><div>Patient: <b>${esc(d.patient)}</b></div><div>Prescribing dentist: <b>${esc(d.doctor)}</b></div>
<div>Clinic: <b>${esc(d.clinic)}</b></div><div>Release date: <b>${esc(d.releaseDate)}</b></div>
<div>Device: <b>${esc(d.work_type)}</b></div><div>Teeth: <b>${esc(d.teeth.length ? "#" + d.teeth.join(", #") : "—")}</b></div>
<div>Shade: <b>${esc(d.shade || "—")}</b></div><div>QC inspector: <b>${esc(d.inspector || "—")}</b></div></div>
<h3>Materials used</h3><table><tr><th>Material</th><th>Manufacturer</th><th>Lot / batch</th><th>Shade</th></tr>${lots}</table>
<p>This device was made specifically for the named patient on the written prescription of the dentist above. It conforms to the general safety and performance requirements (EU MDR 2017/745 Annex I, Annex XIII; UK MDR 2002) and to the prescription. Where a requirement was not fully met, the reasons are recorded in the case file.</p>
<div class="sig"><div>Authorised signatory (lab)</div><div>Date</div></div>
<script>window.onload=function(){window.print()}</script></body></html>`;
}

export function printConformity(d: ConformityInput) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return false;
  w.document.write(conformityHtml(d));
  w.document.close();
  return true;
}

/**
 * Clinical quality scorecard by prescribing dentist.
 * Denominator: that dentist's original (non-remake, non-cancelled) cases. Numerator: clinic-fault remakes.
 */
export function dentistScorecard(
  cases: { id: string; parent_case_id?: string | null; status?: string | null; clinic_doctor_name?: string | null }[],
  claims: { case_id?: string | null; data?: { fault?: string; reason?: string } | null }[],
) {
  const doc = (c?: { clinic_doctor_name?: string | null }) => c?.clinic_doctor_name?.trim() || "Unknown dentist";
  const byId = new Map(cases.map((c) => [c.id, c]));
  const rows = new Map<string, { name: string; cases: number; clinicRemakes: number; faults: Record<string, number> }>();
  const row = (n: string) => rows.get(n) || (rows.set(n, { name: n, cases: 0, clinicRemakes: 0, faults: {} }), rows.get(n)!);
  cases.filter((c) => !c.parent_case_id && c.status !== "cancelled").forEach((c) => row(doc(c)).cases++);
  claims.filter((r) => r.data?.fault === "clinic").forEach((r) => {
    const r0 = row(doc(byId.get(r.case_id || "")));
    r0.clinicRemakes++;
    const k = r.data?.reason || "Other";
    r0.faults[k] = (r0.faults[k] || 0) + 1;
  });
  return [...rows.values()]
    .map((r) => ({ ...r, pct: r.cases ? Math.round((r.clinicRemakes / r.cases) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct || b.clinicRemakes - a.clinicRemakes);
}
