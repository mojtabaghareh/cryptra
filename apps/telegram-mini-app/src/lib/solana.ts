/**
 * Phantom / Solana injected wallet helpers (no @solana/web3.js required for connect+sign).
 */

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toString: () => string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    display?: 'utf8' | 'hex',
  ) => Promise<{ signature: Uint8Array; publicKey: { toString: () => string } }>;
}

function bytesToBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;

  const digits = [0];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let str = '';
  for (let i = 0; i < zeros; i++) str += '1';
  for (let i = digits.length - 1; i >= 0; i--) str += ALPHABET[digits[i]];
  return str;
}

export function getPhantom(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  const sol = (window as unknown as { solana?: PhantomProvider & { isPhantom?: boolean } }).solana;
  if (sol?.isPhantom) return sol;
  const phantom = (window as unknown as { phantom?: { solana?: PhantomProvider } }).phantom?.solana;
  return phantom ?? null;
}

export function isPhantomAvailable(): boolean {
  return Boolean(getPhantom());
}

export async function connectPhantom(): Promise<{ address: string }> {
  const provider = getPhantom();
  if (!provider) {
    throw new Error('Phantom not found. Install Phantom or open in Phantom browser.');
  }
  const res = await provider.connect();
  const address = res.publicKey.toString();
  if (!address) throw new Error('No Solana address returned');
  return { address };
}

export async function signPhantomMessage(message: string): Promise<string> {
  const provider = getPhantom();
  if (!provider) throw new Error('Phantom not found');

  const encoded = new TextEncoder().encode(message);
  const { signature } = await provider.signMessage(encoded, 'utf8');
  return bytesToBase58(signature);
}

export function buildSolanaLinkMessage(address: string): string {
  const ts = Math.floor(Date.now() / 1000);
  return [
    'Cryptra — link Solana wallet',
    `Address: ${address}`,
    `Timestamp: ${ts}`,
    'Only sign this message on official Cryptra Mini App.',
  ].join('\n');
}
