import { Card, Button, Badge } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';

export function Wallet() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const address = useWalletStore((s) => s.address);
  const provider = useWalletStore((s) => s.provider);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);

  if (!isConnected) {
    return (
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Wallet</h1>
        <Card padded>
          <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>
            MetaMask · Phantom · TON Connect · WalletConnect
          </p>
          <Button fullWidth onClick={() => void connect()}>
            Connect wallet
          </Button>
          <p style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Demo mode until adapters are wired in UI
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Wallet</h1>
      <Card padded>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Connected</div>
            <code style={{ fontSize: 13 }}>
              {address?.slice(0, 8)}…{address?.slice(-6)}
            </code>
            <div style={{ marginTop: 6 }}>
              <Badge variant="success">{provider ?? 'wallet'}</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Wallet;
