export function SlippageSettings({
  valueBps,
  onChange,
}: {
  valueBps: number;
  onChange: (bps: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-white/50">
        Slippage: {valueBps / 100}%
      </label>
      <input
        type="range"
        min={10}
        max={300}
        step={10}
        value={valueBps}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default SlippageSettings;
