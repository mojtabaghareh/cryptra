import { PublicKey, type ParsedTransactionWithMeta } from '@solana/web3.js';
import { getSolanaConnection, SOLANA_NETWORK_ID } from '../networks/WalletNetworks';

export interface SolanaHistoryEntry {
  networkId: typeof SOLANA_NETWORK_ID;
  txHash: string;
  from: string;
  to: string | null;
  valueRaw: string;
  status: 'confirmed' | 'failed';
  blockNumber: number | null;
  timestamp: string | null;
  raw: ParsedTransactionWithMeta | null;
}

/**
 * Fetches real Solana transaction history via
 * connection.getSignaturesForAddress + getParsedTransaction.
 */
export class SolanaHistory {
  async getHistory(address: string, limit = 50): Promise<SolanaHistoryEntry[]> {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(address);

    const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

    const transactions = await Promise.all(
      signatures.map((sig) =>
        connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 }),
      ),
    );

    return signatures.map((sig, i) => ({
      networkId: SOLANA_NETWORK_ID,
      txHash: sig.signature,
      from: address,
      to: null,
      valueRaw: '0',
      status: sig.err ? ('failed' as const) : ('confirmed' as const),
      blockNumber: sig.slot,
      timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
      raw: transactions[i],
    }));
  }
}

