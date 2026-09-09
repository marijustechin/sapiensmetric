import 'reflect-metadata';
import { loadAppConfig } from '../config/env.js';
import { createDataSource } from './data-source.js';

async function run(): Promise<void> {
  const config = loadAppConfig();
  const dataSource = createDataSource(config);
  await dataSource.initialize();
  try {
    const pending = await dataSource.showMigrations();
    const executed = await dataSource.query('SELECT name FROM migrations ORDER BY id');
    const executedNames = (executed as { name: string }[]).map((r) => r.name);
    console.log('Pending migrations:', pending);
    console.log('Executed migrations:', executedNames);
  } finally {
    await dataSource.destroy();
  }
}

void run().catch((error) => {
  console.error('Migration status failed:', error);
  process.exit(1);
});
