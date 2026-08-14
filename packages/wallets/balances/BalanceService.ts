import { Contract, formatUnits } from 'ethers';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Address } from '@ton/core';
import {
  type ChainType,
  type NetworkId,
  type WalletBalance,
  NATIVE_TOKENS,
  isEvmNetwork,
  type EvmChainId,
} from '@cryptra/core';
import { getEvmProvider, getSolanaConnection, getTonClient, SOLANA_NETWORK_ID, TON_NETWORK_ID } from '../networks/WalletNetworks';

const ERC20_BALANCE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/**
 * Fetches real, on-chain balances for the native asset and (optionally)
 * specific ERC-20 / SPL / Jetton tokens of a connected wallet — no mocked
 * or cached-only data.
 */
export class BalanceService {
  async getNativeBalance(walletId: string, address: string, networkId: NetworkId): Promise<WalletBalance> {
    const native = NATIVE_TOKENS[networkId];

    if (isEvmNetwork(networkId)) {
      const provider = getEvmProvider(networkId);
      const balance = await provider.getBalance(address);
      return this.toWalletBalance(walletId, networkId, null, native.symbol, balance.toString(), native.decimals);
    }

    if (networkId === SOLANA_NETWORK_ID) {
      const connection = getSolanaConnection();
      const lamports = await connection.getBalance(new PublicKey(address));
      return this.toWalletBalance(walletId, networkId, null, native.symbol, lamports.toString(), native.decimals);
    }

    if (networkId === TON_NETWORK_ID) {
      const client = getTonClient();
      const nano = await client.getBalance(Address.parse(address));
      return this.toWalletBalance(walletId, networkId, null, native.symbol, nano.toString(), native.decimals);
    }

    throw new Error(`Unsupported network for balance lookup: ${String(networkId)}`);
  }

  async getEvmTokenBalance(
    walletId: string,
    ownerAddress: string,
    tokenAddress: string,
    chainId: EvmChainId,
  ): Promise<WalletBalance> {
    const provider = getEvmProvider(chainId);
    const contract = new Contract(tokenAddress, ERC20_BALANCE_ABI, provider);
    const [balance, decimals, symbol] = await Promise.all([
      contract.balanceOf!(ownerAddress) as Promise<bigint>,
      contract.decimals!() as Promise<number>,
      contract.symbol!() as Promise<string>,
    ]);

    return this.toWalletBalance(walletId, chainId, tokenAddress, symbol, balance.toString(), Number(decimals));
  }

  /** Returns balances for every SPL token account owned by `ownerAddress` (Solana). */
  async getSolanaTokenBalances(walletId: string, ownerAddress: string): Promise<WalletBalance[]> {
    const connection = getSolanaConnection();
    const owner = new PublicKey(ownerAddress);

    const { value } = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });

    return value.map(({ account }) => {
      const info = account.data.parsed.info as {
        mint: string;
        tokenAmount: { amount: string; decimals: number };
      };
      return this.toWalletBalance(
        walletId,
        SOLANA_NETWORK_ID,
        info.mint,
        info.mint,
        info.tokenAmount.amount,
        info.tokenAmount.decimals,
      );
    });
  }

  formatDisplayAmount(balance: WalletBalance): string {
    return formatUnits(balance.amountRaw, balance.decimals);
  }

  private toWalletBalance(
    walletId: string,
    networkId: NetworkId,
    tokenAddress: string | null,
    symbol: string,
    amountRaw: string,
    decimals: number,
  ): WalletBalance {
    return {
      walletId,
      networkId,
      tokenAddress,
      symbol,
      amountRaw,
      decimals,
      fetchedAt: new Date().toISOString(),
    };
  }
}

export function inferChainType(networkId: NetworkId): ChainType {
  if (isEvmNetwork(networkId)) return 'evm';
  if (networkId === SOLANA_NETWORK_ID) return 'solana';
  return 'ton';
}

