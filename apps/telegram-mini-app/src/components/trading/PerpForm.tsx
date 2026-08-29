import { useState } from 'react';
import { Card, Button } from '../../lib/ui';

export interface PerpFormProps {
  onSubmit?: (payload: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: string;
    leverage: number;
  }) => void;
  loading?: boolean;
}

export function PerpForm({ onSubmit, loading }: PerpFormProps) {
  const [symbol, setSymbol] = useState('BTC');
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(5);

  return (
    <Card padded>
      <div className="flex gap-2 mb-3">
        {(['BTC', 'ETH', 'SOL'] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={symbol === s ? 'primary' : 'secondary'}
            onClick={() => setSymbol(s)}
          >
            {s}
          </Button>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <Button
          size="sm"
          variant={side === 'LONG' ? 'primary' : 'outline'}
          onClick={() => setSide('LONG')}
        >
          Long
        </Button>
        <Button
          size="sm"
          variant={side === 'SHORT' ? 'primary' : 'outline'}
          onClick={() => setSide('SHORT')}
        >
          Short
        </Button>
      </div>
      <input
        className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-white mb-3"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="Size"
        inputMode="decimal"
      />
      <label className="text-xs text-white/50">Leverage {leverage}x</label>
      <input
        type="range"
        min={1}
        max={20}
        value={leverage}
        onChange={(e) => setLeverage(Number(e.target.value))}
        className="w-full mb-4"
      />
      <Button
        fullWidth
        disabled={loading || !size}
        onClick={() => onSubmit?.({ symbol, side, size, leverage })}
      >
        {loading ? 'Submitting…' : `Open ${side}`}
      </Button>
    </Card>
  );
}

export default PerpForm;
