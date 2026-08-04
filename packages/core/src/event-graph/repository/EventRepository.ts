// ============================================================
// EventRepository.ts
// این فایل مسئول ذخیره‌سازی و بازیابی رویدادهای مالی
// در پایگاه داده‌ی گرافی (Neo4j) است.
// ============================================================

import { FinancialEvent } from '../models/EventTypes';

export class EventRepository {
  private neo4jDriver: any; // در فاز Backend، درایور واقعی تزریق می‌شود

  constructor(neo4jDriver: any) {
    this.neo4jDriver = neo4jDriver;
  }

  /**
   * ذخیره‌سازی یک رویداد مالی در گراف
   */
  async saveEvent(event: FinancialEvent): Promise<void> {
    const session = this.neo4jDriver.session();
    try {
      // این یک کوئری ساده به زبان Cypher است
      await session.run(
        `
        CREATE (e:Event {
          id: $id,
          userId: $userId,
          type: $type,
          timestamp: $timestamp,
          chain: $chain,
          walletAddress: $walletAddress,
          txHash: $txHash,
          amount: $amount,
          tokenSymbol: $tokenSymbol,
          valueUsd: $valueUsd,
          metadata: $metadata
        })
        `,
        {
          id: event.id,
          userId: event.userId,
          type: event.type,
          timestamp: event.timestamp,
          chain: event.chain,
          walletAddress: event.walletAddress,
          txHash: event.txHash || null,
          amount: event.amount || null,
          tokenSymbol: event.tokenSymbol || null,
          valueUsd: event.valueUsd || null,
          metadata: event,
        }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * بازیابی تمام رویدادهای یک کاربر بر اساس شناسه
   */
  async getEventsByUserId(userId: string): Promise<FinancialEvent[]> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (e:Event {userId: $userId})
        RETURN e
        ORDER BY e.timestamp DESC
        `,
        { userId }
      );
      return result.records.map((record: any) => record.get('e').properties as FinancialEvent);
    } finally {
      await session.close();
    }
  }
}
