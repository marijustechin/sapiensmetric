import { z } from 'zod';

const emailSchema = z.string().email().max(320);

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(128),
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

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const meResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
