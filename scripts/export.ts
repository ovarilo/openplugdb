// Generates dist-data/connectors.json and dist-data/connectors.csv from data/.
// Usage: bun scripts/export.ts           write the exports
//        bun scripts/export.ts --check   fail if the committed exports are stale
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDataset, ROOT } from '../src/lib/dataset.ts';
import { buildExports } from '../src/lib/exports-files.ts';

const OUT = join(ROOT, 'dist-data');
const check = process.argv.includes('--check');

const files = buildExports(loadDataset());
const stale: string[] = [];
if (!check) mkdirSync(OUT, { recursive: true });

for (const [name, content] of Object.entries(files)) {
  const path = join(OUT, name);
  if (check) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content)
      stale.push(`dist-data/${name}`);
  } else {
    writeFileSync(path, content, 'utf8');
    console.log(`✓ wrote dist-data/${name}`);
  }
}

if (stale.length > 0) {
  console.error(
    `✗ stale exports: ${stale.join(', ')}. Run 'bun run export' and commit the result.`,
  );
  process.exit(1);
}
if (check) console.log('✓ dist-data/ is up to date with data/');
