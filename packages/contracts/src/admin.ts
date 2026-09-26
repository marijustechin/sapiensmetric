import { z } from 'zod';

// --- Roles and account status (T-012) -------------------------------------

export const userRoleSchema = z.enum(['user', 'editor', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.enum(['active', 'suspended']);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const USER_ROLES = userRoleSchema.options;
export const USER_STATUSES = userStatusSchema.options;

// --- Safe admin DTOs (never include hashes, tokens, or auth internals) ----

export const adminSummarySchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  verifiedUsers: z.number().int().nonnegative(),
  unverifiedUsers: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  suspendedUsers: z.number().int().nonnegative(),
  adminUsers: z.number().int().nonnegative(),
});
export type AdminSummary = z.infer<typeof adminSummarySchema>;

export const adminUserSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: userRoleSchema,
  status: userStatusSchema,
  emailVerified: z.boolean(),
  createdAt: z.string(),
});
export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;

export const adminUserDetailSchema = adminUserSummarySchema.extend({
  /** Linked authentication provider names, e.g. `['google']`. */
  providers: z.array(z.string()),
});
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

export const adminUserListSchema = z.object({
  items: z.array(adminUserSummarySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type AdminUserList = z.infer<typeof adminUserListSchema>;

export const updateUserRoleRequestSchema = z.object({ role: userRoleSchema });
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleRequestSchema>;

export const updateUserStatusRequestSchema = z.object({
  status: userStatusSchema,
});
export type UpdateUserStatusRequest = z.infer<
  typeof updateUserStatusRequestSchema
>;

export const AUDIT_ACTOR_TYPES = ['user', 'cli', 'system'] as const;
export const auditActorTypeSchema = z.enum(AUDIT_ACTOR_TYPES);
export type AuditActorType = z.infer<typeof auditActorTypeSchema>;

export const adminAuditEntrySchema = z.object({
  id: z.string().uuid(),
  actorType: auditActorTypeSchema,
  actorUserId: z.string().uuid().nullable(),
  actorLabel: z.string().nullable(),
  action: z.string(),
  targetUserId: z.string().uuid().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  createdAt: z.string(),
});
export type AdminAuditEntry = z.infer<typeof adminAuditEntrySchema>;

export const adminAuditListSchema = z.object({
  items: z.array(adminAuditEntrySchema),
});
export type AdminAuditList = z.infer<typeof adminAuditListSchema>;

export const forbiddenResponseSchema = z.object({
  statusCode: z.literal(403),
  code: z.literal('FORBIDDEN'),
  message: z.string(),
});
export type ForbiddenResponse = z.infer<typeof forbiddenResponseSchema>;
