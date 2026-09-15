import type { Member, ItemFormRow } from '@/types';

interface ParsedResult {
  items: ItemFormRow[];
  confidence: number;
}

/**
 * Natural language item & split parser.
 * Handles inputs like:
 * "Ved ate a dosa and coffee. bro ate a dosa and tea."
 * "Ved: 2 dosas for 340, 1 coffee 40. bro: 1 tea 20."
 */
export function parseNaturalLanguageBill(text: string, members: Member[]): ParsedResult {
  if (!text || !text.trim()) {
    return { items: [], confidence: 0 };
  }

  const itemsMap: Map<string, ItemFormRow> = new Map();
  const normalizedText = text.trim();

  // Split into sentences / lines
  const sentences = normalizedText.split(/[.\n;]+/).filter(s => s.trim().length > 0);

  sentences.forEach(sentence => {
    // Find matching member in this sentence
    const memberMatches = members.filter(m =>
      sentence.toLowerCase().includes(m.name.toLowerCase())
    );

    if (memberMatches.length === 0) return;

    // Remove member names to extract item text
    let itemText = sentence;
    memberMatches.forEach(m => {
      const regex = new RegExp(`\\b${m.name}\\b`, 'gi');
      itemText = itemText.replace(regex, '');
    });

    // Clean common connectives: "ate", "had", "ordered", "and", "for", "a", "an"
    itemText = itemText
      .replace(/\b(ate|had|ordered|paid for|took|shares|and|with|for|a|an)\b/gi, ',')
      .replace(/[:]+/g, ',');

    // Split items by commas or "and"
    const itemTokens = itemText.split(/[,]+/).map(t => t.trim()).filter(t => t.length > 0);

    itemTokens.forEach(token => {
      // Parse quantity and price if present (e.g., "2 dosas", "dosa 170", "dosa 170 each")
      const qtyMatch = token.match(/(\d+(?:\.\d+)?)\s*(x|\*|dosas?|coffees?|teas?|cabs?|pizzas?|beers?|burger?|items?)?/i);
      let qty = 1;

      // Extract trailing price numbers like "(340)" or "340" or "rs 170"
      const priceMatch = token.match(/(?:rs\.?|₹|\b)(\d+(?:\.\d+)?)\b/i);
      let unitPrice = 0;
      if (priceMatch) {
        unitPrice = parseFloat(priceMatch[1]);
      }

      if (qtyMatch && parseFloat(qtyMatch[1]) > 0 && parseFloat(qtyMatch[1]) <= 50) {
        // If the number looks like a quantity (not a large price)
        if (parseFloat(qtyMatch[1]) < 100 || !priceMatch) {
          qty = parseFloat(qtyMatch[1]);
        }
      }

      // Clean item name
      let name = token
        .replace(/\b\d+(?:\.\d+)?\b/g, '')
        .replace(/(?:rs\.?|₹|x|\*|each)/gi, '')
        .trim();

      if (!name || name.length < 2) return;
      name = name.charAt(0).toUpperCase() + name.slice(1);

      // Unique key for grouping identical items
      const itemKey = name.toLowerCase();

      if (itemsMap.has(itemKey)) {
        const existing = itemsMap.get(itemKey)!;
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
        const newItem: ItemFormRow = {
          id: crypto.randomUUID(),
          name,
          quantity: qty,
          unitPriceRupees: unitPrice,
          gstRatePercent: 0,
          assignments: memberMatches.map(m => ({ memberId: m.id, quantity: qty })),
        };
        itemsMap.set(itemKey, newItem);
      }
    });
  });

  const items = Array.from(itemsMap.values());
  return {
    items,
    confidence: items.length > 0 ? 0.85 : 0,
  };
}
