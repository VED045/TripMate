// =============================================================================
// Settlement Engine Tests (Self-contained Node.js / TypeScript Test Suite)
// =============================================================================
import {
  calculateNetBalances,
  simplifyDebts,
  calculateSimplifiedDebts,
  calculateMemberStats,
} from './engine';

const paise = (rupees: number) => Math.round(rupees * 100);

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

export function runTests() {
  console.log('Running Settlement Engine Tests...');

  // Test 1: equal split
  const balances = calculateNetBalances(
    [{
      paidByMemberId: 'A',
      amountPaise: paise(300),
      splits: [
        { memberId: 'A', amountPaise: paise(100) },
        { memberId: 'B', amountPaise: paise(100) },
        { memberId: 'C', amountPaise: paise(100) },
      ],
    }],
    []
  );
  const map = Object.fromEntries(balances.map(b => [b.memberId, b.netPaise]));
  assert(map['A'] === paise(200), 'A should be owed 200');
  assert(map['B'] === -paise(100), 'B should owe 100');
  assert(map['C'] === -paise(100), 'C should owe 100');

  // Test 2: net sum is zero
  const total = balances.reduce((sum, b) => sum + b.netPaise, 0);
  assert(total === 0, 'Net sum must be zero');

  // Test 3: debt simplification
  const debts = simplifyDebts([
    { memberId: 'A', netPaise: paise(300) },
    { memberId: 'B', netPaise: -paise(100) },
    { memberId: 'C', netPaise: -paise(100) },
    { memberId: 'D', netPaise: -paise(100) },
  ]);
  assert(debts.length === 3, 'Must have 3 transactions');
  assert(debts.every(d => d.toMemberId === 'A'), 'All must pay A');

  // Test 4: 8-person trip scenario
  const memberIds = ['A','B','C','D','E','F','G','H'];
  const perPerson = paise(200);
  const totalAmount = perPerson * 8;

  const tripDebts = calculateSimplifiedDebts(
    [{
      paidByMemberId: 'A',
      amountPaise: totalAmount,
      splits: memberIds.map(id => ({ memberId: id, amountPaise: perPerson })),
    }],
    []
  );
  assert(tripDebts.length === 7, '8 people with 1 payer results in 7 payments');
  assert(tripDebts.every(d => d.toMemberId === 'A'), 'All transactions directed to A');

  console.log('✅ All settlement engine tests passed successfully!');
}

// Execute if run directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('engine.test')) {
  runTests();
}
