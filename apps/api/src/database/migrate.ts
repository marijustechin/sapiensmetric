import 'reflect-metadata';
import { loadAppConfig } from '../config/env.js';
import { createDataSource } from './data-source.js';

async function run(): Promise<void> {
  const config = loadAppConfig();
  const dataSource = createDataSource(config);
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
    console.log('Migrations run successfully.');
  } finally {
    await dataSource.destroy();
  }
}

void run().catch((error) => {
  console.error('Migration run failed:', error);
  process.exit(1);
});
