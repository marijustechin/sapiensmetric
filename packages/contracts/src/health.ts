import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** T-023 readiness contract: liveness plus a database round-trip. */
export const readinessResponseSchema = z.object({
  status: z.literal('ok'),
});

export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
