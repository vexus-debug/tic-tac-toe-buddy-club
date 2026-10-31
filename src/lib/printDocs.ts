// Printable receipt (80mm thermal) and patient statement (A4) documents.
// Print output uses fixed ink colours on white paper (not themed UI).
import { dentalLineMeta } from "@/lib/billingDisplay";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

export interface PrintInvoice {
  invoice_number: string;
  invoice_date: string;
  patient_name: string;
  total_amount: number;
  subtotal: number;
  discount_percent: number;
  amount_paid: number;
  adjustments_total?: number;
}
export interface PrintLine { description: string; quantity: number; unit_price: number; line_total: number; tooth_number?: string | null; surfaces?: string | null; cdt_code?: string | null }
export interface PrintPayment { payment_date: string; payment_method: string; amount: number }
export interface PrintClinic { name?: string; clinic_name?: string; phone?: string; address?: string; email?: string }

/** Sum of recorded payments. */
export function paymentsTotal(payments: PrintPayment[]): number {
  return payments.reduce((s, p) => s + Number(p.amount || 0), 0);
}

export function receiptHTML(inv: PrintInvoice, lines: PrintLine[], payments: PrintPayment[], clinic: PrintClinic | null | undefined, balance: number): string {
  const name = clinic?.name || clinic?.clinic_name || "Clinic";
  const items = lines.map((l) => {
    const meta = dentalLineMeta(l);
    return `<div class="li"><div class="row"><span>${esc(l.description)}</span><span>${money(l.line_total)}</span></div>
      <div class="sub">${l.quantity} × ${money(l.unit_price)}${meta ? ` · ${esc(meta)}` : ""}</div></div>`;
  }).join("");
  const pays = payments.map((p) => `<div class="row"><span>${esc(p.payment_date)} ${esc(p.payment_method).replace(/_/g, " ")}</span><span>${money(p.amount)}</span></div>`).join("");
  const adj = Number(inv.adjustments_total || 0);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${esc(inv.invoice_number)}</title><style>
    @page{size:80mm auto;margin:0}*{box-sizing:border-box;margin:0;padding:0}
    body{width:80mm;padding:4mm;font-family:'Courier New',monospace;font-size:11px;color:#000;background:#fff}
    .c{text-align:center}.b{font-weight:700}h1{font-size:14px}.hr{border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between;gap:6px}.sub{font-size:10px;padding-left:4px}.li{margin-bottom:4px}
    .big{font-size:13px;font-weight:700}
  </style></head><body>
    <div class="c"><h1>${esc(name)}</h1>${clinic?.address ? `<div>${esc(clinic.address)}</div>` : ""}${clinic?.phone ? `<div>${esc(clinic.phone)}</div>` : ""}</div>
    <div class="hr"></div>
    <div class="row"><span>Receipt</span><span class="b">${esc(inv.invoice_number)}</span></div>
    <div class="row"><span>Date</span><span>${esc(inv.invoice_date)}</span></div>
    <div class="row"><span>Patient</span><span>${esc(inv.patient_name)}</span></div>
    <div class="hr"></div>${items}<div class="hr"></div>
    <div class="row"><span>Subtotal</span><span>${money(inv.subtotal)}</span></div>
    ${inv.discount_percent ? `<div class="row"><span>Discount</span><span>${inv.discount_percent}%</span></div>` : ""}
    ${adj ? `<div class="row"><span>Adjustments</span><span>-${money(adj)}</span></div>` : ""}
    <div class="row big"><span>TOTAL</span><span>${money(inv.total_amount)}</span></div>
    <div class="hr"></div>${pays || `<div>No payments yet</div>`}
    <div class="row b"><span>Paid</span><span>${money(paymentsTotal(payments))}</span></div>
    <div class="row big"><span>BALANCE</span><span>${balance > 0 ? money(balance) : "PAID IN FULL"}</span></div>
    <div class="hr"></div><div class="c">Thank you for visiting us!</div>
    <script>window.onload=()=>window.print()</script></body></html>`;
}

export function statementHTML(inv: PrintInvoice, lines: PrintLine[], payments: PrintPayment[], clinic: PrintClinic | null | undefined, balance: number): string {
  const name = clinic?.name || clinic?.clinic_name || "Clinic";
  const today = new Date().toISOString().slice(0, 10);
  const charges = lines.map((l) => `<tr><td>${esc(inv.invoice_date)}</td><td>${esc(l.description)}${dentalLineMeta(l) ? ` <small>(${esc(dentalLineMeta(l))})</small>` : ""}</td><td class="r">${money(l.line_total)}</td><td></td></tr>`).join("");
  const pays = payments.map((p) => `<tr><td>${esc(p.payment_date)}</td><td>Payment — ${esc(p.payment_method).replace(/_/g, " ")}</td><td></td><td class="r">${money(p.amount)}</td></tr>`).join("");
  const discount = Number(inv.subtotal) - Number(inv.total_amount);
  const adj = Number(inv.adjustments_total || 0);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Statement ${esc(inv.patient_name)}</title><style>
    @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:system-ui,sans-serif;color:#111;font-size:12px}
    h1{font-size:20px;margin:0}h2{font-size:15px;margin:18px 0 6px}table{width:100%;border-collapse:collapse}
    th,td{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left}th{font-size:10px;text-transform:uppercase;color:#555}
    .r{text-align:right}.top{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:10px}
    .sum{margin-left:auto;width:260px;margin-top:12px}.sum div{display:flex;justify-content:space-between;padding:3px 0}
    .due{font-size:16px;font-weight:700;border-top:2px solid #111;padding-top:6px!important}
  </style></head><body>
    <div class="top"><div><h1>${esc(name)}</h1><div>${esc(clinic?.address || "")}</div><div>${esc(clinic?.phone || "")} ${esc(clinic?.email || "")}</div></div>
      <div class="r"><b>PATIENT STATEMENT</b><div>Date: ${today}</div><div>Invoice ${esc(inv.invoice_number)}</div></div></div>
    <h2>${esc(inv.patient_name)}</h2>
    <table><thead><tr><th>Date</th><th>Description</th><th class="r">Charges</th><th class="r">Payments</th></tr></thead><tbody>${charges}${pays}</tbody></table>
    <div class="sum">
      <div><span>Total charges</span><span>${money(inv.subtotal)}</span></div>
      ${discount > 0 ? `<div><span>Discount</span><span>-${money(discount)}</span></div>` : ""}
      ${adj ? `<div><span>Adjustments</span><span>-${money(adj)}</span></div>` : ""}
      <div><span>Payments received</span><span>-${money(paymentsTotal(payments))}</span></div>
      <div class="due"><span>Balance due</span><span>${money(balance)}</span></div>
    </div>
    <script>window.onload=()=>window.print()</script></body></html>`;
}

/** Claims filter used by the claims table. */
export function filterClaims<T extends { status: string; insurer_name?: string | null; policy_number?: string | null; invoices?: { invoice_number?: string } | null; patients?: { first_name?: string; last_name?: string } | null }>(
  claims: T[], status: string, query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return claims.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (!q) return true;
    const hay = [c.insurer_name, c.policy_number, c.invoices?.invoice_number, c.patients ? `${c.patients.first_name} ${c.patients.last_name}` : ""].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
