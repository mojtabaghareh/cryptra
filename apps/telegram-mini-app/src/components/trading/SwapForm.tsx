import { useState } from 'react';
import { Card, Button } from '../../lib/ui';

export interface SwapFormProps {
  onSubmit?: (amount: string, from: string, to: string) => void;
  loading?: boolean;
}

export function SwapForm({ onSubmit, loading }: SwapFormProps) {
  const [from, setFrom] = useState('SOL');
  const [to, setTo] = useState('USDC');
  const [amount, setAmount] = useState('');

  return (
    <Card padded>
      <div className="text-sm text-white/50 mb-2">From</div>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          inputMode="decimal"
        />
        <select
          className="rounded-xl bg-black/30 border border-white/10 px-3 text-white"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          <option value="SOL">SOL</option>
          <option value="ETH">ETH</option>
        </select>
      </div>
      <div className="text-sm text-white/50 mb-2">To</div>
      <div className="mb-4">
        <select
          className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-white"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
      </div>
      <Button
        fullWidth
        disabled={loading || !amount}
        onClick={() => onSubmit?.(amount, from, to)}
      >
        {loading ? 'Loading…' : 'Get quote'}
      </Button>
    </Card>
  );
}

export default SwapForm;
