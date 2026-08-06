// ============================================================
// PersonaBuilder.ts - Financial Persona Engine
// ============================================================

import { DecisionEngine, BehaviorPattern } from './DecisionEngine';

export type PersonaType = 
  | 'The Strategist' 
  | 'The Gambler' 
  | 'The Turtle' 
  | 'The Wolf' 
  | 'The Analyst';

export interface Persona {
  type: PersonaType;
  riskTolerance: number; // 0-100
  holdingDiscipline: number; // 0-100
  emotionalStability: number; // 0-100
  description: string;
  patterns: BehaviorPattern[];
}

export class PersonaBuilder {
  private engine: DecisionEngine;

  constructor() {
    this.engine = new DecisionEngine();
  }

  /**
   * ساخت شخصیت مالی کاربر بر اساس تاریخچه تصمیم‌ها
   */
  buildPersona(userId: string): Persona {
    const patterns = this.engine.analyzeBehavior(userId);
    const score = this.engine.calculateDecisionScore(userId);

    let riskTolerance = 50;
    let holdingDiscipline = 50;
    let emotionalStability = 50;

    // محاسبه پارامترها بر اساس الگوها
    patterns.forEach(p => {
      if (p.type === 'FOMO' || p.type === 'REVENGE') {
        riskTolerance += 10;
        emotionalStability -= 10;
      }
      if (p.type === 'PANIC') {
        holdingDiscipline -= 15;
        emotionalStability -= 5;
      }
      if (p.type === 'DISCIPLINE') {
        holdingDiscipline += 15;
      }
    });

    // تعیین نوع شخصیت
    let type: PersonaType = 'The Analyst';
    let description = 'تحلیل‌گر و منطقی';

    if (riskTolerance > 70 && emotionalStability < 30) {
      type = 'The Gambler';
      description = 'ریسک‌پذیر و هیجانی';
    } else if (holdingDiscipline > 70 && riskTolerance < 40) {
      type = 'The Turtle';
      description = 'صبور و محتاط';
    } else if (riskTolerance > 60 && holdingDiscipline > 60) {
      type = 'The Strategist';
      description = 'استراتژیک و هوشمند';
    } else if (riskTolerance > 50 && emotionalStability < 40) {
      type = 'The Wolf';
      description = 'تهاجمی و سریع';
    }

    return {
      type,
      riskTolerance,
      holdingDiscipline,
      emotionalStability,
      description,
      patterns,
    };
  }
}
