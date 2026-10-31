import type { LabInvoiceRow } from "@/hooks/useLabInvoices";
import type { AgingInvoice } from "@/lib/labAging";

/** Map a stored invoice row to the shape the aging maths uses. */
export const toAging = (i: LabInvoiceRow): AgingInvoice => ({
  id: i.id, client: i.clinic_code, invoice_date: i.invoice_date,
  total: Number(i.total_amount || i.total || 0), paid: Number(i.amount_paid || 0), status: i.status,
});
