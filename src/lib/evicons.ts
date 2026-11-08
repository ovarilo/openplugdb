import type { Dataset } from './dataset.ts';
import { EVICONS_DIR } from './validate.ts';

/** npm package the vendored icons come from (exact version pinned in package.json). */
export const EVICONS_PACKAGE = '@evicons/svg';

/** One file to vendor: `source` is relative to the package root, `target` to public/images/icons/evicons/. */
export interface SyncEntry {
  source: string;
  target: string;
}

/** Reads a file's bytes, or returns undefined when it does not exist. Injected to keep this pure. */
export type ReadBytes = (path: string) => Uint8Array | undefined;

/**
 * Files to copy unchanged from the package: its LICENSE (always, so the MIT
 * notice travels with the icons) and every icon a visual references under
 * icons/evicons/. Extension icons and drawings are ours and are not synced.
 */
export function syncPlan(dataset: Dataset): SyncEntry[] {
  const names = new Set<string>();
  for (const { family } of dataset.families) {
    for (const variant of family.variants) {
      for (const visual of variant.visuals) {
        if (visual.file.startsWith(EVICONS_DIR)) names.add(visual.file.slice(EVICONS_DIR.length));
      }
    }
  }
  return [
    { source: 'LICENSE', target: 'LICENSE' },
    ...[...names].sort().map((name) => ({ source: `svg/${name}`, target: name })),
  ];
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

/** Differences between the vendored copies and the package. Empty when they are byte-identical. */
export function checkVendored(
  plan: SyncEntry[],
  readPackage: ReadBytes,
  readVendored: ReadBytes,
): string[] {
  const issues: string[] = [];
  for (const { source, target } of plan) {
    const upstream = readPackage(source);
    if (upstream === undefined) {
      issues.push(`${source}: not found in ${EVICONS_PACKAGE}`);
      continue;
    }
    const vendored = readVendored(target);
    if (vendored === undefined) issues.push(`${target}: missing (run bun run icons:sync)`);
    else if (!sameBytes(upstream, vendored))
      issues.push(`${target}: differs from ${EVICONS_PACKAGE} ${source} (run bun run icons:sync)`);
  }
  return issues;
}
