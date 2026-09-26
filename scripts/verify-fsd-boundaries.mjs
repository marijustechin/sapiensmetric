#!/usr/bin/env node
/**
 * verify-fsd-boundaries.mjs — lightweight FSD light import-boundary check.
 *
 * Enforces the layer direction documented in `docs/fsd-light.md` for the web
 * app (`apps/web`):
 *
 *   app (4) -> widgets (3) -> features (2) -> shared (1)
 *
 * A module may import from its own layer or any lower layer, never an upper
 * one. Cross-imports within a layer are allowed. Non-relative specifiers
 * (packages) and relative specifiers that resolve outside a layer directory
 * (e.g. `messages/`, framework config, CSS) are ignored.
 *
 * Dependency-free (Node built-ins only). Exit 0 = boundaries hold.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB_ROOT = join(ROOT, 'apps', 'web');

/**
 * Layer ranks: a module may import its own rank or lower, never higher.
 * Direction: app -> widgets -> features -> entities -> shared (T-012 adds
 * `entities` below `features`).
 */
const LAYERS = { app: 5, widgets: 4, features: 3, entities: 2, shared: 1 };
const FORBIDDEN_LAYER_DIRS = ['processes'];
const SOURCE_EXT = /\.(ts|tsx)$/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      walk(full, out);
    } else if (SOURCE_EXT.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** First path segment (under WEB_ROOT) that is a known layer, else null. */
function layerOf(absPath) {
  const rel = relative(WEB_ROOT, absPath);
  if (rel.startsWith('..')) return null;
  const first = rel.split(sep)[0];
  return Object.prototype.hasOwnProperty.call(LAYERS, first) ? first : null;
}

const IMPORT_RE =
  /(?:from\s*|import\s*\(\s*|^\s*import\s*)['"]([^'"]+)['"]/gm;

const violations = [];

for (const layer of Object.keys(LAYERS)) {
  for (const file of walk(join(WEB_ROOT, layer))) {
    const sourceLayer = layerOf(file);
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (const [index, lineText] of lines.entries()) {
      let match;
      IMPORT_RE.lastIndex = 0;
      while ((match = IMPORT_RE.exec(lineText)) !== null) {
        const spec = match[1];
        if (!spec.startsWith('.')) continue; // package or absolute import
        const targetLayer = layerOf(resolve(dirname(file), spec));
        if (!targetLayer) continue; // outside the layer dirs (messages, css, ...)
        if (LAYERS[targetLayer] > LAYERS[sourceLayer]) {
          violations.push(
            `${relative(ROOT, file)}:${index + 1} imports higher layer ` +
              `'${spec}' (${sourceLayer} -> ${targetLayer})`,
          );
        }
      }
    }
  }
}

for (const forbidden of FORBIDDEN_LAYER_DIRS) {
  if (existsSync(join(WEB_ROOT, forbidden))) {
    violations.push(
      `apps/web/${forbidden}/ must not exist yet (FSD light has no such layer)`,
    );
  }
}

if (violations.length > 0) {
  console.error('FSD light boundary violations:');
  for (const v of violations) console.error(`  - ${v}`);
  console.error(`\nverify-fsd-boundaries: ${violations.length} violation(s).`);
  process.exit(1);
}

console.log('verify-fsd-boundaries: all FSD light boundaries hold.');
