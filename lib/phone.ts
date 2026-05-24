/**
 * Normalize a Cambodian phone number to its local digits only.
 * Strips spaces, dashes, the +855 country code, and a leading 0.
 * Examples:
 *   "+855 96 123 456" → "96123456"
 *   "096123456"       → "96123456"
 *   "096 123 456"     → "96123456"
 *   "+85596123456"    → "96123456"
 */
export function normalizePhone(phone: string): string {
  return phone
    .replace(/[\s\-().]/g, "")   // remove spaces, dashes, parentheses, dots
    .replace(/^\+855/, "")        // strip Cambodia country code
    .replace(/^0/, "");           // strip leading 0
}
