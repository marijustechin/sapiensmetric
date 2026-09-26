import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import type {
  AuditActorType,
  UserRole,
  UserStatus,
} from '@sapiensmetric/contracts';
import { User } from '../users/user.entity.js';
import { UserIdentity } from '../auth/identities/user-identity.entity.js';
import { AuthSession } from '../auth/sessions/auth-session.entity.js';
import { AdminAuditLog } from './admin-audit.entity.js';

export const ADMIN_AUDIT_ACTIONS = {
  roleChanged: 'user.role_changed',
  suspended: 'user.suspended',
  reactivated: 'user.reactivated',
  sessionsRevoked: 'user.sessions_revoked',
  promotedAdmin: 'user.promoted_admin',
} as const;

export interface AdminActor {
  type: AuditActorType;
  userId?: string | null;
  label?: string | null;
}

export interface AdminListQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  verified?: boolean;
  page: number;
  pageSize: number;
  sort: 'createdAt' | 'email';
  order: 'asc' | 'desc';
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

export interface AdminUserDetailRow extends AdminUserRow {
  providers: string[];
}

export interface AdminListResult {
  items: AdminUserRow[];
  total: number;
}

export interface AdminSummaryCounts {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
}

export interface AuditRecord {
  id: string;
  actorType: AuditActorType;
  actorUserId: string | null;
  actorLabel: string | null;
  action: string;
  targetUserId: string | null;
  before: unknown | null;
  after: unknown | null;
  createdAt: Date;
}

export interface AdminAuditInput {
  actor: AdminActor;
  action: string;
  targetUserId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

/** Target user does not exist. */
export class AdminNotFoundError extends Error {
  constructor() {
    super('target user not found');
    this.name = 'AdminNotFoundError';
  }
}

/** Self-protection or last-active-administrator protection. */
export class AdminConflictError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = 'AdminConflictError';
  }
}

export const ADMIN_STORE = Symbol('ADMIN_STORE');

export interface AdminStore {
  summary(): Promise<AdminSummaryCounts>;
  listUsers(query: AdminListQuery): Promise<AdminListResult>;
  getUserDetail(id: string): Promise<AdminUserDetailRow | null>;
  changeRole(
    actor: AdminActor,
    targetId: string,
    role: UserRole,
  ): Promise<AdminUserRow>;
  changeStatus(
    actor: AdminActor,
    targetId: string,
    status: UserStatus,
  ): Promise<AdminUserRow>;
  revokeSessions(actor: AdminActor, targetId: string): Promise<AdminUserRow>;
  listAudit(targetUserId: string | null, limit: number): Promise<AuditRecord[]>;
}

