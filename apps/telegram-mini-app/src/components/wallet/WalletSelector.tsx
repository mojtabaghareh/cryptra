import { Button } from '../../lib/ui';

const OPTIONS = [
  { id: 'metamask', label: 'MetaMask' },
  { id: 'phantom', label: 'Phantom' },
  { id: 'walletconnect', label: 'WalletConnect' },
] as const;

export function WalletSelector({
  onSelect,
}: {
  onSelect?: (id: (typeof OPTIONS)[number]['id']) => void;
}) {
  return (
    <div className="grid gap-2">
      {OPTIONS.map((o) => (
        <Button key={o.id} fullWidth variant="secondary" onClick={() => onSelect?.(o.id)}>
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export default WalletSelector;
