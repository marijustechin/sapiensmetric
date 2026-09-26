import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { loadAppConfig } from '../config/env.js';
import { createDataSource } from './data-source.js';
import { User } from '../modules/users/user.entity.js';
import { AdminAuditLog } from '../modules/admin/admin-audit.entity.js';
import { ADMIN_AUDIT_ACTIONS } from '../modules/admin/admin-store.js';
import { decidePromotion, parseArgs, usage } from './promote-admin.logic.js';

/**
 * T-012 administrator bootstrap (see `promote-admin.logic.ts` for the pure
 * decision logic). Promotes one explicitly identified, existing, active,
 * verified account to `admin`; dry run unless `--apply`. Repeated execution is
 * safe. The action is recorded with an explicit CLI actor type.
 */
async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  const hasEmail = Boolean(args.email);
  const hasId = Boolean(args.id);
  if (hasEmail === hasId) {
    throw new Error(
      'Provide exactly one of --email or --id (the target must be unambiguous).',
    );
  }

  const config = loadAppConfig();
  const dataSource = createDataSource(config);
  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const target = hasEmail
      ? await users.findOne({ where: { email: args.email!.trim().toLowerCase() } })
      : await users.findOne({ where: { id: args.id! } });

    if (!target) {
      throw new Error('No account matches the given target.');
    }

    const decision = decidePromotion(target, args.apply);
    if (decision.kind === 'already-admin') {
      console.log(`${target.email} is already an administrator. No change made.`);
      return;
    }
    if (decision.kind === 'dry-run') {
      console.log(
        `DRY RUN: would promote ${target.email} (${target.id}) to admin. Re-run with --apply.`,
      );
      return;
    }

    await dataSource.transaction(async (manager) => {
      const locked = await manager
        .getRepository(User)
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: target.id })
        .getOne();
      if (!locked || locked.role === 'admin') {
        return;
      }
      await manager
        .getRepository(User)
        .update({ id: locked.id }, { role: 'admin' });
      await manager.getRepository(AdminAuditLog).insert({
        id: randomUUID(),
        actorType: 'cli',
        actorUserId: null,
        actorLabel: 'cli:promote-admin',
        action: ADMIN_AUDIT_ACTIONS.promotedAdmin,
        targetUserId: locked.id,
        // Cast: TypeORM's DeepPartial typing is narrower than the json column.
        beforeValue: { role: locked.role } as never,
        afterValue: { role: 'admin' } as never,
      });
    });

    console.log(`Promoted ${target.email} (${target.id}) to administrator.`);
  } finally {
    await dataSource.destroy();
  }
}

void run().catch((error) => {
  console.error(
    'admin:promote failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
