import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailActionTokens1781440000001
  implements MigrationInterface
{
  name = 'CreateEmailActionTokens1781440000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` ADD COLUMN `emailVerifiedAt` datetime(6) NULL',
    );

    await queryRunner.query(`
      CREATE TABLE \`email_action_tokens\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`purpose\` varchar(16) NOT NULL,
        \`tokenHash\` varchar(64) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`expiresAt\` datetime NOT NULL,
        \`consumedAt\` datetime NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_email_action_tokens_tokenHash\` (\`tokenHash\`),
        KEY \`IDX_email_action_tokens_user_purpose\` (\`userId\`, \`purpose\`),
        CONSTRAINT \`FK_email_action_tokens_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `email_action_tokens`');
    await queryRunner.query(
      'ALTER TABLE `users` DROP COLUMN `emailVerifiedAt`',
    );
  }
}
