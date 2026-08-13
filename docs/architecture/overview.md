# Architecture Overview — Cryptra

## هدف معماری

Cryptra یک **لایه هوش مالی** است، نه یک صرافی.  
معماری طوری طراحی شده که:

1. هسته تصمیم‌گیری و تحلیل رفتار (`core`) مستقل و قابل استفاده مجدد باشد.
2. اتصال به کیف‌پول‌ها و پروتکل‌های خارجی از طریق Adapterها انجام شود.
3. فرانت (Telegram Mini App + Web) سبک و سریع بماند.
4. سرویس‌ها loosely coupled باشند تا بتوان به راحتی مقیاس‌پذیر شد.

---

## لایه‌های اصلی

### 1. Apps Layer
اپلیکیشن‌های نهایی که کاربر با آن‌ها تعامل دارد:

- `telegram-mini-app` → رابط اصلی کاربر
- `web` → نسخه وب
- `telegram-bot` → اعلان‌ها و دستورات
- `admin-panel` → مدیریت سیستم

### 2. Packages Layer (Shared Logic)
منطق کسب‌وکار مشترک و قابل استفاده مجدد:

| پکیج              | مسئولیت                              |
|-------------------|--------------------------------------|
| `core`            | Event Graph + Reflection Engine     |
| `wallets`         | اتصال و مدیریت کیف پول‌ها           |
| `ui`              | کامپوننت‌های طراحی سیستم            |
| `i18n`            | چندزبانگی                           |
| `swap-engine`     | منطق سواپ                           |
| `perp-engine`     | منطق معاملات اهرمی                  |
| `market-data`     | قیمت و داده‌های بازار               |
| `xp` / `levels` / `achievements` / `rewards` | گیمیفیکیشن |
| `referral`        | سیستم رفرال                         |

### 3. Services Layer
سرویس‌های بکند که منطق سنگین و ارتباط با دیتابیس را بر عهده دارند:

- `api` → نقطه ورود اصلی (API Gateway)
- `users`, `wallets`, `portfolio`
- `swaps`, `perpetuals`
- `analytics`, `notifications`
- سرویس‌های گیمیفیکیشن و رفرال

### 4. Database Layer
- PostgreSQL → داده‌های اصلی
- Redis → کش و صف
- Neo4j → گراف رویدادها و روابط رفتاری (Event Graph)

### 5. Infrastructure
Docker, Nginx, PM2, Logging, Monitoring, Backups

---

## جریان اصلی داده (High-level Flow)

کاربر (Telegram Mini App) ↓ packages/wallets  →  اتصال کیف پول ↓ services/wallets + services/portfolio ↓ packages/core (Event Graph) ↓ Reflection Engine → شناسایی الگوهای رفتاری ↓ Weekly Report + XP / Achievements

---

## اصول طراحی

1. **Core مستقل است** → هیچ وابستگی مستقیمی به UI یا سرویس خاص ندارد.
2. **Adapter Pattern** برای کیف پول‌ها و صرافی‌ها.
3. **Event-Driven** برای ثبت تصمیم‌ها و رفتار کاربر.
4. **Type-Safe** کامل با TypeScript.
5. **Monorepo** با pnpm + Turborepo برای مدیریت وابستگی‌ها و بیلد.

---

## مراحل بعدی توسعه

1. تکمیل `packages/core` + `packages/wallets`
2. پیاده‌سازی `services/api` + احراز هویت
3. ساخت اسکلت `apps/telegram-mini-app`
4. اتصال پورتفولیو و Reflection

---

> این سند نقطه شروع معماری است و به مرور تکمیل خواهد شد.
