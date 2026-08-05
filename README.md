**Cryptra** یک صرافی، کیف پول یا ربات ترید نیست.  
Cryptra یک **لایه هوش مالی (Financial Intelligence Layer)** است که روی تمام پلتفرم‌های مالی قرار می‌گیرد و به کاربران کمک می‌کند **کیفیت تصمیم‌های مالی خود را در طول زمان درک و بهبود دهند.**

> **Mission:** *"We don’t help users trade. We help users understand how they decide."*
---

## 📦 ویژگی‌های اصلی

- 🔗 **اتصال کیف پول:** MetaMask, Phantom, TON Connect, WalletConnect
- 📊 **داشبورد پورتفولیو:** مشاهده دارایی‌ها و تغییرات لحظه‌ای
- ⚡ **معامله (Swap/Perp):** اجرای سفارش از طریق Hyperliquid, Jupiter, 1inch
- 🪞 **تحلیل رفتار (Reflection):** شناسایی الگوهای FOMO, Panic Sell, Revenge Trade
- 📅 **گزارش هفتگی (Replay):** خلاصه‌ای از رفتار مالی کاربر
- 👤 **شخصیت مالی (Persona):** نمایه‌ی ریسک‌پذیری و سبک معامله‌گری کاربر
- 🌍 **چندزبانه:** English, فارسی, العربية, Türkçe, Русский, Deutsch, Français, Español, Português, 中文, 日本語, हिन्दी

---

## 🏛️ معماری پروژه

```text
cryptra/
├── packages/
│   ├── core/               # هسته‌ی غیرقابل تغییر (Event Graph, Reflection)
│   ├── adapters/           # اتصال به کیف پول‌ها و صرافی‌ها
│   ├── backend/            # سرور اصلی (API Gateway)
│   └── frontend/           # Telegram Mini App + Web App
├── infrastructure/         # Docker, Neo4j, Redis, PostgreSQL
├── .env.example
├── docker-compose.yml
└── README.md
```

---

🛠️ راه‌اندازی محیط توسعه (محلی)

پیش‌نیازها

· Node.js (نسخه‌ی ۱۸ یا بالاتر)
· Docker (برای اجرای دیتابیس‌ها)
· Git

---

۱. کلون کردن پروژه

```bash
git clone https://github.com/[username]/cryptra.git
cd cryptra
```

---

۲. نصب وابستگی‌ها

```bash
npm install
```

---

۳. راه‌اندازی دیتابیس‌ها (با Docker)

دستور زیر دیتابیس گرافی (Neo4j) و حافظه‌ی کش (Redis) را به‌صورت خودکار راه‌اندازی می‌کند:

```bash
docker-compose up -d
```

نکته: اگر برای اولین بار اجرا می‌کنید، ممکن است چند دقیقه طول بکشد تا Docker تصاویر را دانلود کند.

---

۴. تنظیم متغیرهای محیطی

فایل .env را از روی .env.example کپی کنید:

```bash
cp .env.example .env
```

سپس فایل .env را با یک ویرایشگر باز کنید و تنظیمات زیر را وارد کنید:

```
PORT=3000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret_password
REDIS_URL=redis://localhost:6379
```

---

۵. اجرای بک‌اند

در یک ترمینال، دستور زیر را اجرا کنید:

```bash
npm run dev:backend
```

سرور بک‌اند روی آدرس http://localhost:3000 در دسترس خواهد بود.

---

۶. اجرای فرانت‌اند

در یک ترمینال جداگانه، دستور زیر را اجرا کنید:

```bash
npm run dev:frontend
```

فرانت‌اند روی آدرس http://localhost:5173 در دسترس خواهد بود.

---

🧪 تست سریع یکپارچگی

برای اطمینان از اینکه همه‌چیز به‌درستی کار می‌کند، مراحل زیر را دنبال کنید:

1. مطمئن شوید که docker-compose up -d اجرا شده است.
2. بک‌اند روی localhost:3000 اجرا شود.
3. فرانت‌اند روی localhost:5173 اجرا شود.
4. مرورگر خود را باز کرده و به http://localhost:5173 بروید.
5. صفحه‌ی اصلی Cryptra را مشاهده خواهید کرد.

---

📁 ساختار مخزن

```text
cryptra/
├── .github/workflows/       # CI/CD pipeline
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── event-graph/
│   │   │   ├── reflection-engine/
│   │   │   └── replay-generator/
│   │   └── package.json
│   ├── adapters/
│   │   ├── src/
│   │   │   ├── wallet-connectors/
│   │   │   ├── rpc-connectors/
│   │   │   └── dex-connectors/
│   │   └── package.json
│   ├── backend/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   └── services/
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   └── i18n/
│       ├── package.json
│       └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

---

🧩 دستورات مفید

دستور توضیح
docker-compose up -d راه‌اندازی دیتابیس‌ها
docker-compose down توقف و حذف کانتینرها
npm run dev:backend اجرای بک‌اند در حالت توسعه
npm run dev:frontend اجرای فرانت‌اند در حالت توسعه
npm run build:core کامپایل هسته برای انتشار
npm run dev اجرای هم‌زمان بک‌اند و فرانت‌اند

---

🛡️ امنیت و حریم خصوصی

· Cryptra Non-Custodial است و هیچ‌گاه دارایی کاربران را نگهداری نمی‌کند.
· تمام اتصالات از طریق Adapter Layer انجام می‌شود و Core هیچ وابستگی به بلاکچین ندارد.
· اطلاعات کاربران رمزنگاری شده و فقط برای تحلیل رفتار استفاده می‌شود.

---

🌍 پشتیبانی از زبان‌ها

پروژه از همان نسخه اول با استفاده از i18next چندزبانه طراحی شده است.
فایل‌های ترجمه در مسیر packages/frontend/src/i18n/ قرار دارند.

---

✨ استقرار (Deployment)

برای استقرار در محیط تولید:

1. فایل .env را با مقادیر تولید پر کنید.
2. دستور npm run build را در بک‌اند و فرانت‌اند اجرا کنید.
3. فایل‌های ساخته‌شده در پوشه‌ی dist را روی سرور خود مستقر کنید.

---

📜 لایسنس

این پروژه برای استفاده‌ی شخصی و تجاری تحت لایسنس MIT منتشر شده است.
