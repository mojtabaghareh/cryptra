import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectMetaMask, isMetaMaskAvailable } from '../lib/ethereum';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: string | null;
  balance: Record<string, number>;
  nonce: number;
}

interface WalletActions {
  setConnected: (connected: boolean) => void;
  setAddress: (address: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setProvider: (provider: string | null) => void;
  setBalance: (token: string, balance: number) => void;
  incrementNonce: () => void;
  /** Prefer MetaMask; falls back to demo if unavailable */
  connect: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  connectDemo: () => Promise<void>;
  disconnect: () => void;
  reset: () => void;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  provider: null,
  balance: {},
  nonce: 0,
};

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
        const { address, chainId } = await connectMetaMask();
        set({
          isConnected: true,
          address,
          chainId,
          provider: 'metamask',
        });
      },

      connectDemo: async () => {
        const demo =
          '0x' +
          Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16),
          ).join('');
        set({
          isConnected: true,
          address: demo,
          chainId: 1,
          provider: 'demo',
        });
      },

      connect: async () => {
        if (isMetaMaskAvailable()) {
          await connectMetaMask();
          const { address, chainId } = await connectMetaMask();
          set({
            isConnected: true,
            address,
            chainId,
            provider: 'metamask',
          });
          return;
        }
        // fallback demo
        const demo =
          '0x' +
          Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16),
          ).join('');
        set({
          isConnected: true,
          address: demo,
          chainId: 1,
          provider: 'demo',
        });
      },

      disconnect: () =>
        set({
          isConnected: false,
          address: null,
          chainId: null,
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
