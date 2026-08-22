import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { createHmac, createHash } from 'node:crypto';
import { verifyMessage as verifyEvmMessage } from 'ethers';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { AppError, ErrorCodes, isValidEvmAddress, isValidSolanaAddress, isValidTonAddress } from '@cryptra/core';

export interface SessionUser {
  userId: string;
  authMethod: 'telegram' | 'wallet-signature';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError({
      code: ErrorCodes.UNKNOWN,
      message: 'Missing JWT_SECRET in the environment.',
      statusCode: 500,
    });
  }
  return secret;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function issueSessionToken(user: SessionUser): string {
  return jwt.sign(
    {
      sub: user.userId,
      userId: user.userId,
      authMethod: user.authMethod,
    },
    getJwtSecret(),
    { expiresIn: SESSION_TTL_SECONDS },
  );
}

export function verifySessionToken(token: string): SessionUser {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded !== 'object' || decoded === null) {
      throw new Error('malformed token payload');
    }
    const payload = decoded as Record<string, unknown>;

    // Support both auth package tokens (sub) and session tokens (userId)
    const userId =
      typeof payload.userId === 'string'
        ? payload.userId
        : typeof payload.sub === 'string'
          ? payload.sub
          : null;

    if (!userId) {
      throw new Error('malformed token payload');
    }

    const authMethod =
      payload.authMethod === 'wallet-signature' ? 'wallet-signature' : 'telegram';

    return { userId, authMethod };
  } catch (error) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Invalid or expired session token.',
      cause: error,
    });
  }
}

export function verifyTelegramInitData(initData: string, maxAgeSeconds = 86_400): Record<string, string> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new AppError({
      code: ErrorCodes.UNKNOWN,
      message: 'Missing TELEGRAM_BOT_TOKEN in the environment.',
      statusCode: 500,
    });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'Telegram initData is missing "hash".' });
  }
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) {
    throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'Telegram initData signature is invalid.' });
  }

  const authDate = Number(params.get('auth_date') ?? '0');
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (!authDate || ageSeconds > maxAgeSeconds) {
    throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'Telegram initData has expired.' });
  }

  return Object.fromEntries(params.entries());
}

export function verifyEvmSignature(message: string, signature: string, address: string): boolean {
  if (!isValidEvmAddress(address)) return false;
  try {
    const recovered = verifyEvmMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

export function verifySolanaSignature(message: string, signatureBase58: string, address: string): boolean {
  if (!isValidSolanaAddress(address)) return false;
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signatureBase58);
    const publicKeyBytes = bs58.decode(address);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export function verifyTonProofSignature(payload: {
  message: string;
  signatureBase64: string;
  publicKeyHex: string;
  address: string;
}): boolean {
  if (!isValidTonAddress(payload.address)) return false;
  try {
    const messageHash = createHash('sha256').update(payload.message).digest();
    const signatureBytes = Buffer.from(payload.signatureBase64, 'base64');
    const publicKeyBytes = Buffer.from(payload.publicKeyHex, 'hex');
    return nacl.sign.detached.verify(messageHash, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'Missing Bearer session token.' });
  }
  const token = header.slice('Bearer '.length).trim();
  request.user = verifySessionToken(token);
}
