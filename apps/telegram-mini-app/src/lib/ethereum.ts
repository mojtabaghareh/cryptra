/**
 * EVM wallet helpers — MetaMask, Trust, and any window.ethereum provider.
 * Supports sending swap txs from 1inch, 0x (Uniswap/Pancake), Kyber build payloads.
 */

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isTrust?: boolean;
  providers?: EthereumProvider[];
}

export function getEthereum(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { ethereum?: EthereumProvider };
  const eth = w.ethereum;
  if (!eth) return null;
  // Prefer MetaMask / Trust if multiple injected
  if (Array.isArray(eth.providers) && eth.providers.length) {
    const preferred =
      eth.providers.find((p) => p.isMetaMask) ||
      eth.providers.find((p) => p.isTrust) ||
      eth.providers[0];
    return preferred ?? eth;
  }
  return eth;
}

export function isMetaMaskAvailable(): boolean {
  return Boolean(getEthereum());
}

export async function connectMetaMask(): Promise<{ address: string; chainId: number }> {
  const eth = getEthereum();
  if (!eth) {
    throw new Error('No injected wallet. Install MetaMask/Trust or open in a wallet browser.');
  }

  const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts?.[0]) throw new Error('No account returned from wallet');

  const chainHex = (await eth.request({ method: 'eth_chainId' })) as string;
  const chainId = parseInt(chainHex, 16);

  return {
    address: accounts[0],
    chainId: Number.isFinite(chainId) ? chainId : 1,
  };
}

export async function switchChain(chainId: number): Promise<void> {
  const eth = getEthereum();
  if (!eth) throw new Error('No injected wallet');
  const hex = '0x' + chainId.toString(16);
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hex }],
    });
  } catch (e) {
    const err = e as { code?: number };
    if (err.code === 4902) {
      throw new Error(`Please add chain ${chainId} to your wallet, then retry.`);
    }
    throw e;
  }
}

export async function personalSign(address: string, message: string): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('No injected wallet');
  return (await eth.request({
    method: 'personal_sign',
    params: [message, address],
  })) as string;
}

export function buildLinkMessage(address: string): string {
  const ts = Math.floor(Date.now() / 1000);
  return [
    'Cryptra — link wallet',
    `Address: ${address}`,
    `Timestamp: ${ts}`,
    'Only sign this message on official Cryptra Mini App.',
  ].join('\n');
}

function toHexQuantity(v: string | number | undefined): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return '0x' + Math.floor(v).toString(16);
  if (typeof v === 'string') {
    if (v.startsWith('0x')) return v;
    if (/^\d+$/.test(v)) return '0x' + BigInt(v).toString(16);
    return v;
  }
  return undefined;
}

/**
 * Normalize 1inch / 0x / Kyber build payloads into { to, data, value, gas? }.
 */
export function extractEvmTx(built: unknown): {
  to: string;
  data: string;
  value: string;
  gas?: string;
  gasPrice?: string;
  chainId?: number;
} {
  const root = built as Record<string, unknown>;

  // 1inch: { tx: { to, data, value, gas } }
  const tx1 = root.tx as Record<string, unknown> | undefined;
  if (tx1?.to && tx1?.data) {
    return {
      to: String(tx1.to),
      data: String(tx1.data),
      value: toHexQuantity(tx1.value as string) ?? '0x0',
      gas: toHexQuantity(tx1.gas as string | number),
      gasPrice: toHexQuantity(tx1.gasPrice as string),
    };
  }

  // 0x v2 allowance-holder: { transaction: { to, data, value, gas } }
  const tx0 = root.transaction as Record<string, unknown> | undefined;
  if (tx0?.to && (tx0.data || tx0.input)) {
    return {
      to: String(tx0.to),
      data: String(tx0.data ?? tx0.input),
      value: toHexQuantity(tx0.value as string) ?? '0x0',
      gas: toHexQuantity(tx0.gas as string | number),
      chainId: typeof tx0.chainId === 'number' ? tx0.chainId : undefined,
    };
  }

  // Kyber build: { data: { data, routerAddress, transactionValue, gas } }
  const kyberData = root.data as Record<string, unknown> | undefined;
  if (kyberData && (kyberData.data || kyberData.encodedSwapData)) {
    const to = String(kyberData.routerAddress ?? kyberData.to ?? '');
    const data = String(kyberData.data ?? kyberData.encodedSwapData ?? '');
    if (to && data) {
      return {
        to,
        data,
        value: toHexQuantity(kyberData.transactionValue as string) ?? '0x0',
        gas: toHexQuantity(kyberData.gas as string | number),
      };
    }
  }

  // Flat shape
  if (root.to && root.data) {
    return {
      to: String(root.to),
      data: String(root.data),
      value: toHexQuantity(root.value as string) ?? '0x0',
      gas: toHexQuantity(root.gas as string | number),
    };
  }

  throw new Error('Unrecognized EVM swap payload — missing to/data');
}

/**
 * Sign & broadcast any supported EVM swap build via injected wallet.
 */
export async function sendEvmSwapTransaction(
  built: unknown,
  fromAddress: string,
  expectedChainId?: number,
): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('No injected wallet');

  if (expectedChainId != null) {
    const chainHex = (await eth.request({ method: 'eth_chainId' })) as string;
    const current = parseInt(chainHex, 16);
    if (current !== expectedChainId) {
      await switchChain(expectedChainId);
    }
  }

  const tx = extractEvmTx(built);

  const hash = (await eth.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: fromAddress,
        to: tx.to,
        data: tx.data,
        value: tx.value || '0x0',
        ...(tx.gas ? { gas: tx.gas } : {}),
        ...(tx.gasPrice ? { gasPrice: tx.gasPrice } : {}),
      },
    ],
  })) as string;

  if (!hash || typeof hash !== 'string') {
    throw new Error('Wallet did not return a transaction hash');
  }
  return hash;
}

/** @deprecated use sendEvmSwapTransaction */
export async function sendOneInchTransaction(built: unknown, fromAddress: string): Promise<string> {
  return sendEvmSwapTransaction(built, fromAddress);
}
