import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FEE_TIERS = [
  { level: 1, name: 'Starter', feePercent: 0.088, minXp: 0, description: 'Default tier' },
  { level: 5, name: 'Trader', feePercent: 0.075, minXp: 500, description: 'Active trader' },
  { level: 10, name: 'Pro', feePercent: 0.06, minXp: 2000, description: 'Pro tier' },
  { level: 20, name: 'Elite', feePercent: 0.045, minXp: 8000, description: 'Elite' },
  { level: 30, name: 'Master', feePercent: 0.033, minXp: 20000, description: 'Lowest fees' },
];

const ACHIEVEMENTS = [
  { code: 'FIRST_LOGIN', name: 'First Steps', description: 'Open Cryptra for the first time', xpReward: 20, icon: '👋' },
  { code: 'FIRST_SWAP', name: 'Swap Starter', description: 'Complete your first swap', xpReward: 50, icon: '🔄' },
  { code: 'FIRST_TRADE', name: 'First Trade', description: 'Open your first perpetual order', xpReward: 75, icon: '📈' },
  { code: 'FIRST_REFERRAL', name: 'Connector', description: 'Refer your first friend', xpReward: 100, icon: '🔗' },
  { code: 'LEVEL_5', name: 'Rising Star', description: 'Reach level 5', xpReward: 150, icon: '⭐' },
  { code: 'LEVEL_10', name: 'Veteran', description: 'Reach level 10', xpReward: 300, icon: '🏆' },
  { code: 'VOLUME_10K', name: 'Volume Hunter', description: 'Reach significant trading activity', xpReward: 200, icon: '💎' },
];

const REWARDS = [
  { code: 'WELCOME_XP', type: 'XP' as const, name: 'Welcome Bonus', description: 'One-time welcome XP', value: '50' },
  { code: 'FEE_BOOST_7D', type: 'FEE_DISCOUNT' as const, name: '7-Day Fee Boost', description: 'Temporary fee discount', value: '10' },
  { code: 'REFERRAL_BADGE', type: 'BADGE' as const, name: 'Referral Badge', description: 'Badge for active referrers', value: null },
];

async function main() {
  console.log('Seeding Cryptra database...');

  for (const tier of FEE_TIERS) {
    await prisma.feeTier.upsert({
      where: { level: tier.level },
      create: tier,
      update: {
        name: tier.name,
        feePercent: tier.feePercent,
        minXp: tier.minXp,
        description: tier.description,
      },
    });
  }
  console.log(`  Fee tiers: ${FEE_TIERS.length}`);

  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: {
        name: a.name,
        description: a.description,
        xpReward: a.xpReward,
        icon: a.icon,
        isActive: true,
      },
    });
  }
  console.log(`  Achievements: ${ACHIEVEMENTS.length}`);

  for (const r of REWARDS) {
    await prisma.reward.upsert({
      where: { code: r.code },
      create: r,
      update: {
        name: r.name,
        description: r.description,
        value: r.value,
        type: r.type,
        isActive: true,
      },
    });
  }
  console.log(`  Rewards: ${REWARDS.length}`);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
