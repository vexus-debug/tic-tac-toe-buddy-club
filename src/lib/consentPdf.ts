import { jsPDF } from "jspdf";

export interface ConsentPdfInput {
  clinic: { name: string; address?: string | null; phone?: string | null; email?: string | null; logoDataUrl?: string | null };
  title: string;
  content: string;
  patientName: string;
  signerName: string;
  signerRelation?: string;
  signatureDataUrl: string;
  clinicianName?: string;
  clinicianLicense?: string;
  clinicianSignatureDataUrl?: string | null;
  date: string;
  timestamp?: string;
  hash?: string;
}

/** Builds a signed, locked consent PDF with letterhead, both signatures and a tamper-evident hash footer. */
export function buildConsentPdf(d: ConsentPdfInput): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  if (d.clinic.logoDataUrl) {
    try { doc.addImage(d.clinic.logoDataUrl, M, y, 48, 48); } catch { /* ignore bad logo */ }
  }
  const tx = d.clinic.logoDataUrl ? M + 60 : M;
  doc.setFont("helvetica", "bold").setFontSize(16).text(d.clinic.name, tx, y + 16);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  const contact = [d.clinic.address, d.clinic.phone, d.clinic.email].filter(Boolean).join("  ·  ");
  if (contact) doc.text(doc.splitTextToSize(contact, W - tx - M), tx, y + 32);
  y += 62;
  doc.setDrawColor(200).line(M, y, W - M, y);
  y += 28;

  doc.setTextColor(17).setFont("helvetica", "bold").setFontSize(14).text(d.title, M, y);
  y += 18;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(70);
  doc.text(`Patient: ${d.patientName}     Date: ${d.date}`, M, y);
  y += 22;

  doc.setTextColor(17).setFontSize(10.5);
  const lines = doc.splitTextToSize(d.content || "", W - M * 2);
  for (const line of lines) {
    if (y > H - 200) { doc.addPage(); y = M; }
    doc.text(line, M, y);
    y += 14;
  }

  if (y > H - 200) { doc.addPage(); y = M; }
  y += 24;
  const colW = (W - M * 2) / 2;
  const block = (x: number, img: string | null | undefined, l1: string, l2?: string) => {
    if (img) doc.addImage(img, "PNG", x, y, 180, 60);
    doc.setDrawColor(60).line(x, y + 66, x + 220, y + 66);
    doc.setFontSize(10).setTextColor(17).text(l1, x, y + 80);
    if (l2) doc.setTextColor(90).text(l2, x, y + 94);
  };
  block(M, d.signatureDataUrl, `Patient / Guardian: ${d.signerName}`, d.signerRelation && d.signerRelation !== "Self" ? `Relationship: ${d.signerRelation}` : undefined);
  if (d.clinicianName) block(M + colW, d.clinicianSignatureDataUrl, `Dentist: ${d.clinicianName}`, d.clinicianLicense ? `Reg. no: ${d.clinicianLicense}` : undefined);

  // Tamper-evident footer on every page.
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7).setTextColor(120);
    doc.text(`Locked ${d.timestamp || d.date}${d.hash ? `  ·  SHA-256 ${d.hash}` : ""}  ·  Page ${p}/${pages}`, M, H - 24);
  }
  return doc.output("blob");
}

export async function urlToDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => res(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
