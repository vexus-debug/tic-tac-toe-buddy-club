export interface PrintablePrescription {
  patientName: string;
  clinicianName: string;
  date: string;
  diagnosis?: string | null;
  notes?: string | null;
  medications: { name: string; dosage?: string; frequency?: string; duration?: string; instructions?: string | null }[];
  id?: string;
  registrationNo?: string | null;
  logoUrl?: string | null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

export function printPrescription(rx: PrintablePrescription, clinicName = "Clinic") {
  const rows = rx.medications
    .map(
      (m, i) => `<tr>
        <td>${i + 1}</td>
        <td><strong>${escapeHtml(m.name || "")}</strong></td>
        <td>${escapeHtml(m.dosage || "-")}</td>
        <td>${escapeHtml(m.frequency || "-")}</td>
        <td>${escapeHtml(m.duration || "-")}</td>
        <td>${escapeHtml(m.instructions || "-")}</td>
      </tr>`
    )
    .join("");

  const ref = (rx.id || "").slice(0, 8).toUpperCase();
  const qrData = `RX:${rx.id || ""}|${rx.patientName}|${rx.date}|${rx.clinicianName}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrData)}`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Prescription — ${escapeHtml(rx.patientName)}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, Arial, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .muted { color: #555; font-size: 12px; }
  .meta { margin: 20px 0; font-size: 13px; line-height: 1.7; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f4f4f5; }
  .sign { margin-top: 56px; font-size: 13px; }
  .line { margin-top: 36px; border-top: 1px solid #333; width: 220px; }
  .head { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #111; padding-bottom:10px; }
  .sig { font-family: "Brush Script MT", cursive; font-size: 24px; }
  @media print { body { margin: 16px; } }
</style></head>
<body>
  <div class="head">
    <div style="display:flex;gap:12px;align-items:center">
      ${rx.logoUrl ? `<img src="${escapeHtml(rx.logoUrl)}" alt="" style="height:48px" />` : ""}
      <div><h1>${escapeHtml(clinicName)}</h1><p class="muted">Prescription (Rx)${ref ? ` · Ref ${escapeHtml(ref)}` : ""}</p></div>
    </div>
    <img src="${qr}" alt="Verification QR" width="90" height="90" />
  </div>
  <div class="meta">
    <div><strong>Patient:</strong> ${escapeHtml(rx.patientName)}</div>
    <div><strong>Prescriber:</strong> ${escapeHtml(rx.clinicianName)}${rx.registrationNo ? ` · Reg. no ${escapeHtml(rx.registrationNo)}` : ""}</div>
    <div><strong>Date:</strong> ${escapeHtml(rx.date || "")}</div>
    ${rx.diagnosis ? `<div><strong>Diagnosis:</strong> ${escapeHtml(rx.diagnosis)}</div>` : ""}
  </div>
  <table>
    <thead><tr><th>#</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Dispense / instructions</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="6">No medications recorded</td></tr>`}</tbody>
  </table>
  ${rx.notes ? `<p class="meta"><strong>Notes:</strong> ${escapeHtml(rx.notes)}</p>` : ""}
  <div class="sign"><div class="sig">${escapeHtml(rx.clinicianName)}</div><div class="line"></div>Signature of prescriber${rx.registrationNo ? ` · Reg. no ${escapeHtml(rx.registrationNo)}` : " · Reg. no ____________"}</div>
  <script>window.onload = function () { window.focus(); window.print(); };<\/script>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
    setTimeout(() => frame.remove(), 60000);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
