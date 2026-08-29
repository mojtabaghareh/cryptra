import { useState } from 'react';
import { Button } from '../../lib/ui';
import { SwapForm } from './SwapForm';
import { PerpForm } from './PerpForm';

export function TradeForm() {
  const [tab, setTab] = useState<'swap' | 'perp'>('swap');
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant={tab === 'swap' ? 'primary' : 'secondary'} onClick={() => setTab('swap')}>
          Swap
        </Button>
        <Button size="sm" variant={tab === 'perp' ? 'primary' : 'secondary'} onClick={() => setTab('perp')}>
          Perps
        </Button>
      </div>
      {tab === 'swap' ? <SwapForm /> : <PerpForm />}
    </div>
  );
}

export default TradeForm;
