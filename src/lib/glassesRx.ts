import { formatRxEye, type OpticalPrescription } from "@/hooks/eye/useEye";
import { whatsappLink } from "@/hooks/eye/useEyeOps";

const esc = (v: any) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const f = (n: number | null | undefined, sign = true) =>
  n === null || n === undefined ? "—" : sign ? `${n > 0 ? "+" : ""}${Number(n).toFixed(2)}` : String(n);

function name(rx: OpticalPrescription) {
  return rx.patients ? `${rx.patients.first_name} ${rx.patients.last_name}` : "Patient";
}

/** Opens a print-ready glasses prescription. Choose "Save as PDF" in the print window to get a PDF. */
export function printGlassesRx(rx: OpticalPrescription, clinicName = "Eye Clinic") {
  const row = (label: string, s: "od" | "os") => `<tr><th>${label}</th>
    <td>${f((rx as any)[`sphere_${s}`])}</td><td>${f((rx as any)[`cylinder_${s}`])}</td>
    <td>${f((rx as any)[`axis_${s}`], false)}</td><td>${f((rx as any)[`add_${s}`])}</td>
    <td>${esc((rx as any)[`prism_${s}`] || "—")}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Glasses prescription — ${esc(name(rx))}</title>
<style>
body{font-family:Georgia,serif;color:#111;margin:32px;max-width:720px}
h1{font-size:22px;margin:0}.muted{color:#555;font-size:13px}
header{border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-end}
table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #999;padding:8px;text-align:center;font-size:14px}
thead th{background:#f1f1f1}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px}
.sign{margin-top:48px;display:flex;justify-content:space-between;font-size:13px}.line{border-top:1px solid #111;width:220px;padding-top:4px}
@media print{button{display:none}}
</style></head><body>
<header><div><h1>${esc(clinicName)}</h1><div class="muted">Spectacle prescription</div></div>
<div class="muted">Issued ${esc(new Date(rx.issue_date).toLocaleDateString())}${rx.expiry_date ? `<br/>Valid until ${esc(new Date(rx.expiry_date).toLocaleDateString())}` : ""}</div></header>
<div class="grid"><div><strong>Patient:</strong> ${esc(name(rx))}</div><div><strong>Type:</strong> ${esc(rx.rx_type || "Distance")}</div>
<div><strong>PD:</strong> ${rx.pd ?? "—"} mm</div>${rx.lens_brand ? `<div><strong>Lens:</strong> ${esc(rx.lens_brand)}</div>` : ""}</div>
<table><thead><tr><th></th><th>Sphere</th><th>Cylinder</th><th>Axis</th><th>Add</th><th>Prism</th></tr></thead>
<tbody>${row("Right (OD)", "od")}${row("Left (OS)", "os")}</tbody></table>
${rx.notes ? `<p><strong>Notes:</strong> ${esc(rx.notes)}</p>` : ""}
<div class="sign"><div class="line">Optometrist signature</div><div class="line">Date</div></div>
<p style="margin-top:24px"><button onclick="window.print()">Print / Save as PDF</button></p>
<script>setTimeout(()=>window.print(),300)</script></body></html>`;
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
}

export function glassesRxText(rx: OpticalPrescription, clinicName = "Eye Clinic") {
  return [
    `${clinicName} — Glasses prescription`,
    `Patient: ${name(rx)}`,
    `Date: ${new Date(rx.issue_date).toLocaleDateString()}${rx.expiry_date ? ` (valid until ${new Date(rx.expiry_date).toLocaleDateString()})` : ""}`,
    `Right (OD): ${formatRxEye(rx.sphere_od, rx.cylinder_od, rx.axis_od, rx.add_od)}`,
    `Left (OS): ${formatRxEye(rx.sphere_os, rx.cylinder_os, rx.axis_os, rx.add_os)}`,
    rx.pd ? `PD: ${rx.pd} mm` : "",
    rx.notes ? `Notes: ${rx.notes}` : "",
  ].filter(Boolean).join("\n");
}

export function shareGlassesRxWhatsApp(rx: OpticalPrescription, phone?: string | null, clinicName?: string) {
  window.open(whatsappLink(phone, glassesRxText(rx, clinicName)), "_blank");
}
