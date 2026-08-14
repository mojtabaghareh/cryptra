import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

const languageCodeSchema = z.enum(
  Object.values(SUPPORTED_LANGUAGES) as [string, ...string[]],
);

export const userCreateSchema = z.object({
  telegramUserId: z.string().min(1).nullable(),
  telegramUsername: z.string().min(1).max(64).nullable(),
  languageCode: languageCodeSchema,
  referredByCode: z
    .string()
    .regex(/^[A-Z0-9]{6,12}$/, 'invalid referral code format')
    .nullable(),
});

export const userUpdateSchema = z
  .object({
    telegramUsername: z.string().min(1).max(64),
    languageCode: languageCodeSchema,
    primaryWalletAddress: z.string().min(1),
  })
  .partial();

export type UserCreateSchema = z.infer<typeof userCreateSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;

export function validateUserCreate(input: unknown): UserCreateSchema {
  return userCreateSchema.parse(input);
}

export function validateUserUpdate(input: unknown): UserUpdateSchema {
  return userUpdateSchema.parse(input);
}

