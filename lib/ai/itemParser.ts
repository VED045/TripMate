import type { Member, ItemFormRow } from '@/types';

export interface ParsedItemResult {
  items: ItemFormRow[];
  confidence: number;
}

/**
 * Natural language item & price parser.
 * Supports:
 * 1. Simple itemized lists without members:
 *    "2 dosa 170"
 *    "coffee 40"
 *    "tea 20"
 *    "1 pizza 450"
 *    "3 beers 180 each"
 * 
 * 2. Natural language statements with members:
 *    "Ved ate a dosa and coffee. Mugdha ate a dosa and tea."
 *    "Ved: 2 dosas for 340, 1 coffee 40. Shree: 1 tea 20."
 */
export function parseNaturalLanguageBill(
  text: string,
  members: Member[] = [],
  defaultGstPercent: number = 0
): ParsedItemResult {
  if (!text || !text.trim()) {
    return { items: [], confidence: 0 };
  }

  const itemsMap: Map<string, ItemFormRow> = new Map();
  const normalizedText = text.trim();

  // Split lines / sentences
  const lines = normalizedText.split(/[\n;]+/).map(l => l.trim()).filter(Boolean);

  for (const rawLine of lines) {
    // Check if line mentions any known member
    const memberMatches = members.filter(m =>
      new RegExp(`\\b${m.name}\\b`, 'i').test(rawLine)
    );

    if (memberMatches.length > 0) {
      // Line contains member assignments (e.g. "Ved ate one dosa and coffee")
      parseMemberSentence(rawLine, memberMatches, itemsMap, defaultGstPercent);
    } else {
      // Pure item entry (e.g. "2 dosa 170", "coffee 40", "tea 20")
      parseItemLine(rawLine, itemsMap, defaultGstPercent);
    }
  }

  // If no items were parsed by line splitting, try splitting sentences by periods
  if (itemsMap.size === 0) {
    const sentences = normalizedText.split(/[.]+/).map(s => s.trim()).filter(Boolean);
    for (const sent of sentences) {
      const memberMatches = members.filter(m =>
        new RegExp(`\\b${m.name}\\b`, 'i').test(sent)
      );
      if (memberMatches.length > 0) {
        parseMemberSentence(sent, memberMatches, itemsMap, defaultGstPercent);
      } else {
        parseItemLine(sent, itemsMap, defaultGstPercent);
      }
    }
  }

  const items = Array.from(itemsMap.values());
  return {
    items,
    confidence: items.length > 0 ? 0.9 : 0,
  };
}

/**
 * Parses pure item lines like:
 * "2 dosa 170"
 * "coffee 40"
 * "tea 20"
 * "dosa x 2 = 340"
 * "2x dosa @ 170"
 */
