import jwt from 'jsonwebtoken';
import { getConfig } from '@cryptra/config';
import { AppError, ErrorCodes } from '@cryptra/core';

export interface JwtPayload {
  sub: string; // user id
  telegramId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const config = getConfig();
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  const config = getConfig();
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Invalid or expired token',
    });
  }
}

export function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Missing or invalid Authorization header',
    });
  }
  return authorizationHeader.slice(7).trim();
}
