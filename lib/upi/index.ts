// =============================================================================
// UPI Payment Link Generator
// Generates upi:// deep links for Indian UPI apps
// =============================================================================

export interface UpiPaymentOptions {
  recipientUpiId: string;
  recipientName: string;
  amountPaise: number;
  note?: string;
  transactionRef?: string;
}

export interface UpiValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate a UPI ID format */
export function validateUpiId(upiId: string): UpiValidationResult {
  if (!upiId) return { valid: false, error: 'UPI ID is required' };
  
  const upiRegex = /^[a-zA-Z0-9.\-_]{3,50}@[a-zA-Z]{2,20}$/;
  
  if (!upiRegex.test(upiId)) {
    return { valid: false, error: 'Invalid UPI ID format. Expected: name@provider' };
  }
  
  return { valid: true };
}

/**
 * Generate a UPI deep link.
 * Format: upi://pay?pa=upi_id&pn=name&am=amount&cu=INR&tn=note
 */
export function generateUpiPaymentLink(options: UpiPaymentOptions): string {
  const { recipientUpiId, recipientName, amountPaise, note, transactionRef } = options;
  
  const validation = validateUpiId(recipientUpiId);
  if (!validation.valid) {
    // Return standard link even if validation regex fails on unusual bank handles
  }
  
  if (amountPaise <= 0) {
    throw new Error('Amount must be positive');
  }
  
  const amountRupees = (amountPaise / 100).toFixed(2);
  
  const params = new URLSearchParams({
    pa: recipientUpiId,
    pn: recipientName,
    am: amountRupees,
    cu: 'INR',
  });
  
  if (note) params.set('tn', note);
  if (transactionRef) params.set('tr', transactionRef);
  
  return `upi://pay?${params.toString()}`;
}

export function generateUpiDeepLink({
  payeeUpiId,
  payeeName,
  amountRupees,
  note,
}: {
  payeeUpiId: string;
  payeeName: string;
  amountRupees: number;
  note?: string;
}): string {
  return generateUpiPaymentLink({
    recipientUpiId: payeeUpiId,
    recipientName: payeeName,
    amountPaise: Math.round(amountRupees * 100),
    note,
  });
}

export function generateUpiQrUrl({
  payeeUpiId,
  payeeName,
  amountRupees,
  note,
}: {
  payeeUpiId: string;
  payeeName: string;
  amountRupees: number;
  note?: string;
}): string {
  const upiUrl = generateUpiDeepLink({ payeeUpiId, payeeName, amountRupees, note });
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
}

export function generatePaytmLink(options: { payeeUpiId: string; payeeName: string; amountRupees: number; note?: string }): string {
  return generateUpiDeepLink(options);
}

export function generateGPayLink(options: { payeeUpiId: string; payeeName: string; amountRupees: number; note?: string }): string {
  return generateUpiDeepLink(options);
}

export function generateUpiIntentUrl(options: UpiPaymentOptions): string {
  return generateUpiPaymentLink(options);
}

export function isUpiSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('android') || ua.includes('mobile');
}
