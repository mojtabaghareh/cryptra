import { type EvmChainId, getChainMetadata } from '@cryptra/core';
import { getEvmProvider } from '../networks/WalletNetworks';

export interface EvmHistoryEntry {
  networkId: EvmChainId;
  txHash: string;
  from: string;
  to: string | null;
  valueRaw: string;
  status: 'confirmed' | 'failed';
  blockNumber: number | null;
  timestamp: string | null;
  raw: unknown;
}

/**
 * Fetches real EVM transaction history:
 *  - Etherscan-compatible "account" module (txlist) when an explorer API
 *    key is configured (EXPLORER_API_KEY_<CHAINKEY> env var).
 *  - Falls back to raw eth_getLogs lookups over a recent block window
 *    when no explorer API key is configured.
 */
export class EVMHistory {
  async getHistory(
    address: string,
    chainId: EvmChainId,
    options: { page?: number; offset?: number } = {},
  ): Promise<EvmHistoryEntry[]> {
    const meta = getChainMetadata(chainId);
    const apiKey = process.env[`EXPLORER_API_KEY_${meta.key.toUpperCase()}`];

    if (!apiKey) {
      return this.getHistoryFromChain(address, chainId);
    }

    const url = new URL(`https://api.etherscan.io/v2/api?chainid=${meta.id}`);
    url.searchParams.set('module', 'account');
    url.searchParams.set('action', 'txlist');
    url.searchParams.set('address', address);
    url.searchParams.set('page', String(options.page ?? 1));
    url.searchParams.set('offset', String(options.offset ?? 50));
    url.searchParams.set('sort', 'desc');
    url.searchParams.set('apikey', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Explorer API request failed with status ${response.status}`);
    }

    const body = (await response.json()) as {
      status: string;
      result: Array<{
        hash: string;
        from: string;
        to: string;
        value: string;
        blockNumber: string;
        timeStamp: string;
        isError: string;
      }>;
    };

    if (body.status !== '1') return [];

    return body.result.map((tx) => ({
      networkId: chainId,
      txHash: tx.hash,
      from: tx.from,
      to: tx.to || null,
      valueRaw: tx.value,
      status: tx.isError === '0' ? ('confirmed' as const) : ('failed' as const),
      blockNumber: Number(tx.blockNumber),
      timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
      raw: tx,
    }));
  }

  private async getHistoryFromChain(address: string, chainId: EvmChainId): Promise<EvmHistoryEntry[]> {
    const provider = getEvmProvider(chainId);
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 5_000);

    const [sentLogs, receivedLogs] = await Promise.all([
      provider.getLogs({ fromBlock, toBlock: latestBlock, address }),
      provider.getLogs({ fromBlock, toBlock: latestBlock, topics: [null, null, null] }),
    ]);

    const relevantLogs = [...sentLogs, ...receivedLogs];

    return relevantLogs.map((log) => ({
      networkId: chainId,
      txHash: log.transactionHash,
      from: address,
      to: log.address,
      valueRaw: '0',
      status: 'confirmed' as const,
      blockNumber: log.blockNumber,
      timestamp: null,
      raw: log,
    }));
  }
}

