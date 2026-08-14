import { ErrorCodes } from './ErrorCodes';

export interface AppErrorOptions {
  code: ErrorCodes;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * Canonical application error. Every thrown error that crosses a service
 * boundary (services/*, packages/*) should be an AppError so API responses
 * and audit logs stay consistent.
 */
export class AppError extends Error {
  public readonly code: ErrorCodes;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode ?? AppError.defaultStatusCodeFor(options.code);
    this.details = options.details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private static defaultStatusCodeFor(code: ErrorCodes): number {
    switch (code) {
      case ErrorCodes.VALIDATION_FAILED:
        return 400;
      case ErrorCodes.UNAUTHORIZED:
        return 401;
      case ErrorCodes.FORBIDDEN:
      case ErrorCodes.WALLET_SIGNATURE_REJECTED:
      case ErrorCodes.WALLET_CONNECTION_REJECTED:
        return 403;
      case ErrorCodes.NOT_FOUND:
        return 404;
      case ErrorCodes.CONFLICT:
      case ErrorCodes.REFERRAL_ALREADY_ACTIVE:
        return 409;
      case ErrorCodes.RATE_LIMITED:
        return 429;
      default:
        return 500;
    }
  }

  toJSON(): { code: ErrorCodes; message: string; statusCode: number; details?: Record<string, unknown> } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details ? { details: this.details } : {}),
    };
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

