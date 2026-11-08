import { describe, expect, it } from 'vite-plus/test';
import { validateReferences } from '../src/lib/validate.ts';
import { dataset, family } from './fixtures.ts';

const issuesOf = (...families: ReturnType<typeof family>[]) =>
  validateReferences(dataset(families), { svgExists: () => true }).join('\n');

describe('validateReferences', () => {
  it('accepts a consistent family', () => {
    expect(issuesOf(family())).toBe('');
  });

  it('checks that the file path matches the id and the category', () => {
    const ds = dataset([family()]);
    ds.families[0]!.path = 'data/ev/other-name.json';
    const issues = validateReferences(ds, { svgExists: () => true }).join('\n');
    expect(issues).toMatch(/file name/);
    expect(issues).toMatch(/directory/);
  });

  it('rejects duplicate family ids and duplicate ids inside a family', () => {
    expect(issuesOf(family(), family())).toMatch(/duplicate family id/);
    const f = family();
    f.sources.push({ ...f.sources[0]! });
    expect(issuesOf(f)).toMatch(/duplicate source id 'src'/);
  });

  it('rejects unknown profile, source and standard references', () => {
    const f = family();
    f.variants[0]!.electricalProfiles = ['missing'];
    f.electricalProfiles[0]!.sourceRefs = ['nope'];
    f.electricalProfiles[0]!.standardRef = 'nostd';
    const issues = issuesOf(f);
    expect(issues).toMatch(/unknown electrical profile 'missing'/);
    expect(issues).toMatch(/unknown source 'nope'/);
    expect(issues).toMatch(/unknown standard 'nostd'/);
  });

  it('flags a profile used by no variant', () => {
    const f = family();
    for (const v of f.variants) v.electricalProfiles = [];
    expect(issuesOf(f)).toMatch(/not used by any variant/);
  });

  it('runs electrical consistency rules against the variants using the profile', () => {
    const f = family();
    f.variants[1]!.contacts = [{ id: 'L', label: 'L', gender: 'female' }];
    expect(issuesOf(f)).toMatch(/contact 'N' is not defined on variant 'socket'/);
  });

  it('rejects mating references to unknown families or variants', () => {
    const f = family();
    f.variants[0]!.matesWith = [
      { family: 'ghost', variant: 'plug' },
      { family: 'test-plug', variant: 'ghost' },
    ];
    const issues = issuesOf(f);
    expect(issues).toMatch(/unknown variant 'ghost\/plug'/);
    expect(issues).toMatch(/unknown variant 'test-plug\/ghost'/);
  });

  it('rejects matings stored in both directions or with itself', () => {
    const f = family();
    f.variants[1]!.matesWith = [{ family: 'test-plug', variant: 'plug' }];
    expect(issuesOf(f)).toMatch(/both directions/);
    const g = family();
    g.variants[0]!.matesWith = [{ family: 'test-plug', variant: 'plug' }];
    expect(issuesOf(g)).toMatch(/itself/);
  });

  it('rejects relations to unknown families', () => {
    expect(
      issuesOf(family({ relations: [{ type: 'extends', family: 'ghost', note: null }] })),
    ).toMatch(/unknown family 'ghost'/);
  });

  it('checks mapping values against the external vocabularies', () => {
    const f = family();
    f.mappings['ocpi-2.2.1'] = [{ value: 'NOT_A_VALUE', match: 'exact' }];
    f.mappings.openstreetmap = [{ value: 'socket:schuko', match: 'exact', variants: ['ghost'] }];
    const issues = issuesOf(f);
    expect(issues).toMatch(/'NOT_A_VALUE' is not a known ocpi-2.2.1 value/);
    expect(issues).toMatch(
      /openstreetmap mapping 'socket:schuko' refers to unknown variant 'ghost'/,
    );
  });

  it('accepts unknown values in an open vocabulary', () => {
    const ds = dataset([family()]);
    ds.vocabularies[1]!.vocabulary = 'open';
    ds.families[0]!.family.mappings['ocpi-2.3.0'] = [{ value: 'VENDOR_SPECIFIC', match: 'exact' }];
    expect(validateReferences(ds, { svgExists: () => true })).toEqual([]);
  });

  it('checks visual files exist and their sources are known', () => {
    const f = family();
    f.variants[0]!.visuals = [
      {
        kind: 'front_view',
        file: 'connectors/test-plug/plug-front.svg',
        title: 'Front',
        orientation: 'mating_face',
        accuracy: 'schematic',
        provenance: 'original',
        author: 'OpenPlugDB contributors',
        license: 'CC-BY-4.0',
        basedOn: ['ghost'],
      },
    ];
    const issues = validateReferences(dataset([f]), { svgExists: () => false }).join('\n');
    expect(issues).toMatch(/missing SVG file 'connectors\/test-plug\/plug-front.svg'/);
    expect(issues).toMatch(/unknown source 'ghost'/);
  });

  it('requires third-party visuals to declare their source URL', () => {
    const f = family();
    f.variants[0]!.visuals = [
      {
        kind: 'technical_diagram',
        file: 'connectors/test-plug/diagram.svg',
        title: 'Diagram',
        orientation: 'not_applicable',
        accuracy: 'schematic',
        provenance: 'third_party',
        author: 'Someone',
        license: 'CC0-1.0',
      },
    ];
    expect(issuesOf(f)).toMatch(/sourceUrl/);
  });

  it('keeps drawings in the folder of their family', () => {
    const f = family();
    f.variants[0]!.visuals = [
      {
        kind: 'front_view',
        file: 'connectors/other-family/plug-front.svg',
        title: 'Front',
        orientation: 'mating_face',
        accuracy: 'schematic',
        provenance: 'original',
        author: 'A',
        license: 'CC-BY-4.0',
      },
      {
        kind: 'technical_diagram',
        file: 'icons/evicons-extension/diagram.svg',
        title: 'Diagram',
        orientation: 'not_applicable',
        accuracy: 'schematic',
        provenance: 'original',
        author: 'A',
        license: 'CC-BY-4.0',
      },
    ];
    const issues = issuesOf(f);
    expect(issues).toMatch(/plug-front.svg': file must live under 'connectors\/test-plug\/'/);
    expect(issues).toMatch(/diagram.svg': file must live under 'connectors\/test-plug\/'/);
  });

  describe('icons', () => {
    const upstreamIcon = {
      kind: 'icon' as const,
      file: 'icons/evicons/plug-type-2.svg',
      title: 'Type 2 icon',
      orientation: 'mating_face' as const,
      accuracy: 'schematic' as const,
      provenance: 'third_party' as const,
      author: 'Landolsi Digital (EVicons)',
      license: 'MIT',
      sourceUrl: 'https://github.com/evicons/evicons/blob/v0.8.0/packages/svg/svg/plug-type-2.svg',
    };
    const withVisual = (visual: Record<string, unknown>) => {
      const f = family();
      f.variants[0]!.visuals = [visual as unknown as (typeof f.variants)[0]['visuals'][0]];
      return issuesOf(f);
    };

    it('accepts a vendored EVicons icon and an extension icon outside the family folder', () => {
      expect(withVisual(upstreamIcon)).toBe('');
      expect(
        withVisual({
          ...upstreamIcon,
          file: 'icons/evicons-extension/plug-test.svg',
          provenance: 'original',
          author: 'OpenPlugDB contributors',
          sourceUrl: undefined,
        }),
      ).toBe('');
    });

    it('requires icons to live under icons/', () => {
      expect(withVisual({ ...upstreamIcon, file: 'connectors/test-plug/icon.svg' })).toMatch(
        /icon must live under 'icons\/'/,
      );
    });

    it('requires vendored EVicons icons to be third-party MIT files with a source URL', () => {
      expect(withVisual({ ...upstreamIcon, provenance: 'original' })).toMatch(
        /EVicons icon must have provenance 'third_party'/,
      );
      expect(withVisual({ ...upstreamIcon, license: 'CC-BY-4.0' })).toMatch(
        /EVicons icon must have license 'MIT'/,
      );
      expect(withVisual({ ...upstreamIcon, sourceUrl: undefined })).toMatch(/sourceUrl/);
    });
  });

  it('requires a mating-face orientation for front views', () => {
    const f = family();
    f.variants[0]!.visuals = [
      {
        kind: 'front_view',
        file: 'connectors/test-plug/x.svg',
        title: 'Front',
        orientation: 'side',
        accuracy: 'schematic',
        provenance: 'original',
        author: 'A',
        license: 'CC-BY-4.0',
      },
    ];
    expect(issuesOf(f)).toMatch(/mating_face/);
  });
});
