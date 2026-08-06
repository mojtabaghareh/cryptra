// ============================================================
// ReferralEngine.ts - Referral System
// ============================================================

export interface ReferralData {
  referrerId: string;
  refereeId: string;
  timestamp: number;
  isActive: boolean;
}

export class ReferralEngine {
  private referrals: Map<string, ReferralData[]> = new Map();

  /**
   * ثبت یک رفرال جدید
   */
  addReferral(referrerId: string, refereeId: string): boolean {
    const list = this.referrals.get(referrerId) || [];
    // بررسی عدم تکرار
    if (list.some(r => r.refereeId === refereeId)) return false;
    list.push({
      referrerId,
      refereeId,
      timestamp: Date.now(),
      isActive: true,
    });
    this.referrals.set(referrerId, list);
    return true;
  }

  /**
   * دریافت تعداد رفرال‌های فعال یک کاربر
   */
  getReferralCount(userId: string): number {
    const list = this.referrals.get(userId) || [];
    return list.filter(r => r.isActive).length;
  }

  /**
   * محاسبه پاداش XP رفرال
   */
  calculateReferralXP(userId: string): number {
    const count = this.getReferralCount(userId);
    // هر رفرال فعال ۱۰۰ XP به همراه دارد
    return count * 100;
  }
}
