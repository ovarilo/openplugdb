import { describe, expect, it } from 'vite-plus/test';
import { primaryVisual, splitVisuals } from '../src/lib/format.ts';
import type { Visual } from '../src/lib/model.ts';
import { family } from './fixtures.ts';

const visual = (kind: Visual['kind'], file: string): Visual => ({
  kind,
  file,
  title: file,
  orientation: 'mating_face',
  accuracy: 'schematic',
  provenance: 'original',
  author: 'A',
  license: 'CC-BY-4.0',
});

describe('splitVisuals', () => {
  it('separates UI icons from technical drawings, keeping the variant of each visual', () => {
    const f = family();
    const front = visual('front_view', 'connectors/test-plug/plug-front.svg');
    const icon = visual('icon', 'icons/evicons/plug-type-2.svg');
    const diagram = visual('technical_diagram', 'connectors/test-plug/diagram.svg');
    f.variants[0]!.visuals = [front, icon];
    f.variants[1]!.visuals = [diagram];
    const { drawings, icons } = splitVisuals(f.variants);
    expect(drawings.map((d) => [d.variant.id, d.visual.file])).toEqual([
      ['plug', front.file],
      ['socket', diagram.file],
    ]);
    expect(icons.map((d) => [d.variant.id, d.visual.file])).toEqual([['plug', icon.file]]);
  });
});

describe('primaryVisual', () => {
  it('prefers a front view and falls back to an icon when there is none', () => {
    const f = family();
    const icon = visual('icon', 'icons/evicons/plug-type-2.svg');
    f.variants[0]!.visuals = [icon];
    expect(primaryVisual(f.variants)).toBe(icon);
    const front = visual('front_view', 'connectors/test-plug/plug-front.svg');
    f.variants[1]!.visuals = [front];
    expect(primaryVisual(f.variants)).toBe(front);
  });
});
