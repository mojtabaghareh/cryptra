import { Address } from '@ton/core';
import { getTonClient, TON_NETWORK_ID } from '../networks/WalletNetworks';

export interface TonHistoryEntry {
  networkId: typeof TON_NETWORK_ID;
  txHash: string;
  from: string;
  to: string | null;
  valueRaw: string;
  status: 'confirmed';
  blockNumber: null;
  timestamp: string;
  raw: unknown;
}

/** Fetches real TON transaction history via @ton/ton TonClient.getTransactions. */
export class TonHistory {
  async getHistory(address: string, limit = 50): Promise<TonHistoryEntry[]> {
    const client = getTonClient();
    const tonAddress = Address.parse(address);

    const transactions = await client.getTransactions(tonAddress, { limit });

    return transactions.map((tx) => ({
      networkId: TON_NETWORK_ID,
      txHash: tx.hash().toString('hex'),
      from: address,
      to: tx.outMessages.get(0)?.info.dest?.toString() ?? null,
      valueRaw: tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.value.coins.toString() : '0',
      status: 'confirmed' as const,
      blockNumber: null,
      timestamp: new Date(tx.now * 1000).toISOString(),
      raw: tx,
    }));
  }
}

