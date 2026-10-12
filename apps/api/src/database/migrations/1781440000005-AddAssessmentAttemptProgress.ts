import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T-022 correction: explicit "meaningful progress" flag for assessment attempts.
 *
 * An untouched draft (started, never saved answers, never submitted) must not
 * appear in normal history, but the draft row is retained for snapshot/ownership
 * integrity. `hasProgress` is set when a save actually applies answer operations
 * (and on submission); it is deliberately NOT derived from the `revision`
 * counter, which an empty save can increment.
 *
 * Additive and safe by default: `false` for all existing rows. Existing attempts
 * keep working; attempts that were submitted remain visible because history also
 * includes every `finalised` attempt. This is not exposure tracking.
 */
export class AddAssessmentAttemptProgress1781440000005
  implements MigrationInterface
{
  name = 'AddAssessmentAttemptProgress1781440000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `assessment_attempts` ADD `hasProgress` tinyint(1) NOT NULL DEFAULT 0',
    );
    // Backfill: pre-migration attempts that were submitted, still hold answers,
    // or had any successful save (the old code only incremented `revision` on
    // save/submit, so `revision > 0` catches attempts whose answers were later
    // cleared) must remain visible in history. Only genuinely untouched drafts
    // keep hasProgress = 0. This is a one-off legacy backfill; going forward,
    // visibility is driven by the explicit flag, not `revision`.
    await queryRunner.query(
      "UPDATE `assessment_attempts` SET `hasProgress` = 1 WHERE `status` = 'finalised' OR JSON_LENGTH(`answers`) > 0 OR `revision` > 0",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `assessment_attempts` DROP COLUMN `hasProgress`',
    );
  }
}
