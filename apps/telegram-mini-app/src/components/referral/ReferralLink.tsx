import { Button } from '../../lib/ui';

export function ReferralLink({ code, link }: { code?: string; link?: string }) {
  const text = link || (code ? `https://t.me/Cryptrabot?start=${code}` : '');
  return (
    <div className="space-y-2">
      <code className="block text-xs break-all bg-black/30 p-3 rounded-xl border border-white/10">
        {text || 'No referral link yet'}
      </code>
      {text && (
        <Button
          fullWidth
          variant="secondary"
          onClick={() => void navigator.clipboard?.writeText(text)}
        >
          Copy link
        </Button>
      )}
    </div>
  );
}

export default ReferralLink;
