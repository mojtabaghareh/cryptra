// ============================================================
// Home.tsx
// صفحه اصلی برنامه (Home)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// فرض می‌کنیم داده‌ها از API می‌آیند
interface PortfolioData {
  totalUsd: number;
  todayChange: number;
  monthChange: number;
  changePercent: number;
}

interface ReflectionData {
  insights: string[];
  weekNumber: number;
}

export default function Home() {
  const { t } = useTranslation();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [reflection, setReflection] = useState<ReflectionData | null>(null);

  useEffect(() => {
    // دریافت داده‌ها از بک‌اند
    const fetchData = async () => {
      try {
        // در نسخه‌ی واقعی اینجا API فراخوانی می‌شود
        setPortfolio({
          totalUsd: 24500,
          todayChange: 320,
          monthChange: 1850,
          changePercent: 8.2,
        });
        setReflection({
          insights: [
            '⚠️ این هفته ۲ بار در زمان افزایش قیمت خرید کرده‌اید.',
            '✅ این هفته نسبت به هفته قبل صبورتر بوده‌اید.',
          ],
          weekNumber: 32,
        });
      } catch (error) {
        console.error('خطا در دریافت داده‌های صفحه اصلی:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4">
      {/* هدر */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🔷</span>
          <h1 className="text-2xl font-bold">Cryptra</h1>
        </div>
        <div className="flex gap-3">
          <button className="p-2 rounded-full hover:bg-gray-800">🔔</button>
          <button className="p-2 rounded-full hover:bg-gray-800">⚙️</button>
        </div>
      </div>

      {/* کارت پورتفولیو */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm opacity-80">Total Portfolio</p>
            <p className="text-4xl font-bold mt-1">
              ${portfolio?.totalUsd.toLocaleString() || '--'}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${(portfolio?.todayChange || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {portfolio?.todayChange || 0 > 0 ? '▲' : '▼'} ${Math.abs(portfolio?.todayChange || 0).toLocaleString()}
            </p>
            <p className={`text-xs ${(portfolio?.changePercent || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {portfolio?.changePercent || 0 > 0 ? '▲' : '▼'} {Math.abs(portfolio?.changePercent || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* کارت بازتاب (Reflection) */}
      {reflection && (
        <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">🪞 Weekly Reflection</h2>
            <span className="text-sm text-gray-400">Week {reflection.weekNumber}</span>
          </div>
          <ul className="space-y-2">
            {reflection.insights.map((insight, index) => (
              <li key={index} className="text-sm text-gray-300 flex gap-2">
                <span>•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* دکمه‌های اقدام سریع */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <button className="flex flex-col items-center p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
          <span className="text-xl">↑</span>
          <span className="text-xs mt-1">Buy</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
          <span className="text-xl">↓</span>
          <span className="text-xs mt-1">Sell</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
          <span className="text-xl">↔</span>
          <span className="text-xs mt-1">Swap</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
          <span className="text-xl">+</span>
          <span className="text-xs mt-1">Send</span>
        </button>
      </div>
    </div>
  );
}
