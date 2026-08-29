import { Button } from '../../lib/ui';

const OPTIONS = [
  { id: 'metamask', label: 'MetaMask', hint: 'EVM' },
  { id: 'phantom', label: 'Phantom', hint: 'Solana' },
  { id: 'ton', label: 'TON / Tonkeeper', hint: 'TON' },
  { id: 'trust', label: 'Trust Wallet', hint: 'EVM' },
  { id: 'walletconnect', label: 'WalletConnect', hint: 'Multi' },
] as const;

export function WalletSelector({
  onSelect,
}: {
  onSelect?: (id: (typeof OPTIONS)[number]['id']) => void;
}) {
  return (
    <div className="grid gap-2">
      {OPTIONS.map((o) => (
        <Button
          key={o.id}
          fullWidth
          variant="secondary"
          onClick={() => onSelect?.(o.id)}
          className="justify-between"
        >
          <span>{o.label}</span>
          <span className="text-[10px] text-white/40">{o.hint}</span>
        </Button>
      ))}
    </div>
  );
}

export default WalletSelector;
