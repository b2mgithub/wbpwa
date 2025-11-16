/**
 * RFC4122 v4-like GUID generator for client-side ids.
 * Uses crypto.getRandomValues when available and falls back to Math.random.
 */
export function generateGuid(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as unknown as { getRandomValues?: (buf: Uint8Array) => void }).getRandomValues === 'function') {
    const buf = new Uint8Array(16);
    (crypto as unknown as { getRandomValues: (buf: Uint8Array) => void }).getRandomValues(buf);
    // Adapted from common uuid v4 implementation
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return (
      Array.from(buf).slice(0, 4).map(toHex).join('') + '-' +
      Array.from(buf).slice(4, 6).map(toHex).join('') + '-' +
      Array.from(buf).slice(6, 8).map(toHex).join('') + '-' +
      Array.from(buf).slice(8, 10).map(toHex).join('') + '-' +
      Array.from(buf).slice(10, 16).map(toHex).join('')
    );
  }

  // Fallback (not cryptographically strong)
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export default generateGuid;
