import { z } from 'zod';

const emailSchema = z.string().email().max(320);

export const localeSchema = z.enum(['lt', 'en']);

export type Locale = z.infer<typeof localeSchema>;

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(128),
  // Optional for backward compatibility; the API defaults to English.
  locale: localeSchema.optional(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(128),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerResponseSchema = z.object({
  status: z.literal('accepted'),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// T-008: conventional registration outcomes. On an already-registered address
// the API returns an explicit conflict (intentional trade of enumeration
// resistance for clear UX, D-017); if the verification email cannot be
// delivered after account creation, it returns a recoverable failure.
export const registerConflictResponseSchema = z.object({
  statusCode: z.literal(409),
  code: z.literal('EMAIL_ALREADY_REGISTERED'),
  message: z.string(),
});

export type RegisterConflictResponse = z.infer<
  typeof registerConflictResponseSchema
>;

export const registerDeliveryFailureResponseSchema = z.object({
  statusCode: z.literal(502),
  code: z.literal('VERIFICATION_EMAIL_DELIVERY_FAILED'),
  message: z.string(),
});

export type RegisterDeliveryFailureResponse = z.infer<
  typeof registerDeliveryFailureResponseSchema
>;

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const meResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

// --- T-006: email verification and password reset -------------------------

export const emailVerificationRequestSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
});

export type EmailVerificationRequest = z.infer<
  typeof emailVerificationRequestSchema
>;

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

export const verificationConfirmRequestSchema = z.object({
  token: z.string().min(1).max(512),
});

export type VerificationConfirmRequest = z.infer<
  typeof verificationConfirmRequestSchema
>;

export const passwordResetConfirmRequestSchema = z.object({
  token: z.string().min(1).max(512),
  password: z.string().min(12).max(128),
});

export type PasswordResetConfirmRequest = z.infer<
  typeof passwordResetConfirmRequestSchema
>;

export const acceptedResponseSchema = z.object({
  status: z.literal('accepted'),
});

export type AcceptedResponse = z.infer<typeof acceptedResponseSchema>;

export const verifiedResponseSchema = z.object({
  status: z.literal('verified'),
});

export type VerifiedResponse = z.infer<typeof verifiedResponseSchema>;

export const passwordResetResponseSchema = z.object({
  status: z.literal('reset'),
});

export type PasswordResetResponse = z.infer<typeof passwordResetResponseSchema>;

// --- T-007: Google OpenID Connect -----------------------------------------

export const googleStatusResponseSchema = z.object({
  available: z.boolean(),
});

export type GoogleStatusResponse = z.infer<typeof googleStatusResponseSchema>;

export const googleUnavailableResponseSchema = z.object({
  statusCode: z.literal(503),
  code: z.literal('GOOGLE_OAUTH_UNAVAILABLE'),
  message: z.string(),
});

export type GoogleUnavailableResponse = z.infer<
  typeof googleUnavailableResponseSchema
>;
