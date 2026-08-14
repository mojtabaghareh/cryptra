import { Transaction as SolanaTransaction, VersionedTransaction } from '@solana/web3.js';
import { type NetworkId, isEvmNetwork, type EvmChainId } from '@cryptra/core';
import { getEvmProvider, getSolanaConnection } from '../networks/WalletNetworks';
import type { IWalletAdapter, PreparedEvmTransaction } from '../interfaces/IWalletAdapter';
import type { TonMessage } from '../adapters/TonConnectAdapter';

export interface EvmGasEstimate {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  estimatedCostRaw: string; // wei
}

export interface TransactionReceiptResult {
  txHash: string;
  status: 'confirmed' | 'failed';
  blockNumber?: number;
}

/**
 * Chain-agnostic orchestrator for preparing, estimating and sending
 * transactions. Actual signing is ALWAYS delegated to the connected
 * wallet's IWalletAdapter — this service never has access to a private key.
 */
export class WalletTransactionService {
  async estimateEvmGas(
    chainId: EvmChainId,
    from: string,
    tx: PreparedEvmTransaction,
  ): Promise<EvmGasEstimate> {
    const provider = getEvmProvider(chainId);
    const [gasLimit, feeData] = await Promise.all([
      provider.estimateGas({ from, to: tx.to, data: tx.data, value: tx.value }),
      provider.getFeeData(),
    ]);

    const maxFeePerGas = feeData.maxFeePerGas ?? 0n;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;
    const estimatedCostRaw = gasLimit * maxFeePerGas;

    return {
      gasLimit: gasLimit.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      estimatedCostRaw: estimatedCostRaw.toString(),
    };
  }

  async sendEvmTransaction(
    adapter: IWalletAdapter,
    tx: PreparedEvmTransaction,
  ): Promise<{ txHash: string }> {
    return adapter.sendTransaction(tx);
  }

  async sendSolanaTransaction(
    adapter: IWalletAdapter,
    transaction: SolanaTransaction | VersionedTransaction,
  ): Promise<{ txHash: string }> {
    return adapter.sendTransaction(transaction);
  }

  async sendTonTransaction(
    adapter: IWalletAdapter,
    transaction: { validUntil: number; messages: TonMessage[] },
  ): Promise<{ txHash: string }> {
    return adapter.sendTransaction(transaction);
  }

  async waitForConfirmation(networkId: NetworkId, txHash: string): Promise<TransactionReceiptResult> {
    if (isEvmNetwork(networkId)) {
      const provider = getEvmProvider(networkId);
      const receipt = await provider.waitForTransaction(txHash, 1);
      if (!receipt) return { txHash, status: 'failed' };
      return {
        txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
      };
    }

    if (networkId === 'solana') {
      const connection = getSolanaConnection();
      const result = await connection.confirmTransaction(txHash, 'confirmed');
      return { txHash, status: result.value.err ? 'failed' : 'confirmed' };
    }

    // TON confirmations are polled by services/transactions against the
    // indexer (toncenter) since TonConnect only returns the broadcast BOC.
    return { txHash, status: 'confirmed' };
  }
}

