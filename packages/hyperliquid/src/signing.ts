/**
 * Hyperliquid L1 action signing (orders, cancels, leverage).
 * Spec: msgpack(action) + nonce_u64_be + vault_marker → keccak256 → EIP-712 Agent
 * Domain chainId is always 1337. Source "a" = mainnet, "b" = testnet.
 */

import { Wallet, keccak256, Signature, verifyTypedData } from 'ethers';
import { msgpackEncode } from './msgpack';

export interface HlSignature {
  r: string;
  s: string;
  v: number;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function u64Be(n: number): Uint8Array {
  const buf = new Uint8Array(8);
  let x = BigInt(Math.floor(n));
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return buf;
}

function addressTo20(addr: string): Uint8Array {
  const hex = addr.startsWith('0x') ? addr.slice(2) : addr;
  if (hex.length !== 40) throw new Error(`Invalid vault address: ${addr}`);
  const out = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function createL1ActionHash(params: {
  action: Record<string, unknown>;
  nonce: number;
  vaultAddress?: string | null;
  expiresAfter?: number | null;
}): string {
  const actionBytes = msgpackEncode(params.action);
  const nonceBytes = u64Be(params.nonce);

  let tail: Uint8Array;
  if (params.vaultAddress) {
    tail = concatBytes(Uint8Array.of(0x01), addressTo20(params.vaultAddress));
  } else {
    tail = Uint8Array.of(0x00);
  }

  let expires: Uint8Array = new Uint8Array(0);
  if (params.expiresAfter != null) {
    expires = concatBytes(Uint8Array.of(0x00), u64Be(params.expiresAfter));
  }

  const payload = concatBytes(actionBytes, nonceBytes, tail, expires);
  return keccak256(payload);
}

export async function signL1Action(params: {
  privateKey: string;
  action: Record<string, unknown>;
  nonce: number;
  isMainnet?: boolean;
  vaultAddress?: string | null;
  expiresAfter?: number | null;
}): Promise<HlSignature> {
  const key = params.privateKey.startsWith('0x') ? params.privateKey : `0x${params.privateKey}`;
  const wallet = new Wallet(key);

  const connectionId = createL1ActionHash({
    action: params.action,
    nonce: params.nonce,
    vaultAddress: params.vaultAddress,
    expiresAfter: params.expiresAfter,
  });

  const domain = {
    name: 'Exchange',
    version: '1',
    chainId: 1337,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  } as const;

  const types = {
    Agent: [
      { name: 'source', type: 'string' },
      { name: 'connectionId', type: 'bytes32' },
    ],
  };

  const message = {
    source: params.isMainnet === false ? 'b' : 'a',
    connectionId: connectionId as `0x${string}`,
  };

  const sigHex = await wallet.signTypedData(domain, types, message);
  const sig = Signature.from(sigHex);

  return {
    r: sig.r,
    s: sig.s,
    v: sig.v,
  };
}

export function buildOrderAction(params: {
  assetIndex: number;
  isBuy: boolean;
  price: string;
  size: string;
  reduceOnly?: boolean;
  tif?: 'Ioc' | 'Gtc' | 'Alo';
}): Record<string, unknown> {
  return {
    type: 'order',
    orders: [
      {
        a: params.assetIndex,
        b: params.isBuy,
        p: params.price,
        s: params.size,
        r: params.reduceOnly ?? false,
        t: { limit: { tif: params.tif ?? 'Ioc' } },
      },
    ],
    grouping: 'na',
  };
}

export function buildUpdateLeverageAction(params: {
  assetIndex: number;
  isCross: boolean;
  leverage: number;
}): Record<string, unknown> {
  return {
    type: 'updateLeverage',
    asset: params.assetIndex,
    isCross: params.isCross,
    leverage: params.leverage,
  };
}

export function recoverSignerAddress(
  connectionId: string,
  signature: HlSignature,
  isMainnet: boolean,
): string {
  const domain = {
    name: 'Exchange',
    version: '1',
    chainId: 1337,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };
  const types = {
    Agent: [
      { name: 'source', type: 'string' },
      { name: 'connectionId', type: 'bytes32' },
    ],
  };
  const message = {
    source: isMainnet ? 'a' : 'b',
    connectionId,
  };
  const compact = Signature.from({ r: signature.r, s: signature.s, v: signature.v }).serialized;
  return verifyTypedData(domain, types, message, compact);
}
