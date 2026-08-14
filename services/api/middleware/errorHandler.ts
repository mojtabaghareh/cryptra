import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ErrorCodes } from '@cryptra/core';

interface ErrorResponseBody {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

function zodErrorToResponse(error: ZodError): ErrorResponseBody {
  return {
    code: ErrorCodes.VALIDATION_FAILED,
    message: 'Request validation failed.',
    statusCode: 400,
    details: { issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
  };
}

function fastifyErrorToResponse(error: FastifyError): ErrorResponseBody {
  return {
    code: 'CRYPTRA/HTTP_ERROR',
    message: error.message,
    statusCode: error.statusCode ?? 500,
  };
}

/** Registers the centralized Fastify error handler for the whole API surface. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    let body: ErrorResponseBody;

    if (AppError.isAppError(error)) {
      body = error.toJSON();
    } else if (error instanceof ZodError) {
      body = zodErrorToResponse(error);
    } else if (isFastifyError(error)) {
      body = fastifyErrorToResponse(error);
    } else {
      body = {
        code: ErrorCodes.UNKNOWN,
        message: 'An unexpected error occurred.',
        statusCode: 500,
      };
    }

    if (body.statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled error while processing request');
    } else {
      request.log.warn({ err: error }, 'Request failed');
    }

    reply.status(body.statusCode).send(body);
  });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const body: ErrorResponseBody = {
      code: ErrorCodes.NOT_FOUND,
      message: `Route ${request.method} ${request.url} not found.`,
      statusCode: 404,
    };
    reply.status(404).send(body);
  });
}

function isFastifyError(error: unknown): error is FastifyError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'statusCode' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

