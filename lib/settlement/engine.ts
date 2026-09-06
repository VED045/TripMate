// =============================================================================
// Settlement Engine — Debt Simplification Algorithm
// 
// Takes a list of raw debts between members and simplifies to minimum
// number of transactions using a greedy net-balance algorithm.
//
// All amounts in PAISE (integers) to avoid floating-point errors.
// =============================================================================

export interface RawDebt {
  fromMemberId: string;
  toMemberId: string;
  amountPaise: number;
}

export interface SimplifiedDebt {
  fromMemberId: string;
  toMemberId: string;
  amountPaise: number;
}

export interface MemberBalance {
  memberId: string;
  netPaise: number; // positive = owed money, negative = owes money
}

/**
 * Calculate net balance for each member.
 * net = total_paid - total_owed_share + total_received_settlements - total_paid_settlements
 */
export function calculateNetBalances(
  expenses: Array<{
    paidByMemberId: string;
    amountPaise: number;
    splits: Array<{ memberId: string; amountPaise: number }>;
  }>,
  settlements: Array<{
    fromMemberId: string;
    toMemberId: string;
    amountPaise: number;
  }>
): MemberBalance[] {
  const balances = new Map<string, number>();

  const addBalance = (memberId: string, delta: number) => {
    balances.set(memberId, (balances.get(memberId) ?? 0) + delta);
  };

  // Process expenses
  for (const expense of expenses) {
    addBalance(expense.paidByMemberId, expense.amountPaise); // payer gets credit
    for (const split of expense.splits) {
      addBalance(split.memberId, -split.amountPaise); // each person owes their share
    }
  }

  // Process settlements (reduce balances)
  for (const settlement of settlements) {
    addBalance(settlement.fromMemberId, -settlement.amountPaise); // payer reduces debt
    addBalance(settlement.toMemberId, settlement.amountPaise);    // receiver reduces credit
  }

  return Array.from(balances.entries()).map(([memberId, netPaise]) => ({
    memberId,
    netPaise,
  }));
}

/**
 * Simplify debts using greedy net-balance algorithm.
 * 
 * Algorithm:
 * 1. Calculate net balance for each person
 * 2. Separate into creditors (positive) and debtors (negative)
 * 3. Greedily match largest debtor with largest creditor
 * 4. Repeat until all settled
 * 
 * This minimizes the number of transactions needed.
 */
export function simplifyDebts(balances: MemberBalance[]): SimplifiedDebt[] {
  const result: SimplifiedDebt[] = [];

  // Filter out zero balances and make copies
  const creditors: MemberBalance[] = balances
    .filter(b => b.netPaise > 0)
    .map(b => ({ ...b }))
    .sort((a, b) => b.netPaise - a.netPaise);

  const debtors: MemberBalance[] = balances
    .filter(b => b.netPaise < 0)
    .map(b => ({ ...b }))
    .sort((a, b) => a.netPaise - b.netPaise); // most negative first

  let ci = 0; // creditor index
  let di = 0; // debtor index

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const amount = Math.min(creditor.netPaise, -debtor.netPaise);

    if (amount > 0) {
      result.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountPaise: amount,
      });
    }

    creditor.netPaise -= amount;
    debtor.netPaise += amount;

    if (Math.abs(creditor.netPaise) < 1) ci++;
    if (Math.abs(debtor.netPaise) < 1) di++;
  }

  return result;
}

/**
 * Full pipeline: expenses + settlements → simplified pending debts
 */
export function calculateSimplifiedDebts(
  expenses: Array<{
    paidByMemberId: string;
    amountPaise: number;
    splits: Array<{ memberId: string; amountPaise: number }>;
  }>,
  settlements: Array<{
    fromMemberId: string;
    toMemberId: string;
    amountPaise: number;
  }>
): SimplifiedDebt[] {
  const balances = calculateNetBalances(expenses, settlements);
  return simplifyDebts(balances);
}

/**
 * Calculate individual member stats from expenses
 */
export function calculateMemberStats(
  memberId: string,
  expenses: Array<{
    paidByMemberId: string;
    amountPaise: number;
    splits: Array<{ memberId: string; amountPaise: number }>;
  }>,
  settlements: Array<{
    fromMemberId: string;
    toMemberId: string;
    amountPaise: number;
  }>
) {
  let totalPaidPaise = 0;
  let totalOwedPaise = 0;
  let totalSettledOutPaise = 0;
  let totalSettledInPaise = 0;

  for (const expense of expenses) {
    if (expense.paidByMemberId === memberId) {
      totalPaidPaise += expense.amountPaise;
    }
    for (const split of expense.splits) {
      if (split.memberId === memberId) {
        totalOwedPaise += split.amountPaise;
      }
    }
  }

  for (const s of settlements) {
    if (s.fromMemberId === memberId) totalSettledOutPaise += s.amountPaise;
    if (s.toMemberId === memberId) totalSettledInPaise += s.amountPaise;
  }

  const netBalancePaise =
    totalPaidPaise - totalOwedPaise + totalSettledInPaise - totalSettledOutPaise;

  return {
    totalPaidPaise,
    totalOwedPaise,
    totalSettledOutPaise,
    totalSettledInPaise,
    netBalancePaise, // positive = should receive, negative = owes
  };
}
