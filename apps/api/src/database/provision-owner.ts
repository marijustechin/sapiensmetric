import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadAppConfig } from '../config/env.js';
import { createDataSource } from './data-source.js';
import { User } from '../modules/users/user.entity.js';
import { AdminAuditLog } from '../modules/admin/admin-audit.entity.js';
import { ADMIN_AUDIT_ACTIONS } from '../modules/admin/admin-store.js';
import { Argon2PasswordService } from '../modules/auth/password.service.js';
import {
  assertPasswordAcceptable,
  generatePassword,
  isValidEmail,
  parseProvisionArgs,
  usage,
} from './provision-owner.logic.js';

/**
 * T-023 owner-account provisioning (operator workflow).
 *
 * Creates or updates the owner's account directly in the database and marks it
 * as an authorised closed-review reviewer. There is deliberately no HTTP
 * bootstrap endpoint, no development-database clone, and no reused session.
 * Run inside the API container:
 *
 *   docker compose -f deploy/compose.yaml run --rm --entrypoint node api \
 *     dist/database/provision-owner.js --email owner@example.org --apply
 *
 * A generated password is printed exactly once; it is never written to a log
 * file by this command.
 */
async function readStdin(): Promise<string> {
  return readFileSync(0, 'utf8').replace(/\r?\n$/, '');
}

async function run(): Promise<void> {
  const args = parseProvisionArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.email || !isValidEmail(args.email)) {
    throw new Error('Provide a valid --email address.');
  }
  const email = args.email.trim().toLowerCase();

  const providedPassword = args.passwordStdin ? await readStdin() : undefined;
  if (providedPassword !== undefined) {
    assertPasswordAcceptable(providedPassword);
  }
  const generated = providedPassword === undefined && !args.grantReview;
  const password = generated ? generatePassword() : providedPassword;

  const config = loadAppConfig();
  const dataSource = createDataSource(config);
  const passwords = new Argon2PasswordService();
  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const existing = await users.findOne({ where: { email } });

    if (args.grantReview) {
      if (!existing) {
        throw new Error(
          `No account matches ${email}; create it first (owner:provision without --grant-review).`,
        );
      }
      if (!args.apply) {
        console.log(
          `DRY RUN: would mark ${email} (${existing.id}) as a closed-review reviewer. Re-run with --apply.`,
        );
        return;
      }
      await users.update({ id: existing.id }, { reviewEligible: true });
      await dataSource.getRepository(AdminAuditLog).insert({
        id: randomUUID(),
        actorType: 'cli',
        actorUserId: null,
        actorLabel: 'cli:provision-owner',
        action: ADMIN_AUDIT_ACTIONS.reviewEligibilityChanged,
        targetUserId: existing.id,
        beforeValue: { reviewEligible: existing.reviewEligible } as never,
        afterValue: { reviewEligible: true } as never,
      });
      console.log(`Granted closed-review eligibility to ${email}.`);
      return;
    }

    if (!args.apply) {
      console.log(
        `DRY RUN: would ${existing ? 'update' : 'create'} the owner account ${email} ` +
          'with role admin, verified email and closed-review eligibility. ' +
          'Re-run with --apply.',
      );
      return;
    }

    const passwordHash = await passwords.hash(password as string);
    const now = new Date();
    await dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      if (existing) {
        await repo.update(
          { id: existing.id },
          {
            passwordHash,
            emailVerifiedAt: existing.emailVerifiedAt ?? now,
            role: 'admin',
            status: 'active',
            reviewEligible: true,
          },
        );
        await manager.getRepository(AdminAuditLog).insert({
          id: randomUUID(),
          actorType: 'cli',
          actorUserId: null,
          actorLabel: 'cli:provision-owner',
          action: ADMIN_AUDIT_ACTIONS.provisionedOwner,
          targetUserId: existing.id,
          beforeValue: {
            role: existing.role,
            status: existing.status,
            verified: Boolean(existing.emailVerifiedAt),
            reviewEligible: existing.reviewEligible,
          } as never,
          afterValue: {
            role: 'admin',
            status: 'active',
            verified: true,
            reviewEligible: true,
          } as never,
        });
      } else {
        const created = await repo.save(
          repo.create({
            email,
            passwordHash,
            emailVerifiedAt: now,
            role: 'admin',
            status: 'active',
            reviewEligible: true,
          }),
        );
        await manager.getRepository(AdminAuditLog).insert({
          id: randomUUID(),
          actorType: 'cli',
          actorUserId: null,
          actorLabel: 'cli:provision-owner',
          action: ADMIN_AUDIT_ACTIONS.provisionedOwner,
          targetUserId: created.id,
          beforeValue: null,
          afterValue: {
            role: 'admin',
            status: 'active',
            verified: true,
            reviewEligible: true,
          } as never,
        });
      }
    });

    console.log(`Owner account ready: ${email} (admin, verified, review-eligible).`);
    if (generated) {
      console.log('');
      console.log('Generated password (shown once — store it securely and delete this output):');
      console.log(`  ${password}`);
      console.log('');
      console.log('Change it after first sign-in. Do not paste it into chat or tickets.');
    }
  } finally {
    await dataSource.destroy();
  }
}

void run().catch((error) => {
  console.error(
    'owner:provision failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
