import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserIdentities1781440000002 implements MigrationInterface {
  name = 'CreateUserIdentities1781440000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`user_identities\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`provider\` varchar(32) NOT NULL,
        \`subject\` varchar(255) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_user_identities_provider_subject\` (\`provider\`, \`subject\`),
        KEY \`IDX_user_identities_userId\` (\`userId\`),
        CONSTRAINT \`FK_user_identities_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `user_identities`');
  }
}
