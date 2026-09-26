/**
 * User entity model (FSD `entities/user`).
 *
 * Safe, presentation-level types mirroring the API admin DTOs
 * (`packages/contracts/src/admin.ts`). The web package intentionally does not
 * depend on the contracts workspace package, so the shapes are kept in sync
 * manually. No hashes, tokens, or auth internals are represented here.
 *
 * This entity slice must not import `features/*` or higher layers; it is a
 * lower layer than `features`.
 */

export const USER_ROLES = ['user', 'editor', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface UserDetail extends UserSummary {
  providers: string[];
}

export interface UserList {
  items: UserSummary[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UserSummaryCounts {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
}

export type AuditActorType = 'user' | 'cli' | 'system';

export interface AuditEntry {
  id: string;
  actorType: AuditActorType;
  actorUserId: string | null;
  actorLabel: string | null;
  action: string;
  targetUserId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface UserListQuery {
  search?: string;
  role?: UserRole | '';
  status?: UserStatus | '';
  verified?: 'true' | 'false' | '';
  page?: number;
  pageSize?: number;
  sort?: 'createdAt' | 'email';
  order?: 'asc' | 'desc';
}
