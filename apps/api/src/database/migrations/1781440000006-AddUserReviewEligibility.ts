import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T-023 closed-review eligibility for users.
 *
 * Adds `users.reviewEligible` (default `false`). Only the operator provisioning
 * workflow grants it, so no public registration or Google sign-in can ever
 * become review-eligible. Additive and safe: every existing account keeps the
 * default `false` (no implicit review access for previously created accounts).
 */
export class AddUserReviewEligibility1781440000006
  implements MigrationInterface
{
  name = 'AddUserReviewEligibility1781440000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` ADD `reviewEligible` tinyint(1) NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE `users` ADD INDEX `IDX_users_reviewEligible` (`reviewEligible`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` DROP INDEX `IDX_users_reviewEligible`',
    );
    await queryRunner.query(
      'ALTER TABLE `users` DROP COLUMN `reviewEligible`',
    );
  }
}
