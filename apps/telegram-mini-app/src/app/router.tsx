import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { App } from './App';
import { Home } from '../pages/Home/Home';
import { Markets } from '../pages/Markets/Markets';
import { Trade } from '../pages/Trade/Trade';
import { Wallet } from '../pages/Wallet/Wallet';
import { Profile } from '../pages/Profile/Profile';
import { Leaderboard } from '../pages/Leaderboard/Leaderboard';
import { GlobalActivity } from '../pages/GlobalActivity/GlobalActivity';
import { Referral } from '../pages/Referral/Referral';
import { Rewards } from '../pages/Rewards/Rewards';
import { Reflection } from '../pages/Reflection/Reflection';

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const marketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/markets',
  component: Markets,
});

const tradeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade',
  component: Trade,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallet',
  component: Wallet,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: Profile,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard',
  component: Leaderboard,
});

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activity',
  component: GlobalActivity,
});

const referralRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/referral',
  component: Referral,
});

const rewardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rewards',
  component: Rewards,
});

const reflectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reflection',
  component: Reflection,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  marketsRoute,
  tradeRoute,
  walletRoute,
  profileRoute,
  leaderboardRoute,
  activityRoute,
  referralRoute,
  rewardsRoute,
  reflectionRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