/** Read-only projection used by both the summary and row DTOs. */
function toRow(user: User): AdminUserRow {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class TypeOrmAdminStore implements AdminStore {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserIdentity)
    private readonly identities: Repository<UserIdentity>,
    @InjectRepository(AdminAuditLog)
    private readonly audit: Repository<AdminAuditLog>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  async summary(): Promise<AdminSummaryCounts> {
    const [totalUsers, verifiedUsers, activeUsers, adminUsers] =
      await Promise.all([
        this.users.count(),
        this.users.count({ where: { emailVerifiedAt: Not(IsNull()) } }),
        this.users.count({ where: { status: 'active' } }),
        this.users.count({ where: { role: 'admin' } }),
      ]);
    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      activeUsers,
      suspendedUsers: totalUsers - activeUsers,
      adminUsers,
    };
  }

  async listUsers(query: AdminListQuery): Promise<AdminListResult> {
    const qb = this.users.createQueryBuilder('u');
    if (query.search) {
      qb.andWhere('u.email LIKE :search', { search: `%${query.search}%` });
    }
    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }
    if (query.status) {
      qb.andWhere('u.status = :status', { status: query.status });
    }
    if (query.verified !== undefined) {
      qb.andWhere(
        query.verified ? 'u.emailVerifiedAt IS NOT NULL' : 'u.emailVerifiedAt IS NULL',
      );
    }
    const column = query.sort === 'email' ? 'u.email' : 'u.createdAt';
    qb.orderBy(column, query.order.toUpperCase() as 'ASC' | 'DESC');
    qb.addOrderBy('u.id', 'ASC');
    qb.skip((query.page - 1) * query.pageSize).take(query.pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map(toRow), total };
  }

  async getUserDetail(id: string): Promise<AdminUserDetailRow | null> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) return null;
    const links = await this.identities.find({ where: { userId: id } });
    const providers = [...new Set(links.map((l) => l.provider))].sort();
    return { ...toRow(user), providers };
  }

  /**
   * Locks the active, verified administrator set first (ordered by id) and then
   * the target row. Locking in this order serialises concurrent demotions or
   * suspensions and prevents losing the last administrator.
   */
  private async lockAdminsThenTarget(
    manager: EntityManager,
    targetId: string,
  ): Promise<{ admins: User[]; target: User }> {
    const admins = await manager
      .getRepository(User)
      .createQueryBuilder('u')
      .setLock('pessimistic_write')
      .where(
        "u.role = 'admin' AND u.status = 'active' AND u.emailVerifiedAt IS NOT NULL",
      )
      .orderBy('u.id', 'ASC')
      .getMany();

    const target = await manager
      .getRepository(User)
      .createQueryBuilder('u')
      .setLock('pessimistic_write')
      .where('u.id = :id', { id: targetId })
      .getOne();

    if (!target) {
      throw new AdminNotFoundError();
    }
    return { admins, target };
  }

  private async writeAudit(
    manager: EntityManager,
    input: AdminAuditInput,
  ): Promise<void> {
    await manager.getRepository(AdminAuditLog).insert({
      actorType: input.actor.type,
      actorUserId: input.actor.userId ?? null,
      actorLabel: input.actor.label ?? null,
      action: input.action,
      targetUserId: input.targetUserId,
      // Cast: TypeORM's DeepPartial typing is narrower than the json column.
      beforeValue: input.before as never,
      afterValue: input.after as never,
    });
  }

  async changeRole(
    actor: AdminActor,
    targetId: string,
    role: UserRole,
  ): Promise<AdminUserRow> {
    return this.dataSource.transaction(async (manager) => {
      const { admins, target } = await this.lockAdminsThenTarget(
        manager,
        targetId,
      );
      if (actor.userId && actor.userId === target.id) {
        throw new AdminConflictError('cannot change your own role');
      }
      const demotingAdmin = target.role === 'admin' && role !== 'admin';
      const targetIsActiveAdmin = admins.some((a) => a.id === target.id);
      if (demotingAdmin && targetIsActiveAdmin && admins.length <= 1) {
        throw new AdminConflictError('cannot remove the last active administrator');
      }

      const before = { role: target.role };
      await manager
        .getRepository(User)
        .update({ id: target.id }, { role });
      await this.writeAudit(manager, {
        actor,
        action: ADMIN_AUDIT_ACTIONS.roleChanged,
        targetUserId: target.id,
        before,
        after: { role },
      });
      return { ...toRow(target), role };
    });
  }

  async changeStatus(
    actor: AdminActor,
    targetId: string,
    status: UserStatus,
  ): Promise<AdminUserRow> {
    return this.dataSource.transaction(async (manager) => {
      const { admins, target } = await this.lockAdminsThenTarget(
        manager,
        targetId,
      );
      if (actor.userId && actor.userId === target.id) {
        throw new AdminConflictError('cannot change your own account status');
      }
      const suspendingAdmin = status === 'suspended' && target.role === 'admin';
      const targetIsActiveAdmin = admins.some((a) => a.id === target.id);
      if (suspendingAdmin && targetIsActiveAdmin && admins.length <= 1) {
        throw new AdminConflictError('cannot suspend the last active administrator');
      }

      const before = { status: target.status };
      await manager
        .getRepository(User)
        .update({ id: target.id }, { status });

      if (status === 'suspended') {
        // Suspension invalidates existing refresh sessions; access tokens are
        // rejected on the next request because the guard re-reads status.
        await manager
          .getRepository(AuthSession)
          .update(
            { userId: target.id, revokedAt: IsNull() },
            { revokedAt: new Date(), revokedReason: 'suspended' },
          );
      }

      await this.writeAudit(manager, {
        actor,
        action:
          status === 'suspended'
            ? ADMIN_AUDIT_ACTIONS.suspended
            : ADMIN_AUDIT_ACTIONS.reactivated,
        targetUserId: target.id,
        before,
        after: { status },
      });
      return { ...toRow(target), status };
    });
  }

  async revokeSessions(actor: AdminActor, targetId: string): Promise<AdminUserRow> {
    return this.dataSource.transaction(async (manager) => {
      const target = await manager
        .getRepository(User)
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: targetId })
        .getOne();
      if (!target) {
        throw new AdminNotFoundError();
      }
      await manager
        .getRepository(AuthSession)
        .update(
          { userId: target.id, revokedAt: IsNull() },
          { revokedAt: new Date(), revokedReason: 'admin_revoke' },
        );
      await this.writeAudit(manager, {
        actor,
        action: ADMIN_AUDIT_ACTIONS.sessionsRevoked,
        targetUserId: target.id,
        before: null,
        after: null,
      });
      return toRow(target);
    });
  }

  async listAudit(
    targetUserId: string | null,
    limit: number,
  ): Promise<AuditRecord[]> {
    const where = targetUserId ? { targetUserId } : {};
    const rows = await this.audit.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      actorType: r.actorType,
      actorUserId: r.actorUserId,
      actorLabel: r.actorLabel,
      action: r.action,
      targetUserId: r.targetUserId,
      before: r.beforeValue,
      after: r.afterValue,
      createdAt: r.createdAt,
    }));
  }
}
