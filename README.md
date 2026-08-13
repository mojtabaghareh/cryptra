# Cryptra

> **Financial Intelligence Layer**  
> ما به کاربر کمک نمی‌کنیم ترید کند.  
> ما به کاربر کمک می‌کنیم بفهمد چطور تصمیم می‌گیرد.

---

### Cryptra چیست؟

**Cryptra** یک صرافی، کیف‌پول یا ربات ترید نیست.

Cryptra یک **لایه هوش مالی (Financial Intelligence Layer)** است که روی تمام پلتفرم‌های مالی قرار می‌گیرد و به کاربران کمک می‌کند:

- کیفیت تصمیم‌های مالی خود را در طول زمان درک کنند
- الگوهای رفتاری مخرب (FOMO، Panic Sell، Revenge Trade و ...) را شناسایی کنند
- با گزارش‌های هفتگی (Weekly Reflection) عملکرد خود را بهبود دهند

**ماموریت:**  
*"We don’t help users trade. We help users understand how they decide."*

---

### ویژگی‌های اصلی

- اتصال کیف پول (MetaMask, Phantom, TON Connect, WalletConnect و ...)
- داشبورد پورتفولیو لحظه‌ای
- اجرای معامله (Swap / Perpetual) از طریق Hyperliquid, Jupiter, 1inch و ...
- تحلیل رفتار کاربر (Reflection Engine)
- گزارش هفتگی رفتاری
- سیستم XP، سطح، دستاورد و پاداش
- سیستم رفرال
- پشتیبانی از چند زبان (i18n)
- رابط کاربری به صورت Telegram Mini App + Web App

---

### معماری پروژه (Monorepo)

```bash
cryptra/
├── apps/                     # اپلیکیشن‌های نهایی
│   ├── telegram-mini-app/    # فرانت اصلی (Telegram Mini App)
│   ├── web/                  # نسخه وب
│   ├── telegram-bot/         # ربات تلگرام
│   └── admin-panel/          # پنل ادمین
│
├── packages/                 # پکیج‌های مشترک
│   ├── core/                 # هسته اصلی (Event Graph, Reflection)
│   ├── wallets/              # اتصال کیف پول‌ها
│   ├── ui/                   # کامپوننت‌های مشترک UI
│   ├── i18n/                 # چندزبانگی
│   ├── swap-engine/
│   ├── perp-engine/
│   ├── market-data/
│   ├── xp/ · levels/ · achievements/ · rewards/
│   ├── referral/
│   └── ...
│
├── services/                 # سرویس‌های بکند
│   ├── api/                  # API Gateway
│   ├── users/
│   ├── wallets/
│   ├── portfolio/
│   ├── swaps/
│   ├── perpetuals/
│   ├── analytics/
│   └── ...
│
├── database/                 # Schema + Migrations + Seeds
├── infrastructure/           # Docker, Nginx, PM2, Monitoring
└── docs/                     # مستندات

# نصب وابستگی‌ها
pnpm install

# اجرای تمام سرویس‌ها در حالت توسعه
pnpm dev

# فقط یک اپ خاص
pnpm --filter telegram-mini-app dev
