import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTelegram } from '../../telegram/telegram';
import { Home, BarChart3, ArrowLeftRight, Wallet, User } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export const BottomNavigation: React.FC = () => {
  const { haptic } = useTelegram();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const items: NavItem[] = [
    { to: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { to: '/markets', label: 'Markets', icon: <BarChart3 className="w-5 h-5" /> },
    { to: '/trade', label: 'Trade', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { to: '/wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
    { to: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-500/20 bg-[#050510]/95 backdrop-blur-xl shrink-0 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const isActive =
            currentPath === item.to ||
            (item.to !== '/' && currentPath.startsWith(`${item.to}/`));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[56px] ${
                isActive
                  ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                  : 'text-white/40 hover:text-white/70'
              }`}
              onClick={() => haptic.light()}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
