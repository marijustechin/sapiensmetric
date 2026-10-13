import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/**
 * The single, explicit, committed active production profile (T-023).
 *
 * Stored in `deploy/production-profile` (one word: `public` or `closed`) and read
 * by BOTH deployment workflows:
 *   - the automatic workflow (deploy.yml) deploys the artifact, and verifies
 *     production, for the ACTIVE profile of the pushed revision;
 *   - the guarded manual workflow (deploy-closed.yml, confirm=activate) activates
 *     the `closed` profile by committing `closed` here.
 *
 * This means that while `closed` is active, every relevant main push builds,
 * deploys and verifies the COMPLETE closed artifact from that push's source
 * revision — retained old shells are never treated as a current deployment.
 */
export const PROFILES = ['public', 'closed'];

export function parseProfile(text) {
  const value = String(text).trim().toLowerCase();
  if (!PROFILES.includes(value)) {
    throw new Error(
      `invalid production profile ${JSON.stringify(text)}; expected one of ${PROFILES.join('|')}`,
    );
  }
  return value;
}

/** Map a profile to the artifact directory to deploy and the app-routes expectation. */
export function profileTargets(profile) {
  if (profile === 'closed') {
    return { profile, artifact: 'dist/closed-site', appRoutes: '200' };
  }
  return { profile, artifact: 'dist/public-site', appRoutes: '404' };
}

export function readProfile(root) {
  return parseProfile(readFileSync(join(root, 'deploy', 'production-profile'), 'utf8'));
}

function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const target = profileTargets(readProfile(repoRoot));
  // Emitted for `>> "$GITHUB_OUTPUT"`.
  process.stdout.write(
    `profile=${target.profile}\nartifact=${target.artifact}\napp_routes=${target.appRoutes}\n`,
  );
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(`production-profile: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
