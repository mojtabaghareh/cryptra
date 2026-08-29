import { NavItem } from './NavItem';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/markets', label: 'Markets' },
  { to: '/trade', label: 'Trade' },
  { to: '/wallet', label: 'Wallet' },
  { to: '/profile', label: 'Profile' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/referral', label: 'Referral' },
  { to: '/rewards', label: 'Rewards' },
];

export function Navigation({ currentPath }: { currentPath?: string }) {
  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map((l) => (
        <NavItem key={l.to} to={l.to} label={l.label} active={currentPath === l.to} />
      ))}
    </nav>
  );
}

export default Navigation;
