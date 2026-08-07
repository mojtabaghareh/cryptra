import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Trade() {
  const { t } = useTranslation();
  const [asset, setAsset] = useState('BTC');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('لطفاً مبلغ معتبر وارد کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      // ارسال تصمیم به بک‌اند
      const response = await fetch('http://localhost:4000/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test_user_1', // در نسخه واقعی از آدرس ولت استفاده می‌شود
          type,
          asset,
          amount: parseFloat(amount),
          price: 65000, // در نسخه واقعی قیمت لحظه‌ای گرفته می‌شود
          timestamp: new Date(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        alert(`✅ تصمیم ثبت شد!\nامتیاز تحلیل: ${data.analysis.score}\nXP دریافتی: ${data.xpGained}`);
      } else {
        alert('❌ خطا در ثبت تصمیم: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('❌ خطا در ارتباط با سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container pb-4">
      <div className="flex items-center gap-3 mb-6 mt-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <span className="text-lg">📊</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gradient">{t('Trade & Decide')}</h1>
      </div>

      <div className="glass-card p-6 border border-border-glass space-y-4">
        <div>
          <label className="text-sm text-secondary font-medium block mb-1">دارایی (Asset)</label>
          <select 
            value={asset} 
            onChange={(e) => setAsset(e.target.value)}
            className="w-full bg-card border border-border-glass rounded-lg p-2 text-primary outline-none focus:border-accent"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="SOL">Solana (SOL)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-secondary font-medium block mb-1">نوع تصمیم</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setType('BUY')}
                className={`flex-1 py-2 rounded-lg transition-colors ${type === 'BUY' ? 'bg-green-600 text-white' : 'bg-card text-secondary border border-border-glass'}`}
              >
                خرید
              </button>
              <button 
                onClick={() => setType('SELL')}
                className={`flex-1 py-2 rounded-lg transition-colors ${type === 'SELL' ? 'bg-red-600 text-white' : 'bg-card text-secondary border border-border-glass'}`}
              >
                فروش
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-secondary font-medium block mb-1">مبلغ</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-card border border-border-glass rounded-lg p-2 text-primary outline-none focus:border-accent"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-accent to-accent-glow text-white font-bold rounded-xl shadow-lg shadow-accent-glow hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? 'در حال ارسال...' : 'ثبت تصمیم و تحلیل'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-card border border-border-glass rounded-xl animate-fade-in">
            <h3 className="text-sm font-bold text-primary mb-2">📋 نتیجه تحلیل</h3>
            <div className="space-y-1 text-sm text-secondary">
              <p><span className="font-semibold">امتیاز تحلیل:</span> {result.analysis.score}</p>
              <p><span className="font-semibold">سبک:</span> {result.analysis.style}</p>
              <p><span className="font-semibold">سطح ریسک:</span> {result.analysis.riskLevel}</p>
              <p><span className="font-semibold">XP کسب شده:</span> {result.xpGained}</p>
              {result.analysis.warnings.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300">
                  ⚠️ {result.analysis.warnings.join(' ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}