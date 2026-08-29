import { StatCard } from '../cards/StatCard';

export function ActiveReferralCount({ count }: { count: number }) {
  return <StatCard label="Active referrals" value={count} />;
}

export default ActiveReferralCount;
