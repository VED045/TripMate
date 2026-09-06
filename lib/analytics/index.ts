// =============================================================================
// Analytics Engine — Pure functions for trip statistics
// All amounts in paise, all functions independently testable
// =============================================================================
import type {
  Expense, ExpenseSplit, Member, Media, MediaTag, Category,
  TripStats, CategorySpending, DailySpending, TopSpender, TripPulseItem,
} from '@/types';

export function calculateTripTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount_paise, 0);
}

export function calculateAveragePerPerson(
  totalPaise: number,
  memberCount: number
): number {
  if (memberCount <= 0) return 0;
  return Math.floor(totalPaise / memberCount);
}

export function calculateCategoryTotals(
  expenses: Expense[],
  categories: Category[]
): CategorySpending[] {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const totals = new Map<string, { paise: number; count: number }>();

  const total = calculateTripTotal(expenses);

  for (const expense of expenses) {
    const catId = expense.category_id || 'uncategorized';
    const existing = totals.get(catId) || { paise: 0, count: 0 };
    totals.set(catId, {
      paise: existing.paise + expense.amount_paise,
      count: existing.count + 1,
    });
  }

  return Array.from(totals.entries())
    .map(([catId, data]) => {
      const cat = catMap.get(catId);
      return {
        categoryId: catId,
        categoryName: cat?.name || 'Uncategorized',
        categoryIcon: cat?.icon || 'circle',
        categoryColor: cat?.color || '#64748b',
        totalPaise: data.paise,
        percentage: total > 0 ? Math.round((data.paise / total) * 1000) / 10 : 0,
        count: data.count,
      };
    })
    .sort((a, b) => b.totalPaise - a.totalPaise);
}

export function calculateDailySpending(expenses: Expense[]): DailySpending[] {
  const dailyMap = new Map<string, { paise: number; count: number }>();

  for (const expense of expenses) {
    const date = expense.expense_date;
    const existing = dailyMap.get(date) || { paise: 0, count: 0 };
    dailyMap.set(date, {
      paise: existing.paise + expense.amount_paise,
      count: existing.count + 1,
    });
  }

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalPaise: data.paise,
      expenseCount: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateTopSpenders(
  expenses: Expense[],
  members: Member[]
): TopSpender[] {
  const paidMap = new Map<string, number>();

  for (const expense of expenses) {
    paidMap.set(
      expense.paid_by,
      (paidMap.get(expense.paid_by) || 0) + expense.amount_paise
    );
  }

  const memberMap = new Map(members.map(m => [m.id, m]));

  return Array.from(paidMap.entries())
    .map(([memberId, totalPaise]) => ({
      member: memberMap.get(memberId)!,
      totalPaidPaise: totalPaise,
      rank: 0,
    }))
    .filter(s => s.member)
    .sort((a, b) => b.totalPaidPaise - a.totalPaidPaise)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export function calculatePhotoCounts(
  media: Media[]
): { photoCount: number; videoCount: number } {
  const photoCount = media.filter(m => m.media_type === 'photo').length;
  const videoCount = media.filter(m => m.media_type === 'video').length;
  return { photoCount, videoCount };
}

export function calculateMostPhotographed(
  mediaTags: MediaTag[],
  members: Member[]
): Array<{ member: Member; count: number; rank: number }> {
  const countMap = new Map<string, number>();

  for (const tag of mediaTags) {
    countMap.set(tag.member_id, (countMap.get(tag.member_id) || 0) + 1);
  }

  const memberMap = new Map(members.map(m => [m.id, m]));

  return Array.from(countMap.entries())
    .map(([memberId, count]) => ({
      member: memberMap.get(memberId)!,
      count,
      rank: 0,
    }))
    .filter(x => x.member)
    .sort((a, b) => b.count - a.count)
    .map((x, i) => ({ ...x, rank: i + 1 }));
}

export function calculateMostActiveUploader(
  media: Media[],
  members: Member[]
): Array<{ member: Member; uploadCount: number }> {
  const countMap = new Map<string, number>();

  for (const m of media) {
    if (m.uploader_id) {
      countMap.set(m.uploader_id, (countMap.get(m.uploader_id) || 0) + 1);
    }
  }

  const memberMap = new Map(members.map(m => [m.id, m]));

  return Array.from(countMap.entries())
    .map(([memberId, count]) => ({
      member: memberMap.get(memberId)!,
      uploadCount: count,
    }))
    .filter(x => x.member)
    .sort((a, b) => b.uploadCount - a.uploadCount);
}

export function calculateTripStats(
  expenses: Expense[],
  media: Media[],
  members: Member[]
): TripStats {
  const totalSpentPaise = calculateTripTotal(expenses);
  const { photoCount, videoCount } = calculatePhotoCounts(media);

  const highestExpense = expenses.reduce(
    (max, e) => Math.max(max, e.amount_paise),
    0
  );

  return {
    totalSpentPaise,
    averagePerPersonPaise: calculateAveragePerPerson(totalSpentPaise, members.length),
    highestExpensePaise: highestExpense,
    expenseCount: expenses.length,
    photoCount,
    videoCount,
    memberCount: members.length,
    dayCount: Math.max(
      new Set(expenses.map(e => e.expense_date)).size,
      1
    ),
  };
}

/** Generate dynamic Trip Pulse insights */
export function calculateTripPulse(
  expenses: Expense[],
  media: Media[],
  members: Member[],
  categories: Category[],
  currentMemberId?: string
): TripPulseItem[] {
  const items: TripPulseItem[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Today's spending
  const todayExpenses = expenses.filter(e => e.expense_date === today);
  const todaySpent = todayExpenses.reduce((s, e) => s + e.amount_paise, 0);
  if (todaySpent > 0) {
    const rupees = (todaySpent / 100).toFixed(0);
    items.push({ icon: '🔥', text: `₹${Number(rupees).toLocaleString('en-IN')} spent today`, highlight: true });
  }

  // Today's memories
  const todayMedia = media.filter(m => m.created_at.startsWith(today));
  if (todayMedia.length > 0) {
    items.push({ icon: '📸', text: `${todayMedia.length} memories added today` });
  }

  // Top spender
  const topSpenders = calculateTopSpenders(expenses, members);
  if (topSpenders.length > 0) {
    items.push({ icon: '🏆', text: `${topSpenders[0].member.name} is the top spender` });
  }

  // Biggest category
  const catTotals = calculateCategoryTotals(expenses, categories);
  if (catTotals.length > 0) {
    const top = catTotals[0];
    items.push({ icon: getCategoryEmoji(top.categoryName), text: `${top.categoryName} accounts for ${top.percentage}% of spending` });
  }

  // Total photos
  const { photoCount, videoCount } = calculatePhotoCounts(media);
  if (photoCount + videoCount > 0) {
    items.push({ icon: '🖼️', text: `${photoCount + videoCount} total memories captured` });
  }

  // Member count
  items.push({ icon: '👥', text: `${members.length} friends on this trip` });

  return items.slice(0, 6);
}

function getCategoryEmoji(name: string): string {
  const map: Record<string, string> = {
    Food: '🍕', Stay: '🏨', Travel: '✈️', Fuel: '⛽',
    Activities: '🎯', Shopping: '🛍️', Drinks: '🍺',
    Tickets: '🎟️', Miscellaneous: '📦',
  };
  return map[name] || '💰';
}
