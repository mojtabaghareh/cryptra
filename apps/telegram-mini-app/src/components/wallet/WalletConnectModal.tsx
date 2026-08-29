import { Card, Button } from '../../lib/ui';
import { WalletSelector } from './WalletSelector';

export function WalletConnectModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose?: () => void;
  onSelect?: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-4">
      <Card padded className="w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Connect wallet</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <WalletSelector onSelect={onSelect as never} />
      </Card>
    </div>
  );
}

export default WalletConnectModal;
