import { code128Svg } from "@/lib/code128";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export interface TravelerData {
  labName: string;
  case_number: string;
  clinic: string;
  doctor?: string | null;
  patient: string;
  work_type: string;
  material?: string | null;
  shade?: string | null;
  teeth: string[];
  due_date?: string | null;
  rush: boolean;
  technician?: string | null;
  instructions?: string | null;
}

export function travelerHtml(d: TravelerData, size: "a5" | "a4" | "slip" = "a5"): string {
  const page = size === "slip" ? "80mm auto" : size.toUpperCase();
  const row = (k: string, v: unknown) => `<div class="f"><span>${esc(k)}</span><b>${esc(v || "—")}</b></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Traveler ${esc(d.case_number)}</title><style>
@page{size:${page};margin:8mm}*{box-sizing:border-box}body{font-family:system-ui,Arial,sans-serif;color:#000;margin:0;font-size:12px}
.h{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:6px}
.h h1{font-size:16px;margin:0}.cn{font-size:20px;font-weight:800;font-family:monospace}
.rush{border:3px solid #000;text-align:center;font-weight:900;font-size:18px;letter-spacing:4px;margin:8px 0;padding:4px}
.bc{text-align:center;margin:8px 0}.bc svg{max-width:100%;height:56px}.bc p{font-family:monospace;margin:2px 0 0;letter-spacing:2px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin:8px 0}.f{display:flex;flex-direction:column;border-bottom:1px dotted #999;padding:2px 0}
.f span{font-size:9px;text-transform:uppercase;color:#444}.teeth{font-family:monospace;font-size:15px}
.ins{border:1px solid #000;padding:6px;min-height:60px;white-space:pre-wrap;margin:8px 0}
.sig{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.sig div{border:1px solid #000;height:56px;padding:3px;font-size:9px;text-transform:uppercase}
${size === "slip" ? ".g,.sig{grid-template-columns:1fr}" : ""}
@media print{button{display:none}}</style></head><body>
<div class="h"><div><h1>${esc(d.labName)}</h1><div>Job traveler</div></div><div class="cn">${esc(d.case_number)}</div></div>
${d.rush ? `<div class="rush">RUSH</div>` : ""}
<div class="bc">${code128Svg(d.case_number)}<p>${esc(d.case_number)}</p></div>
<div class="g">${row("Clinic", d.clinic)}${row("Doctor", d.doctor)}${row("Patient", d.patient)}${row("Due", d.due_date)}
${row("Work type", d.work_type)}${row("Material", d.material)}${row("Shade", d.shade)}${row("Technician", d.technician)}</div>
<div class="f"><span>Teeth</span><b class="teeth">${d.teeth.length ? esc("#" + d.teeth.join("  #")) : "—"}</b></div>
<div class="ins"><b>Instructions</b><br>${esc(d.instructions || "None")}</div>
<div class="sig"><div>CAD tech</div><div>Ceramist</div><div>QC inspector</div></div>
<script>window.onload=function(){window.print()}</script></body></html>`;
}

export function printTraveler(d: TravelerData, size: "a5" | "a4" | "slip" = "a5") {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return false;
  w.document.write(travelerHtml(d, size));
  w.document.close();
  return true;
}
