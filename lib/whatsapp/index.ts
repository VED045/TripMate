// =============================================================================
// WhatsApp Formatted Expense Helper
// Generates formatted text messages for expense logs & trip sharing
// =============================================================================

import type { ExpenseWithDetails } from '@/types';
import { paiseToRupees } from '@/lib/currency';

export function formatExpenseForWhatsApp(
  expense: ExpenseWithDetails,
  tripName: string,
  whatsappGroupLink?: string | null
): string {
  const amountRupees = paiseToRupees(expense.amount_paise).toFixed(2);
  const paidBy = expense.paid_by_member?.name || 'Someone';
  const categoryIcon = expense.category?.icon ? `${expense.category.icon} ` : '';
  const categoryName = expense.category?.name || 'General';

  const splitsSummary = expense.splits && expense.splits.length > 0
    ? expense.splits
        .map((s) => `${s.member?.name || 'Member'}: ₹${paiseToRupees(s.amount_paise).toFixed(2)}`)
        .join('\n  • ')
    : 'Equal split';

  let text = `💸 *Expense Logged on TripMate*\n\n`;
  text += `📍 *Trip*: ${tripName}\n`;
  text += `📌 *Item*: ${expense.title}\n`;
  text += `💰 *Total Amount*: ₹${amountRupees}\n`;
  text += `🏷️ *Category*: ${categoryIcon}${categoryName}\n`;
  text += `👤 *Paid By*: ${paidBy}\n\n`;
  text += `👥 *Splits Breakdown*:\n  • ${splitsSummary}\n\n`;
  text += `📅 *Date*: ${expense.expense_date}\n`;

  if (whatsappGroupLink) {
    text += `\n💬 *Group Link*: ${whatsappGroupLink}\n`;
  }

  if (typeof window !== 'undefined') {
    text += `🔗 *View Trip*: ${window.location.origin}/trip`;
  }

  return text;
}

export function shareExpenseToWhatsApp(
  expense: ExpenseWithDetails,
  tripName: string,
  whatsappGroupLink?: string | null
) {
  const message = formatExpenseForWhatsApp(expense, tripName, whatsappGroupLink);
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encoded}`;
  window.open(whatsappUrl, '_blank');
}
