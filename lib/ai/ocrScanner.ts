import { createWorker } from 'tesseract.js';
import type { ItemFormRow } from '@/types';
import { extractJsonObject, generateLocalJsonWithStatus } from '@/lib/ai/localModel';

export interface OcrResult {
  merchant?: string;
  subtotal: number;
  gstPercent: number;
  total: number;
  items: ItemFormRow[];
  rawText: string;
  confidence: number;
  aiAssisted?: boolean;
  missingFields?: string[];
}

/**
 * Perform client-side OCR on a receipt image.
 * Extracts items, prices, quantities, subtotal, and GST.
 */
export async function scanReceiptImage(imageSource: File | Blob | string): Promise<OcrResult> {
  let worker = null;
  let rawText = '';

  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(imageSource);
    rawText = ret.data.text || '';
    await worker.terminate();
  } catch (err) {
    console.warn('[scanReceiptImage] Tesseract fallback triggered:', err);
    if (worker) {
      try { await worker.terminate(); } catch {}
    }
  }

  const parsed = parseReceiptText(rawText);
  return refineReceiptWithLocalAi(parsed);
}

async function refineReceiptWithLocalAi(parsed: OcrResult): Promise<OcrResult> {
  if (!parsed.rawText.trim()) return parsed;
  try {
    const generation = await generateLocalJsonWithStatus(
      'Read this OCR text from an Indian receipt. Extract only values actually present. Return {"merchant":string|null,"subtotal":number|null,"gstPercent":number|null,"total":number|null,"items":[{"name":string,"quantity":number,"unitPrice":number}]}. Do not invent an item, amount, tax, or total. Item unitPrice must be the per-item price, not the line total.',
      parsed.rawText,
    );
    const suggestion = generation.text ? extractJsonObject(generation.text) : null;
    if (!suggestion || !generation.tier) return parsed;

    const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    const itemRows = Array.isArray(suggestion.items)
      ? suggestion.items.flatMap((item, index) => {
          if (!item || typeof item !== 'object') return [];
          const row = item as Record<string, unknown>;
          const name = typeof row.name === 'string' ? row.name.trim() : '';
          const quantity = numberValue(row.quantity);
          const unitPrice = numberValue(row.unitPrice);
          if (!name || !quantity || !unitPrice) return [];
          return [{ id: `ai-${index}-${crypto.randomUUID()}`, name, quantity, unitPriceRupees: unitPrice, gstRatePercent: 0, assignments: [] } satisfies ItemFormRow];
        })
      : [];
    const suggestedTotal = numberValue(suggestion.total);
    const suggestedSubtotal = numberValue(suggestion.subtotal);
    // Only let AI fill a missing number. Receipt totals remain grounded in OCR/rules.
    const nextItems = parsed.items.length > 0 ? parsed.items : itemRows;
    const nextSubtotal = parsed.subtotal > 0 ? parsed.subtotal : (suggestedSubtotal ?? nextItems.reduce((sum, item) => sum + item.quantity * item.unitPriceRupees, 0));
    const nextTotal = parsed.total > 0 ? parsed.total : (suggestedTotal ?? nextSubtotal);
    const nextMerchant = parsed.merchant || (typeof suggestion.merchant === 'string' ? suggestion.merchant.trim() || undefined : undefined);
    const nextGst = parsed.gstPercent || numberValue(suggestion.gstPercent) || 0;
    const missingFields = [
      !nextMerchant && 'merchant',
      !nextTotal && 'total',
      nextItems.length === 0 && 'line items',
    ].filter(Boolean) as string[];

    return {
      ...parsed,
      merchant: nextMerchant,
      subtotal: nextSubtotal,
      total: nextTotal,
      gstPercent: nextGst,
      items: nextItems,
      confidence: Math.min(0.95, Math.max(parsed.confidence, nextItems.length ? 0.78 : 0.55)),
      aiAssisted: true,
      missingFields,
    };
  } catch {
    return parsed;
  }
}

/**
 * Parses raw text extracted from a receipt image.
 */
export function parseReceiptText(text: string): OcrResult {
  if (!text || !text.trim()) {
    return {
      subtotal: 0,
      gstPercent: 5,
      total: 0,
      items: [],
      rawText: '',
      confidence: 0,
    };
  }

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items: ItemFormRow[] = [];
  let detectedSubtotal = 0;
  let detectedTotal = 0;
  let detectedGstPercent = 5;
  let merchant = '';

  if (lines.length > 0) {
    merchant = lines[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
  }

  lines.forEach(line => {
    const lower = line.toLowerCase();

    // Check for total
    if (lower.includes('grand total') || lower.includes('net amount') || lower.includes('total')) {
      const match = line.match(/(?:rs\.?|₹|\:|\s|^)(\d+(?:\.\d+)?)\b/i);
      if (match) {
        const val = parseFloat(match[1]);
        if (val > detectedTotal) detectedTotal = val;
      }
    }

    // Check for subtotal
    if (lower.includes('subtotal') || lower.includes('sub total')) {
      const match = line.match(/(?:rs\.?|₹|\:|\s|^)(\d+(?:\.\d+)?)\b/i);
      if (match) {
        detectedSubtotal = parseFloat(match[1]);
      }
    }

    // Check for GST percentage
    if (lower.includes('gst') || lower.includes('cgst') || lower.includes('sgst')) {
      const gstMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
      if (gstMatch) {
        detectedGstPercent = parseFloat(gstMatch[1]);
      }
    }

    // Parse line items: e.g. "Dosa 2 170 340" or "Coffee x1 40"
    const itemMatch = line.match(/^([a-zA-Z\s]{2,25})\s+(\d+)?\s*(?:x|\*)?\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)/i);
    if (itemMatch && !lower.includes('total') && !lower.includes('gst') && !lower.includes('thank')) {
      const name = itemMatch[1].trim();
      const qty = itemMatch[2] ? parseInt(itemMatch[2], 10) : 1;
      const unitPrice = parseFloat(itemMatch[3]) || 0;

      if (name.length >= 2 && unitPrice > 0) {
        items.push({
          id: crypto.randomUUID(),
          name: name.charAt(0).toUpperCase() + name.slice(1),
          quantity: qty,
          unitPriceRupees: unitPrice,
          gstRatePercent: 0,
          assignments: [],
        });
      }
    }
  });

  // Calculate subtotal from items if not found
  if (detectedSubtotal === 0 && items.length > 0) {
    detectedSubtotal = items.reduce((s, item) => s + item.quantity * item.unitPriceRupees, 0);
  }
  if (detectedTotal === 0) {
    detectedTotal = detectedSubtotal + (detectedSubtotal * detectedGstPercent) / 100;
  }

  const missingFields = [
    !merchant && 'merchant',
    !detectedTotal && 'total',
    items.length === 0 && 'line items',
  ].filter(Boolean) as string[];

  return {
    merchant: merchant.length > 2 ? merchant : undefined,
    subtotal: detectedSubtotal,
    gstPercent: detectedGstPercent,
    total: detectedTotal,
    items,
    rawText: text,
    confidence: items.length > 0 ? 0.8 : 0.4,
    missingFields,
  };
}
