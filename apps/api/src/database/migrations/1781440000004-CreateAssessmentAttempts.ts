import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T-017: persisted assessment attempts.
 *
 * Stores the exact keyed form snapshot, the caller's saved answers, and the
 * finalised result (all JSON) plus the status/revision used for the minimal
 * in_progress -> finalised lifecycle and optimistic concurrency.
 */
export class CreateAssessmentAttempts1781440000004
  implements MigrationInterface
{
  name = 'CreateAssessmentAttempts1781440000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`assessment_attempts\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(36) NOT NULL,
        \`assessmentId\` varchar(64) NOT NULL,
        \`assessmentVersion\` varchar(32) NOT NULL,
        \`formId\` varchar(64) NOT NULL,
        \`formVersion\` varchar(32) NOT NULL,
        \`languageScope\` varchar(16) NOT NULL,
        \`translationVersion\` varchar(32) NOT NULL,
        \`scoringRuleVersion\` varchar(32) NOT NULL,
        \`snapshot\` json NOT NULL,
        \`answers\` json NOT NULL,
        \`status\` varchar(16) NOT NULL DEFAULT 'in_progress',
        \`revision\` int NOT NULL DEFAULT 0,
        \`result\` json NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`finalisedAt\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_assessment_attempts_user\` (\`userId\`, \`createdAt\`),
        CONSTRAINT \`FK_assessment_attempts_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`assessment_attempts\``);
  }
}
