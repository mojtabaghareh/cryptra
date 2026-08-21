import { z } from 'zod';
import { AppError, ErrorCodes } from '@cryptra/core';

/**
 * Validate data against a Zod schema.
 * Throws AppError with VALIDATION_FAILED on failure.
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));

    throw new AppError({
      code: ErrorCodes.VALIDATION_FAILED,
      message: 'Validation failed',
      details: { issues },
    });
  }

  return result.data;
}

// Common reusable schemas
export const telegramIdSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(Number),
]);

export const addressSchema = z.string().min(10).max(128);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const cuidSchema = z.string().cuid();
