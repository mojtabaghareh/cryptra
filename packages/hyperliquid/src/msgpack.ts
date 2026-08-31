/**
 * Minimal MessagePack encoder matching Hyperliquid / Python SDK expectations.
 * Only encodes types needed for L1 trading actions (maps, arrays, strings, bools, ints).
 * Map key order follows object insertion order (critical for HL hashes).
 */

function encodeUint(n: number): Uint8Array {
  if (n < 0) throw new Error('msgpack: negative uint');
  if (n < 128) return Uint8Array.of(n);
  if (n < 256) return Uint8Array.of(0xcc, n);
  if (n < 65536) return Uint8Array.of(0xcd, (n >> 8) & 0xff, n & 0xff);
  return Uint8Array.of(
    0xce,
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  );
}

function encodeInt(n: number): Uint8Array {
  if (Number.isInteger(n) && n >= 0) return encodeUint(n);
  if (Number.isInteger(n) && n >= -32) return Uint8Array.of(n & 0xff);
  if (Number.isInteger(n) && n >= -128) return Uint8Array.of(0xd0, n & 0xff);
  if (Number.isInteger(n) && n >= -32768) {
    const v = n & 0xffff;
    return Uint8Array.of(0xd1, (v >> 8) & 0xff, v & 0xff);
  }
  const v = n | 0;
  return Uint8Array.of(
    0xd2,
    (v >>> 24) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 8) & 0xff,
    v & 0xff,
  );
}

function encodeString(s: string): Uint8Array {
  const utf8 = new TextEncoder().encode(s);
  const len = utf8.length;
  let header: Uint8Array;
  if (len < 32) header = Uint8Array.of(0xa0 | len);
  else if (len < 256) header = Uint8Array.of(0xd9, len);
  else if (len < 65536) header = Uint8Array.of(0xda, (len >> 8) & 0xff, len & 0xff);
  else {
    header = Uint8Array.of(
      0xdb,
      (len >>> 24) & 0xff,
      (len >>> 16) & 0xff,
      (len >>> 8) & 0xff,
      len & 0xff,
    );
  }
  const out = new Uint8Array(header.length + utf8.length);
  out.set(header, 0);
  out.set(utf8, header.length);
  return out;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export function msgpackEncode(value: unknown): Uint8Array {
  if (value === null || value === undefined) {
    return Uint8Array.of(0xc0);
  }
  if (typeof value === 'boolean') {
    return Uint8Array.of(value ? 0xc3 : 0xc2);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('msgpack: non-finite number');
    return encodeInt(value);
  }
  if (typeof value === 'string') {
    return encodeString(value);
  }
  if (Array.isArray(value)) {
    const len = value.length;
    let header: Uint8Array;
    if (len < 16) header = Uint8Array.of(0x90 | len);
    else if (len < 65536) header = Uint8Array.of(0xdc, (len >> 8) & 0xff, len & 0xff);
    else {
      header = Uint8Array.of(
        0xdd,
        (len >>> 24) & 0xff,
        (len >>> 16) & 0xff,
        (len >>> 8) & 0xff,
        len & 0xff,
      );
    }
    return concat([header, ...value.map((v) => msgpackEncode(v))]);
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    const len = entries.length;
    let header: Uint8Array;
    if (len < 16) header = Uint8Array.of(0x80 | len);
    else if (len < 65536) header = Uint8Array.of(0xde, (len >> 8) & 0xff, len & 0xff);
    else {
      header = Uint8Array.of(
        0xdf,
        (len >>> 24) & 0xff,
        (len >>> 16) & 0xff,
        (len >>> 8) & 0xff,
        len & 0xff,
      );
    }
    const parts: Uint8Array[] = [header];
    for (const [k, v] of entries) {
      parts.push(encodeString(k));
      parts.push(msgpackEncode(v));
    }
    return concat(parts);
  }
  throw new Error(`msgpack: unsupported type ${typeof value}`);
}
