import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1781440000000 implements MigrationInterface {
  name = 'CreateAuthTables1781440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(320) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_users_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`auth_sessions\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`tokenHash\` varchar(64) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`expiresAt\` datetime NOT NULL,
        \`revokedAt\` datetime NULL,
        \`replacedBySessionId\` varchar(36) NULL,
        \`revokedReason\` varchar(32) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_auth_sessions_tokenHash\` (\`tokenHash\`),
        KEY \`IDX_auth_sessions_userId\` (\`userId\`),
        CONSTRAINT \`FK_auth_sessions_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`auth_sessions\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
