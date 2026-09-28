// =============================================================================
// Natural Language Expense Parser
// 
// Parses sentences like:
//   "Omkar paid 2400 for dinner split between everyone"
//   "Swayam spent ₹500 on taxi, equal split with Ved"  
//   "Raj paid ₹1800 for hotel room, Omkar and Swayam owe him"
//   "food 1200 Raj paid"
//   "cab 340 split 4 ways"
//
// This is a deterministic rule-based parser — NO AI or LLM needed.
// Output must be validated before storing — AI never handles final arithmetic.
// =============================================================================

import type { Member } from '@/types';

export interface ParsedExpense {
  description: string;
  amountPaise: number;         // 0 = not detected
  paidByMemberId: string | null;
  splitType: 'equal' | 'exact' | 'custom' | 'unknown';
  participantIds: string[];     // empty = all members
  categoryHint: string | null;
  confidence: number;           // 0.0 to 1.0
  notes: string | null;
}

// Category keyword maps
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['food', 'dinner', 'lunch', 'breakfast', 'restaurant', 'meal', 'biryani', 'pizza', 'dosa', 'chai', 'chai', 'tea', 'coffee', 'snacks', 'hotel food', 'thali', 'cafe', 'eatery', 'shawarma'],
  stay: ['hotel', 'hostel', 'resort', 'stay', 'accommodation', 'airbnb', 'room', 'lodge', 'bnb', 'booking'],
  travel: ['cab', 'taxi', 'uber', 'ola', 'auto', 'rickshaw', 'bus', 'train', 'flight', 'ticket', 'fare', 'travel', 'commute', 'rapido', 'bike', 'ferry', 'boat'],
  fuel: ['fuel', 'petrol', 'diesel', 'gas', 'refuel', 'pump', 'cng', 'oil'],
  activity: ['activity', 'adventure', 'trek', 'hike', 'tour', 'show', 'museum', 'temple', 'beach', 'park', 'entry', 'ticket', 'pass', 'game'],
  shopping: ['shopping', 'market', 'buy', 'purchase', 'clothes', 'shop', 'groceries', 'medicine', 'pharmacy'],
};

/**
 * Parse a natural language sentence into a structured expense suggestion.
 */
