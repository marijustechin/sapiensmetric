import 'reflect-metadata';
import { loadAppConfig } from '../config/env.js';
import { createDataSource } from './data-source.js';

/**
 * Explicit, named retention cleanup for T-006 action tokens. Removes consumed
 * and expired tokens. There is no cron, queue, or background worker; this
 * command must be invoked deliberately.
 */
async function run(): Promise<void> {
  const config = loadAppConfig();
  const dataSource = createDataSource(config);
  await dataSource.initialize();
  try {
    const result = (await dataSource.query(
      'DELETE FROM email_action_tokens WHERE consumedAt IS NOT NULL OR expiresAt < NOW(6)',
    )) as { affectedRows?: number };
    const removed = result.affectedRows ?? 0;
    console.log(`Action-token cleanup: ${removed} stale token(s) removed.`);
  } finally {
    await dataSource.destroy();
  }
}

void run().catch(() => {
  console.error('Action-token cleanup failed.');
  process.exit(1);
});
