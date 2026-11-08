import { describe, expect, it } from 'vite-plus/test';
import { checkVendored, syncPlan } from '../src/lib/evicons.ts';
import type { Visual } from '../src/lib/model.ts';
import { dataset, family } from './fixtures.ts';

const icon = (file: string): Visual => ({
  kind: 'icon',
  file,
  title: 'Icon',
  orientation: 'mating_face',
  accuracy: 'schematic',
  provenance: 'third_party',
  author: 'Landolsi Digital (EVicons)',
  license: 'MIT',
  sourceUrl: 'https://github.com/evicons/evicons',
});

const withIcons = (...files: string[]) => {
  const f = family();
  f.variants[0]!.visuals = files.map(icon);
  f.variants[1]!.visuals = files.map(icon);
  return dataset([f]);
};

const bytes = (text: string) => new TextEncoder().encode(text);

describe('syncPlan', () => {
  it('copies only the LICENSE when no visual references an EVicons icon', () => {
    expect(syncPlan(dataset([family()]))).toEqual([{ source: 'LICENSE', target: 'LICENSE' }]);
  });

  it('copies each referenced EVicons icon once, ignoring extension icons and drawings', () => {
    const ds = withIcons(
      'icons/evicons/plug-type-2.svg',
      'icons/evicons-extension/plug-nema.svg',
      'connectors/test-plug/front.svg',
    );
    expect(syncPlan(ds)).toEqual([
      { source: 'LICENSE', target: 'LICENSE' },
      { source: 'svg/plug-type-2.svg', target: 'plug-type-2.svg' },
    ]);
  });
});

describe('checkVendored', () => {
  const plan = [
    { source: 'LICENSE', target: 'LICENSE' },
    { source: 'svg/plug-type-2.svg', target: 'plug-type-2.svg' },
  ];
  const files = (entries: Record<string, string>) => (path: string) =>
    path in entries ? bytes(entries[path]!) : undefined;

  it('accepts byte-identical vendored files', () => {
    const pkg = files({ LICENSE: 'MIT', 'svg/plug-type-2.svg': '<svg/>' });
    const vendored = files({ LICENSE: 'MIT', 'plug-type-2.svg': '<svg/>' });
    expect(checkVendored(plan, pkg, vendored)).toEqual([]);
  });

  it('reports vendored files that are missing or differ from the package', () => {
    const pkg = files({ LICENSE: 'MIT', 'svg/plug-type-2.svg': '<svg/>' });
    const vendored = files({ 'plug-type-2.svg': '<svg />' });
    const issues = checkVendored(plan, pkg, vendored).join('\n');
    expect(issues).toMatch(/LICENSE: missing/);
    expect(issues).toMatch(/plug-type-2.svg: differs from @evicons\/svg svg\/plug-type-2.svg/);
  });

  it('reports a referenced icon that the package does not provide', () => {
    const pkg = files({ LICENSE: 'MIT' });
    const vendored = files({ LICENSE: 'MIT' });
    expect(checkVendored(plan, pkg, vendored).join('\n')).toMatch(
      /svg\/plug-type-2.svg: not found in @evicons\/svg/,
    );
  });
});
