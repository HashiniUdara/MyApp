/**
 * Client-side UUID v4 generator.
 * Used to assign IDs to records created while offline so they have a
 * stable identity before they are synced to Supabase.
 *
 * Uses crypto.getRandomValues when available (React Native 0.69+ exposes
 * the Web Crypto API via JavaScriptCore / Hermes). Falls back to
 * Math.random() for environments that do not expose it.
 */
export function generateUUID() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    // RFC-4122 v4 UUID using crypto.getRandomValues
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-');
  }

  // Fallback — Math.random() (less entropy, but fine for offline IDs)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
