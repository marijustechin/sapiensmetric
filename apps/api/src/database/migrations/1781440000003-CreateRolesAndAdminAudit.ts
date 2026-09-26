import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T-012: per-user role + account status, and the administrative audit trail.
 *
 * - `users.role` (`user` | `editor` | `admin`) defaults to `user`, so existing
 *   users and all public registrations default correctly.
 * - `users.status` (`active` | `suspended`) is independent of
 *   `emailVerifiedAt` and defaults to `active`.
 * - `admin_audit_log` stores successful administrative mutations. It holds no
 *   credentials or tokens; `before`/`after` are small JSON snapshots.
 */
export class CreateRolesAndAdminAudit1781440000003
  implements MigrationInterface
{
  name = 'CreateRolesAndAdminAudit1781440000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `users` ADD COLUMN `role` varchar(16) NOT NULL DEFAULT 'user'",
    );
    await queryRunner.query(
      "ALTER TABLE `users` ADD COLUMN `status` varchar(16) NOT NULL DEFAULT 'active'",
    );
    await queryRunner.query(
      'ALTER TABLE `users` ADD INDEX `IDX_users_role` (`role`)',
    );
    await queryRunner.query(
      'ALTER TABLE `users` ADD INDEX `IDX_users_status` (`status`)',
    );

    await queryRunner.query(`
      CREATE TABLE \`admin_audit_log\` (
        \`id\` varchar(36) NOT NULL,
        \`actorType\` varchar(16) NOT NULL,
        \`actorUserId\` varchar(36) NULL,
        \`actorLabel\` varchar(255) NULL,
        \`action\` varchar(64) NOT NULL,
        \`targetUserId\` varchar(36) NULL,
        \`beforeValue\` json NULL,
        \`afterValue\` json NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_admin_audit_target\` (\`targetUserId\`, \`createdAt\`),
        KEY \`IDX_admin_audit_actor\` (\`actorUserId\`, \`createdAt\`),
        CONSTRAINT \`FK_admin_audit_actor\` FOREIGN KEY (\`actorUserId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_admin_audit_target\` FOREIGN KEY (\`targetUserId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `admin_audit_log`');
    await queryRunner.query('ALTER TABLE `users` DROP INDEX `IDX_users_status`');
    await queryRunner.query('ALTER TABLE `users` DROP INDEX `IDX_users_role`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `status`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `role`');
  }
}
