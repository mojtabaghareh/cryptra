import { prisma } from '@cryptra/database';

export interface AuditPayload {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write an immutable audit log entry.
 * Never throws to the caller — failures are logged internally.
 */
export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: payload.action,
        resource: payload.resource,
        resourceId: payload.resourceId,
        ip: payload.ip,
        userAgent: payload.userAgent,
        metadata: payload.metadata ?? undefined,
      },
    });
  } catch (err) {
    // Intentionally swallow — audit must never break main flow
    console.error('[Audit] Failed to write log:', err);
  }
}

export const AuditActions = {
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  WALLET_CONNECT: 'wallet.connect',
  WALLET_DISCONNECT: 'wallet.disconnect',
  SWAP_CREATE: 'swap.create',
  SWAP_EXECUTE: 'swap.execute',
  ORDER_CREATE: 'order.create',
  ORDER_CANCEL: 'order.cancel',
  POSITION_OPEN: 'position.open',
  POSITION_CLOSE: 'position.close',
  REFERRAL_ACTIVATE: 'referral.activate',
  ADMIN_ACTION: 'admin.action',
  RATE_LIMIT_HIT: 'security.rate_limit_hit',
} as const;
