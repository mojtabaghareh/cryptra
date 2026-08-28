/**
 * Partner revenue share — product decision: share of collected fees.
 * Default 0 until partners are configured in DB/admin.
 */
export function partnerShareBps(_partnerId: string): number {
  return 0;
}

export function partnerAmountFromFee(feeAmount: number, shareBps: number): number {
  if (feeAmount <= 0 || shareBps <= 0) return 0;
  return (feeAmount * shareBps) / 10_000;
}
