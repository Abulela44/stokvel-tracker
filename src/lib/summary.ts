import type { Member, Payment, Stokvel } from "@/lib/data";
import { monthsElapsed } from "@/lib/stokvel";

export type Summary = {
  collected: number;
  expected: number;
  outstanding: number;
  payoutAmount: number;
  payoutsMade: number;
  balance: number;
  elapsed: number;
  paidCount: Map<string, number>;
  paidThisMonth: number;
  outstandingByMember: Map<string, number>;
  paidByMember: Map<string, number>;
};

export function computeSummary(
  stokvel: Stokvel,
  members: Member[],
  payments: Payment[],
  year: number,
  now = new Date(),
): Summary {
  const elapsed = monthsElapsed(year, now);
  const contribution = stokvel.monthly_contribution;
  const paidCount = new Map<string, number>();
  const paidByMember = new Map<string, number>();
  let collected = 0;
  let paidThisMonth = 0;
  const currentMonth = now.getMonth() + 1;

  for (const p of payments) {
    collected += p.amount;
    paidCount.set(p.member_id, (paidCount.get(p.member_id) ?? 0) + 1);
    paidByMember.set(p.member_id, (paidByMember.get(p.member_id) ?? 0) + p.amount);
    if (year === now.getFullYear() && p.month === currentMonth) paidThisMonth += 1;
  }

  const outstandingByMember = new Map<string, number>();
  for (const m of members) {
    const due = elapsed * contribution;
    const paid = paidByMember.get(m.id) ?? 0;
    outstandingByMember.set(m.id, Math.max(0, due - paid));
  }

  const expected = members.length * contribution * elapsed;
  const payoutAmount = contribution * members.length;
  const payoutsMade =
    year < now.getFullYear()
      ? members.length
      : year > now.getFullYear()
        ? 0
        : members.filter((m) => m.position < currentMonth).length;

  return {
    collected,
    expected,
    outstanding: Math.max(0, expected - collected),
    payoutAmount,
    payoutsMade,
    balance: collected - payoutsMade * payoutAmount,
    elapsed,
    paidCount,
    paidThisMonth,
    outstandingByMember,
    paidByMember,
  };
}
