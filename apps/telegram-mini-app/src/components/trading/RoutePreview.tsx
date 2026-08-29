export function RoutePreview({ hops }: { hops?: string[] }) {
  if (!hops?.length) return null;
  return (
    <div className="text-xs text-white/45">
      Route: {hops.join(' → ')}
    </div>
  );
}

export default RoutePreview;
