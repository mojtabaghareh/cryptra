/**
 * Lightweight EVM helpers for Telegram Mini App (MetaMask / injected providers).
 * No ethers dependency required in the mini-app bundle.
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

/**
 * EIP-191 personal_sign — message is the UTF-8 string, not hashed by us.
 * Wallet hashes with Ethereum signed message prefix.
 */
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
