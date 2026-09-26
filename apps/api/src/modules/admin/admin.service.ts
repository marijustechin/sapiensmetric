import { Inject, Injectable } from '@nestjs/common';
import {
  adminAuditEntrySchema,
  adminAuditListSchema,
  adminSummarySchema,
  adminUserDetailSchema,
  adminUserListSchema,
  type AdminAuditList,
  type AdminSummary,
  type AdminUserDetail,
  type AdminUserList,
  type UserRole,
  type UserStatus,
  userRoleSchema,
  userStatusSchema,
} from '@sapiensmetric/contracts';
import {
  ADMIN_STORE,
  AdminConflictError,
  AdminNotFoundError,
  AdminStore,
} from './admin-store.js';

export interface AdminListParams {
  search?: string;
  role?: string;
  status?: string;
  verified?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  order?: string;
}

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class AdminService {
  constructor(@Inject(ADMIN_STORE) private readonly store: AdminStore) {}

  async summary(): Promise<AdminSummary> {
    return adminSummarySchema.parse(await this.store.summary());
  }

  async listUsers(params: AdminListParams): Promise<AdminUserList> {
    const page = this.positiveInt(params.page, 1);
    const pageSize = Math.min(
      this.positiveInt(params.pageSize, DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const sort = params.sort === 'email' ? 'email' : 'createdAt';
    const order = params.order === 'asc' ? 'asc' : 'desc';
    const role = params.role ? userRoleSchema.safeParse(params.role) : null;
    const status = params.status ? userStatusSchema.safeParse(params.status) : null;
    const verified =
      params.verified === 'true'
        ? true
        : params.verified === 'false'
          ? false
          : undefined;

    const result = await this.store.listUsers({
      search: params.search?.trim() || undefined,
      role: role?.success ? role.data : undefined,
      status: status?.success ? status.data : undefined,
      verified,
      page,
      pageSize,
      sort,
      order,
    });

    return adminUserListSchema.parse({
      items: result.items.map((u) => this.toSummary(u)),
      page,
      pageSize,
      total: result.total,
    });
  }

  async getUser(id: string): Promise<AdminUserDetail> {
    const row = await this.store.getUserDetail(id);
    if (!row) {
      throw new AdminNotFoundError();
    }
    return adminUserDetailSchema.parse(this.toSummary(row, row.providers));
  }

  async changeRole(
    actorUserId: string,
    targetId: string,
    role: UserRole,
  ): Promise<AdminUserDetail> {
    try {
      await this.store.changeRole(
        { type: 'user', userId: actorUserId },
        targetId,
        role,
      );
    } catch (error) {
      throw this.mapError(error);
    }
    return this.getUser(targetId);
  }

  async changeStatus(
    actorUserId: string,
    targetId: string,
    status: UserStatus,
  ): Promise<AdminUserDetail> {
    try {
      await this.store.changeStatus(
        { type: 'user', userId: actorUserId },
        targetId,
        status,
      );
    } catch (error) {
      throw this.mapError(error);
    }
    return this.getUser(targetId);
  }

  async revokeSessions(
    actorUserId: string,
    targetId: string,
  ): Promise<AdminUserDetail> {
    try {
      await this.store.revokeSessions(
        { type: 'user', userId: actorUserId },
        targetId,
      );
    } catch (error) {
      throw this.mapError(error);
    }
    return this.getUser(targetId);
  }

  async listAudit(targetUserId: string | null, limitRaw?: string): Promise<AdminAuditList> {
    const limit = Math.min(this.positiveInt(limitRaw, 20), MAX_PAGE_SIZE);
    const records = await this.store.listAudit(targetUserId, limit);
    return adminAuditListSchema.parse({
      items: records.map((r) =>
        adminAuditEntrySchema.parse({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }),
      ),
    });
  }

  private toSummary(
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      emailVerifiedAt: Date | null;
      createdAt: Date;
    },
    providers?: string[],
  ) {
    const base = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt.toISOString(),
    };
    return providers ? { ...base, providers } : base;
  }

  private positiveInt(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private mapError(error: unknown): Error {
    if (error instanceof AdminNotFoundError) {
      const mapped = new Error('User not found.');
      mapped.name = 'AdminNotFoundError';
      return mapped;
    }
    if (error instanceof AdminConflictError) {
      const mapped = new Error(error.reason);
      mapped.name = 'AdminConflictError';
      return mapped;
    }
    return error instanceof Error ? error : new Error('admin operation failed');
  }
}
