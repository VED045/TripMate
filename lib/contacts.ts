/**
 * Helper utility for phone contacts and WhatsApp direct links
 */

export interface ContactPickResult {
  name: string;
  phone?: string;
}

/**
 * Pick contact(s) from phone using Web Contact Picker API (navigator.contacts)
 */
export async function pickPhoneContacts(): Promise<ContactPickResult[]> {
  if (typeof window !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const contacts = await (navigator as any).contacts.select(props, opts);
      if (Array.isArray(contacts) && contacts.length > 0) {
        return contacts.map((c: any) => {
          const rawName = (c.name && c.name[0]) ? c.name[0] : 'Contact';
          const rawTel = (c.tel && c.tel[0]) ? c.tel[0] : undefined;
          return {
            name: rawName,
            phone: rawTel ? rawTel.replace(/[^0-9+]/g, '') : undefined,
          };
        });
      }
    } catch (e: any) {
      if (e.name !== 'InvalidStateError' && e.name !== 'AbortError') {
        console.warn('Contact picker failed:', e);
      }
    }
  }
  return [];
}

/**
 * Parse VCF / vCard file content
 */
export function parseVcfContent(vcfText: string): ContactPickResult[] {
  const results: ContactPickResult[] = [];
  const cards = vcfText.split(/END:VCARD/i);

  for (const card of cards) {
    let name = '';
    let phone = '';

    const lines = card.split(/\r?\n/);
    for (const line of lines) {
      if (line.toUpperCase().startsWith('FN:')) {
        name = line.substring(3).trim();
      } else if (!name && line.toUpperCase().startsWith('N:')) {
        const parts = line.substring(2).split(';');
        name = parts.filter(Boolean).reverse().join(' ').trim();
      }

      if (line.toUpperCase().includes('TEL')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          phone = parts.slice(1).join(':').trim().replace(/[^0-9+]/g, '');
        }
      }
    }

    if (name || phone) {
      results.push({ name: name || phone, phone: phone || undefined });
    }
  }

  return results;
}

/**
 * Clean phone number into digit string for WhatsApp wa.me link
 */
export function getCleanWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;

  // Standard Indian 10-digit number -> prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  return digits;
}

/**
 * Build direct WhatsApp chat link for a specific phone number or general share
 */
export function formatWhatsAppUrl(phone?: string | null, message?: string): string {
  const encodedText = message ? encodeURIComponent(message) : '';
  const cleanPhone = getCleanWhatsAppPhone(phone);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ''}`;
  }

  return `https://wa.me/?text=${encodedText}`;
}
