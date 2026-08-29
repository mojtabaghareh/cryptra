import { Link } from '@tanstack/react-router';

export function NavItem({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm ${
        active ? 'bg-white/10 text-violet-300' : 'text-white/60'
      }`}
    >
      {label}
    </Link>
  );
}

export default NavItem;
