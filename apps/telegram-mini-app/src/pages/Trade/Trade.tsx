import { useState } from 'react';
import { Card, Button, Badge } from '../../lib/ui';
import { useWalletStore } from '../../store/walletStore';

export function Trade() {
  const isConnected = useWalletStore((s) => s.isConnected);
  const connect = useWalletStore((s) => s.connect);
  const [tab, setTab] = useState<'swap' | 'perp'>('swap');
  const [fromAmount, setFromAmount] = useState('');

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Trade</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        Swap via Jupiter / 1inch · Perps via Hyperliquid
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button variant={tab === 'swap' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('swap')}>
          Swap
        </Button>
        <Button variant={tab === 'perp' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('perp')}>
          Perps
        </Button>
      </div>

      {!isConnected ? (
        <Card padded>
          <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.7)' }}>
            Connect a wallet to trade.
          </p>
          <Button fullWidth onClick={() => void connect()}>
            Connect wallet
          </Button>
        </Card>
      ) : tab === 'swap' ? (
        <Card padded>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>From</label>
            <input
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              style={{
                width: '100%',
                marginTop: 4,
                padding: '12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: 18,
              }}
            />
          </div>
          <div style={{ marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            Protocol: Jupiter · 1inch · Fee tier applied on execute
          </div>
          <Button fullWidth disabled={!fromAmount}>
            Get quote
          </Button>
          <div style={{ marginTop: 12 }}>
            <Badge variant="neutral">Backend: POST /api/v1/swaps/quote</Badge>
          </div>
        </Card>
      ) : (
        <Card padded>
          <p style={{ marginBottom: 8 }}>Open perpetual positions on Hyperliquid.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Button variant="primary" size="sm">
              Long
            </Button>
            <Button variant="outline" size="sm">
              Short
            </Button>
          </div>
          <Badge variant="neutral">Backend: Perp engine ready</Badge>
        </Card>
      )}
    </div>
  );
}

export default Trade;
