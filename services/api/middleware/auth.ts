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
  return jwt.sign(user, getJwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySessionToken(token: string): SessionUser {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded !== 'object' || decoded === null) {
      throw new Error('malformed token payload');
    }
    const payload = decoded as Record<string, unknown>;
    if (typeof payload.userId !== 'string' || typeof payload.authMethod !== 'string') {
      throw new Error('malformed token payload');
    }
    return { userId: payload.userId, authMethod: payload.authMethod as SessionUser['authMethod'] };
  } catch (error) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Invalid or expired session token.',
      cause: error,
    });
  }
}

/**
 * Verifies Telegram Mini App `initData` per the official Telegram WebApp
 * authentication scheme: HMAC-SHA256("WebAppData", BOT_TOKEN) is the secret
 * key, and the resulting HMAC-SHA256 of the sorted, newline-joined
 * data-check-string must equal the provided `hash` field.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
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

/** Verifies an EIP-191 personal_sign signature over `message` was produced by `address`. */
export function verifyEvmSignature(message: string, signature: string, address: string): boolean {
  if (!isValidEvmAddress(address)) return false;
  try {
    const recovered = verifyEvmMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

/** Verifies an ed25519 signature (Solana wallet signMessage output) over `message`. */
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

/**
 * Verifies a TON `ton_proof` ed25519 signature. The wallet's ed25519 public
 * key must be supplied by the caller (obtained from the TON Connect
 * `connectItems.tonProof` payload alongside the account's `publicKey` field).
 */
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

/** Fastify preHandler hook enforcing a valid Bearer session token on protected routes. */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError({ code: ErrorCodes.UNAUTHORIZED, message: 'Missing Bearer session token.' });
  }
  const token = header.slice('Bearer '.length).trim();
  request.user = verifySessionToken(token);
}

