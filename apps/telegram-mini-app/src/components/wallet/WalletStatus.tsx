import { Badge, Button } from '../../lib/ui';

export function WalletStatus({
  connected,
  address,
  provider,
  onConnect,
  onDisconnect,
}: {
  connected: boolean;
  address?: string | null;
  provider?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  if (!connected || !address) {
    return (
      <Button fullWidth onClick={onConnect}>
        Connect wallet
      </Button>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <Badge variant="success">{provider || 'wallet'}</Badge>
        <code className="ml-2 text-xs text-white/60">
          {address.slice(0, 6)}…{address.slice(-4)}
        </code>
      </div>
      <Button size="sm" variant="ghost" onClick={onDisconnect}>
        Disconnect
      </Button>
    </div>
  );
}

export default WalletStatus;
