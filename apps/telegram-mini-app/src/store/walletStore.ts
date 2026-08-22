import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectMetaMask as requestMetaMask, isMetaMaskAvailable } from '../lib/ethereum';
import { connectPhantom as requestPhantom, isPhantomAvailable } from '../lib/solana';
import { isLikelyTonAddress, tryConnectTonInjected } from '../lib/ton';

export type WalletProviderId =
  | 'metamask'
  | 'phantom'
  | 'ton'
  | 'demo'
  | string
  | null;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  chainType: 'EVM' | 'SOLANA' | 'TON' | null;
  provider: WalletProviderId;
  balance: Record<string, number>;
  nonce: number;
}

interface WalletActions {
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setProvider: (provider: WalletProviderId) => void;
  setBalance: (token: string, balance: number) => void;
  incrementNonce: () => void;
  connect: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  connectPhantom: () => Promise<void>;
  connectTon: (address?: string) => Promise<void>;
  connectDemo: () => Promise<void>;
  disconnect: () => void;
  reset: () => void;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  chainType: null,
  provider: null,
  balance: {},
  nonce: 0,
};

function setDemo(set: (partial: Partial<WalletState>) => void) {
  const demo =
    '0x' +
    Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  set({
    isConnected: true,
    address: demo,
    chainId: 1,
    chainType: 'EVM',
    provider: 'demo',
  });
}

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set) => ({
      ...initialState,

      setConnected: (isConnected) => set({ isConnected }),
      setAddress: (address) => set({ address }),
      setChainId: (chainId) => set({ chainId }),
      setProvider: (provider) => set({ provider }),
      setBalance: (token, balance) =>
        set((s) => ({
          balance: { ...s.balance, [token]: balance },
        })),
      incrementNonce: () => set((s) => ({ nonce: s.nonce + 1 })),

      connectMetaMask: async () => {
        const { address, chainId } = await requestMetaMask();
        set({
          isConnected: true,
          address,
          chainId,
          chainType: 'EVM',
          provider: 'metamask',
        });
      },

      connectPhantom: async () => {
        const { address } = await requestPhantom();
        set({
          isConnected: true,
          address,
          chainId: null,
          chainType: 'SOLANA',
          provider: 'phantom',
        });
      },

      connectTon: async (manualAddress?: string) => {
        let address = manualAddress?.trim();
        if (!address) {
          address = (await tryConnectTonInjected()) ?? undefined;
        }
        if (!address || !isLikelyTonAddress(address)) {
          throw new Error('Enter a valid TON address (EQ… / UQ…) or open in Tonkeeper');
        }
        set({
          isConnected: true,
          address,
          chainId: null,
          chainType: 'TON',
          provider: 'ton',
        });
      },

      connectDemo: async () => {
        setDemo(set);
      },

      connect: async () => {
        if (isMetaMaskAvailable()) {
          const { address, chainId } = await requestMetaMask();
          set({
            isConnected: true,
            address,
            chainId,
            chainType: 'EVM',
            provider: 'metamask',
          });
          return;
        }
        if (isPhantomAvailable()) {
          const { address } = await requestPhantom();
          set({
            isConnected: true,
            address,
            chainId: null,
            chainType: 'SOLANA',
            provider: 'phantom',
          });
          return;
        }
        setDemo(set);
      },

      disconnect: () =>
        set({
          isConnected: false,
          address: null,
          chainId: null,
          chainType: null,
          provider: null,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'cryptra-wallet-store',
      partialize: (state) => ({
        provider: state.provider,
        balance: state.balance,
      }),
    },
  ),
);
