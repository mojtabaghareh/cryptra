/**
 * Lightweight EVM helpers for Telegram Mini App (MetaMask / injected providers).
 */

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

export function getEthereum(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  return eth ?? null;
}

export function isMetaMaskAvailable(): boolean {
  return Boolean(getEthereum());
}

export async function connectMetaMask(): Promise<{
  address: string;
  chainId: number;
}> {
  const eth = getEthereum();
  if (!eth) {
    throw new Error('No injected wallet found. Install MetaMask or open in a wallet browser.');
  }

  const accounts = (await eth.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (!accounts?.[0]) {
    throw new Error('No account returned from wallet');
  }

  const chainHex = (await eth.request({ method: 'eth_chainId' })) as string;
  const chainId = parseInt(chainHex, 16);

  return {
    address: accounts[0],
    chainId: Number.isFinite(chainId) ? chainId : 1,
  };
}

export async function personalSign(address: string, message: string): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('No injected wallet');

  const signature = (await eth.request({
    method: 'personal_sign',
    params: [message, address],
  })) as string;

  return signature;
}

export function buildLinkMessage(address: string): string {
  const ts = Math.floor(Date.now() / 1000);
  return [
    'Cryptra — link wallet',
    `Address: ${address}`,
    `Timestamp: ${ts}`,
    'Only sign this message on cryptra.app / official Mini App.',
  ].join('\n');
}

/**
 * 1inch swap build typically returns { tx: { from, to, data, value, gas, gasPrice } }
 */
export async function sendOneInchTransaction(built: unknown, fromAddress: string): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('No injected wallet');

  const root = built as {
    tx?: {
      from?: string;
      to?: string;
      data?: string;
      value?: string;
      gas?: string | number;
      gasPrice?: string;
    };
    to?: string;
    data?: string;
    value?: string;
  };

  const tx = root.tx ?? root;
  if (!tx.to || !tx.data) {
    throw new Error('1inch build missing tx.to / tx.data');
  }

  const hash = (await eth.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: fromAddress,
        to: tx.to,
        data: tx.data,
        value: tx.value ?? '0x0',
        ...(tx.gas != null ? { gas: typeof tx.gas === 'number' ? '0x' + tx.gas.toString(16) : tx.gas } : {}),
        ...(tx.gasPrice ? { gasPrice: tx.gasPrice } : {}),
      },
    ],
  })) as string;

  return hash;
}