function parseItemLine(
  line: string,
  itemsMap: Map<string, ItemFormRow>,
  defaultGst: number
) {
  // Strip currency symbols
  const clean = line.replace(/[$€£₹]|rs\.?/gi, ' ').trim();

  let qty = 1;
  let unitPrice = 0;
  let name = '';

  // Case A: Starts with quantity: "2 dosa 170" or "2x dosa 170"
  const startQtyMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:x|\*|-)?\s+(.+?)\s+(\d+(?:\.\d+)?)$/i);
  if (startQtyMatch) {
    qty = parseFloat(startQtyMatch[1]);
    name = startQtyMatch[2].trim();
    unitPrice = parseFloat(startQtyMatch[3]);
  } else {
    // Case B: Name followed by price: "coffee 40" or "cold coffee: 120"
    const namePriceMatch = clean.match(/^(.+?)[:\s]+(\d+(?:\.\d+)?)$/i);
    if (namePriceMatch) {
      name = namePriceMatch[1].trim();
      unitPrice = parseFloat(namePriceMatch[2]);

      // Check if name has leading quantity like "2 dosas"
      const leadQty = name.match(/^(\d+(?:\.\d+)?)\s*(?:x|\*|-)?\s+(.+)$/i);
      if (leadQty) {
        qty = parseFloat(leadQty[1]);
        name = leadQty[2].trim();
      }
    } else {
      // Case C: Just words and numbers anywhere
      const numbers = clean.match(/\b\d+(?:\.\d+)?\b/g);
      if (numbers && numbers.length >= 2) {
        qty = parseFloat(numbers[0]);
        unitPrice = parseFloat(numbers[numbers.length - 1]);
        name = clean.replace(new RegExp(`\\b(${numbers[0]}|${numbers[numbers.length - 1]})\\b`, 'g'), '').trim();
      } else if (numbers && numbers.length === 1) {
        unitPrice = parseFloat(numbers[0]);
        name = clean.replace(new RegExp(`\\b${numbers[0]}\\b`, 'g'), '').trim();
      } else {
        name = clean.trim();
      }
    }
  }

  // Clean name
  name = name
    .replace(/^(x|\*|for|each|cost|price|@|total)+/gi, '')
    .replace(/(for|each|cost|price|@|total|\=)+$/gi, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();

  if (!name || name.length < 2) return;
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const key = name.toLowerCase();
  if (itemsMap.has(key)) {
    const existing = itemsMap.get(key)!;
    existing.quantity += qty;
    if (unitPrice > 0) existing.unitPriceRupees = unitPrice;
  } else {
    itemsMap.set(key, {
      id: crypto.randomUUID(),
      name,
      quantity: qty || 1,
      unitPriceRupees: unitPrice || 0,
      gstRatePercent: defaultGst,
      assignments: [],
    });
  }
}

/**
 * Parses sentences with member names:
 * "Ved ate one dosa and coffee"
 * "Mugdha had 2 teas for 40 and 1 dosa 170"
 */
function parseMemberSentence(
  sentence: string,
  memberMatches: Member[],
  itemsMap: Map<string, ItemFormRow>,
  defaultGst: number
) {
  let itemText = sentence;
  memberMatches.forEach(m => {
    itemText = itemText.replace(new RegExp(`\\b${m.name}\\b`, 'gi'), '');
  });

  itemText = itemText
    .replace(/\b(ate|had|ordered|paid for|took|shares|and|with|for|a|an)\b/gi, ',')
    .replace(/[:]+/g, ',');

  const tokens = itemText.split(/[,]+/).map(t => t.trim()).filter(Boolean);

  tokens.forEach(token => {
    const cleanToken = token.replace(/[$€£₹]|rs\.?/gi, ' ').trim();
    const numbers = cleanToken.match(/\b\d+(?:\.\d+)?\b/g);

    let qty = 1;
    let unitPrice = 0;

    if (numbers && numbers.length >= 2) {
      qty = parseFloat(numbers[0]);
      unitPrice = parseFloat(numbers[1]);
    } else if (numbers && numbers.length === 1) {
      const num = parseFloat(numbers[0]);
      if (num >= 20) {
        unitPrice = num;
      } else {
        qty = num;
      }
    }

    let name = cleanToken
      .replace(/\b\d+(?:\.\d+)?\b/g, '')
      .replace(/(each|x|\*|total|price)/gi, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim();

    if (!name || name.length < 2) return;
    name = name.charAt(0).toUpperCase() + name.slice(1);

    const key = name.toLowerCase();
    if (itemsMap.has(key)) {
      const existing = itemsMap.get(key)!;
      memberMatches.forEach(m => {
        const assign = existing.assignments.find(a => a.memberId === m.id);
        if (assign) {
          assign.quantity += qty;
        } else {
          existing.assignments.push({ memberId: m.id, quantity: qty });
        }
      });
      if (unitPrice > 0) existing.unitPriceRupees = unitPrice;
    } else {
      itemsMap.set(key, {
        id: crypto.randomUUID(),
        name,
        quantity: qty,
        unitPriceRupees: unitPrice,
        gstRatePercent: defaultGst,
        assignments: memberMatches.map(m => ({ memberId: m.id, quantity: qty })),
      });
    }
  });
}
