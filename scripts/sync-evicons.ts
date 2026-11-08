// Vendors the EVicons files the dataset references into public/images/icons/evicons/,
// byte for byte from the pinned @evicons/svg package, together with its LICENSE.
// Usage: bun scripts/sync-evicons.ts           copy the files
//        bun scripts/sync-evicons.ts --check   fail if a vendored file is missing or differs
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDataset, ROOT } from '../src/lib/dataset.ts';
import { checkVendored, EVICONS_PACKAGE, syncPlan, type ReadBytes } from '../src/lib/evicons.ts';
import { EVICONS_DIR } from '../src/lib/validate.ts';

const PACKAGE_ROOT = join(ROOT, 'node_modules', ...EVICONS_PACKAGE.split('/'));
const TARGET = join(ROOT, 'public', 'images', ...EVICONS_DIR.split('/').filter(Boolean));
const check = process.argv.includes('--check');

const fail = (issues: string[]) => {
  console.error(`✗ ${issues.length} issue(s):\n${issues.map((i) => `  - ${i}`).join('\n')}`);
  process.exit(1);
};

const pinned = (
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    devDependencies?: Record<string, string>;
  }
).devDependencies?.[EVICONS_PACKAGE];
const installedManifest = join(PACKAGE_ROOT, 'package.json');
if (!existsSync(installedManifest)) fail([`${EVICONS_PACKAGE} is not installed: run bun install`]);
const installed = (JSON.parse(readFileSync(installedManifest, 'utf8')) as { version: string })
  .version;
if (installed !== pinned)
  fail([`${EVICONS_PACKAGE} ${installed} is installed, package.json pins ${pinned}`]);

const reader =
  (root: string): ReadBytes =>
  (path) => {
    const file = join(root, path);
    return existsSync(file) ? readFileSync(file) : undefined;
  };

const plan = syncPlan(loadDataset());

if (check) {
  const issues = checkVendored(plan, reader(PACKAGE_ROOT), reader(TARGET));
  if (issues.length > 0) fail(issues);
  console.log(`✓ ${plan.length} vendored EVicons file(s) match ${EVICONS_PACKAGE}@${installed}`);
} else {
  const missing = plan.filter(({ source }) => !existsSync(join(PACKAGE_ROOT, source)));
  if (missing.length > 0)
    fail(missing.map(({ source }) => `${source}: not found in ${EVICONS_PACKAGE}`));
  mkdirSync(TARGET, { recursive: true });
  for (const { source, target } of plan) {
    copyFileSync(join(PACKAGE_ROOT, source), join(TARGET, target));
    console.log(`✓ ${EVICONS_PACKAGE}/${source} -> public/images/${EVICONS_DIR}${target}`);
  }
}
