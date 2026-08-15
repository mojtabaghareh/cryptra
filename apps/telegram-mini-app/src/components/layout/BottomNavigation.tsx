import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useI18n } from '@cryptra/i18n';
import { useTelegram } from '../../telegram/telegram';
import {
  Home,
  BarChart3,
  ArrowLeftRight,
  Wallet,
  User,
  Trophy,
  Activity,
  Gift,
  Users,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export const BottomNavigation: React.FC = () => {
  const { t } = useI18n();
  const { haptic } = useTelegram();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const primaryNavItems: NavItem[] = [
    { to: '/', label: t('navigation:home'), icon: <Home className="w-5 h-5" /> },
    { to: '/markets', label: t('navigation:markets'), icon: <BarChart3 className="w-5 h-5" /> },
    { to: '/trade', label: t('navigation:trade'), icon: <ArrowLeftRight className="w-5 h-5" /> },
    { to: '/wallet', label: t('navigation:wallet'), icon: <Wallet className="w-5 h-5" /> },
    { to: '/profile', label: t('navigation:profile'), icon: <User className="w-5 h-5" /> },
  ];

  const secondaryNavItems: NavItem[] = [
    { to: '/leaderboard', label: t('navigation:leaderboard'), icon: <Trophy className="w-5 h-5" /> },
    { to: '/activity', label: t('navigation:activity'), icon: <Activity className="w-5 h-5" /> },
    { to: '/referral', label: t('navigation:referral'), icon: <Users className="w-5 h-5" /> },
    { to: '/rewards', label: t('navigation:rewards'), icon: <Gift className="w-5 h-5" /> },
  ];

  const allItems = [...primaryNavItems, ...secondaryNavItems];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-cryptra-border shrink-0">
      <div className="flex items-center justify-around h-16 px-1">
        {allItems.map((item) => {
          const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(`${item.to}/`));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive
                  ? 'text-cryptra-primary'
                  : 'text-cryptra-muted-foreground hover:text-cryptra-foreground'
              }`}
              onClick={() => haptic.light()}
            >
              <div className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : ''}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