export function parseNLExpense(text: string, members: Member[]): ParsedExpense {
  const result: ParsedExpense = {
    description: '',
    amountPaise: 0,
    paidByMemberId: null,
    splitType: 'equal',
    participantIds: [],
    categoryHint: null,
    confidence: 0,
    notes: null,
  };

  if (!text?.trim()) return result;

  const raw = text.trim();
  const lower = raw.toLowerCase();
  let confidence = 0;

  // ---- 1. Detect Amount ----
  // Patterns: ₹2400, Rs 2400, 2400 rupees, 2400, $100
  const amountPatterns = [
    /(?:₹|rs\.?\s*|inr\s*)(\d[\d,]*(?:\.\d{1,2})?)/i,  // ₹2400 or Rs 2400
    /(\d[\d,]*(?:\.\d{1,2})?)\s*(?:rs\.?|rupees?|inr)/i,  // 2400 rs
    /\$\s*(\d[\d,]*(?:\.\d{1,2})?)/i,  // $100
    /\b(\d{2,6}(?:\.\d{1,2})?)\b/,  // bare number (fallback)
  ];

  for (const pattern of amountPatterns) {
    const match = raw.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const amount = parseFloat(numStr);
      if (!isNaN(amount) && amount > 0 && amount < 10_00_000) {
        result.amountPaise = Math.round(amount * 100);
        confidence += 0.35;
        break;
      }
    }
  }

  // ---- 2. Detect Payer ----
  // Patterns: "Omkar paid", "Paid by Raj", "Swayam spent", "Raj paid for"
  const payerVerbs = ['paid', 'spent', 'bought', 'booked', 'covered', 'paid for', 'footed', 'splurged'];
  let payerFound = false;

  for (const member of members) {
    const memberLower = member.name.toLowerCase();
    
    // "Omkar paid", "Omkar spent"
    const verbAfterName = new RegExp(`\\b${escapeRegex(memberLower)}\\b.*?\\b(${payerVerbs.join('|')})\\b`, 'i');
    // "paid by Omkar", "covered by Raj"
    const verbBeforeName = new RegExp(`\\b(${payerVerbs.join('|')})\\s+by\\s+${escapeRegex(memberLower)}\\b`, 'i');
    // "Omkar:" at start
    const colonStyle = new RegExp(`^${escapeRegex(memberLower)}\\s*:`, 'i');

    if (verbAfterName.test(raw) || verbBeforeName.test(raw) || colonStyle.test(raw)) {
      result.paidByMemberId = member.id;
      confidence += 0.3;
      payerFound = true;
      break;
    }
  }

  // ---- 3. Detect Description / Category ----
  // Common prepositions before description: "for dinner", "on fuel", "for hotel stay"
  const descPatterns = [
    /\bfor\s+([a-z][a-z\s]{2,30}?)(?:\s+(?:split|between|with|everyone|all)|$)/i,
    /\bon\s+([a-z][a-z\s]{2,30}?)(?:\s+(?:split|between|with|everyone|all)|$)/i,
    /\bpaid\s+(?:for|on)\s+([a-z][a-z\s]{2,30}?)(?:\s+|$)/i,
  ];

  for (const pattern of descPatterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      const desc = match[1].trim();
      if (desc.length > 1 && !desc.match(/^\d+$/)) {
        result.description = capitalizeFirst(desc);
        confidence += 0.15;
        break;
      }
    }
  }

  // ---- 4. Detect Split Participants ----
  // "split between Omkar and Raj", "with Swayam", "everyone", "all", "whole group"
  const everyoneWords = ['everyone', 'all', 'whole group', 'entire group', 'all members', 'group'];
  const isEveryone = everyoneWords.some(w => lower.includes(w));

  if (isEveryone) {
    result.participantIds = members.map(m => m.id);
    result.splitType = 'equal';
    confidence += 0.05;
  } else {
    // Find named participants
    const namedParticipants: Member[] = [];
    for (const member of members) {
      if (lower.includes(member.name.toLowerCase())) {
        namedParticipants.push(member);
      }
    }
    if (namedParticipants.length > 0) {
      result.participantIds = namedParticipants.map(m => m.id);
      confidence += 0.05;
    }
  }

  // ---- 5. Detect Split Type ----
  if (lower.match(/\bequal(ly)?\b/) || lower.match(/\bsame\s+amount\b/) || lower.match(/\b(\d+)\s*ways?\b/)) {
    result.splitType = 'equal';
  } else if (lower.match(/\b(owes?|owe|borrowed|lent|borrow)\b/)) {
    result.splitType = 'exact';
  }

  // ---- 6. Category Detection ----
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      result.categoryHint = cat;
      break;
    }
  }

  // ---- 7. Fallback description from raw text ----
  if (!result.description && result.amountPaise > 0) {
    // Use the raw text, cleaned of amounts and member names
    let cleaned = raw;
    members.forEach(m => {
      cleaned = cleaned.replace(new RegExp(`\\b${escapeRegex(m.name)}\\b`, 'gi'), '');
    });
    cleaned = cleaned
      .replace(/₹[\d,]+(\.\d{1,2})?/g, '')
      .replace(/rs\.?\s*[\d,]+(\.\d{1,2})?/gi, '')
      .replace(/[\d,]+(\.\d{1,2})?\s*(rupees?|rs\.?|inr)?/gi, '')
      .replace(/\b(paid|spent|for|on|by|split|between|everyone|equal|with|and)\b/gi, '')
      .replace(/[^a-zA-Z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 2) {
      result.description = capitalizeFirst(cleaned);
    }
  }

  // Normalize confidence
  result.confidence = Math.min(confidence, 1.0);
  if (result.amountPaise > 0 && result.description) {
    result.confidence = Math.max(result.confidence, 0.5);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeFirst(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().trim();
}

// ---- Category suggestion from expense name ----
export function suggestCategory(name: string, categories: Array<{ id: string; name: string }>): string | null {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      const match = categories.find(c => c.name.toLowerCase() === cat || c.name.toLowerCase().includes(cat));
      if (match) return match.id;
    }
  }
  return null;
}

// ---- Duplicate detection ----
export function detectDuplicateExpense(
  newExpense: { amountPaise: number; description: string; createdAt: Date },
  existingExpenses: Array<{ amount_paise: number; description: string; created_at: string }>
): { isDuplicate: boolean; existingExpenseDescription?: string } {
  const threshold = 24 * 60 * 60 * 1000; // 24 hours in ms
  const now = newExpense.createdAt.getTime();

  for (const existing of existingExpenses) {
    const existingTime = new Date(existing.created_at).getTime();
    const timeDiff = Math.abs(now - existingTime);

    if (
      timeDiff < threshold &&
      existing.amount_paise === newExpense.amountPaise &&
      existing.description.toLowerCase().trim() === newExpense.description.toLowerCase().trim()
    ) {
      return { isDuplicate: true, existingExpenseDescription: existing.description };
    }
  }

  return { isDuplicate: false };
}
