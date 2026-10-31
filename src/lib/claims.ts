/** Claim statuses that still cover an invoice (a new claim would be a duplicate). */
export const ACTIVE_CLAIM_STATUSES = ["draft", "submitted", "pending"] as const;

export function isActiveClaim(c: { status: string }) {
  return (ACTIVE_CLAIM_STATUSES as readonly string[]).includes(c.status);
}

export function hasActiveClaim(claims: { status: string }[]) {
  return claims.some(isActiveClaim);
}

/** Amount the insurer settlement may record: positive, capped at the invoice's open balance. */
export function settlementAmount(requested: number, balance: number) {
  if (!(requested > 0)) return 0;
  return Math.min(requested, Math.max(0, balance));
}

/** Invoice status after a payment brings total paid to `totalPaid`. */
export function invoiceStatusAfterPayment(totalPaid: number, total: number) {
  return totalPaid >= total ? "paid" : totalPaid > 0 ? "partial" : "pending";
}
