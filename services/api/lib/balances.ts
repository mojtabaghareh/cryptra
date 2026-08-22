/**
 * On-chain native balance readers (no heavy SDK).
 */

const EVM_RPC =
  process.env.EVM_RPC_URL ||
  (process.env.ALCHEMY_API_KEY
    ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : 'https://ethereum.publicnode.com');

const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export interface NativeBalance {
  symbol: string;
  chain: 'EVM' | 'SOLANA' | 'TON';
  address: string;
  balance: string;
  balanceFormatted: string;
  decimals: number;
  error?: string;
}

async function rpcJson(url: string, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || 'RPC error');
  }
  return json.result;
}

export async function getEvmNativeBalance(address: string): Promise<NativeBalance> {
  try {
    const hex = (await rpcJson(EVM_RPC, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    })) as string;

    const wei = BigInt(hex);
    const eth = Number(wei) / 1e18;

    return {
      symbol: 'ETH',
      chain: 'EVM',
      address,
      balance: wei.toString(),
      balanceFormatted: eth.toFixed(6),
      decimals: 18,
    };
  } catch (e) {
    return {
      symbol: 'ETH',
      chain: 'EVM',
      address,
      balance: '0',
      balanceFormatted: '0',
      decimals: 18,
      error: e instanceof Error ? e.message : 'failed',
    };
  }
}

export async function getSolanaNativeBalance(address: string): Promise<NativeBalance> {
  try {
    const result = await rpcJson(SOLANA_RPC, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    });

    const lamports = Number(result?.value ?? 0);
    const sol = lamports / 1e9;

    return {
      symbol: 'SOL',
      chain: 'SOLANA',
      address,
      balance: String(lamports),
      balanceFormatted: sol.toFixed(6),
      decimals: 9,
    };
  } catch (e) {
    return {
      symbol: 'SOL',
      chain: 'SOLANA',
      address,
      balance: '0',
      balanceFormatted: '0',
      decimals: 9,
      error: e instanceof Error ? e.message : 'failed',
    };
  }
}

export async function getNativeBalance(
  chainType: string,
  address: string,
): Promise<NativeBalance> {
  if (chainType === 'SOLANA') return getSolanaNativeBalance(address);
  if (chainType === 'EVM') return getEvmNativeBalance(address);
  return {
    symbol: chainType,
    chain: 'TON',
    address,
    balance: '0',
    balanceFormatted: '0',
    decimals: 9,
    error: 'TON balance not implemented yet',
  };
}
