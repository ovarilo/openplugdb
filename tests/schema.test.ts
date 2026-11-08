import { describe, expect, it } from 'vite-plus/test';
import { compileSchema } from '../src/lib/schema.ts';
import { family } from './fixtures.ts';

const validate = compileSchema(process.cwd(), 'connector-family.schema.json');

const errorsOf = (data: unknown) =>
  validate(data) ? [] : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);

describe('connector family schema', () => {
  it('accepts the reference fixture', () => {
    expect(errorsOf(family())).toEqual([]);
  });

  it('requires unknown values to be explicit nulls, not missing keys', () => {
    const f = family() as unknown as { electricalProfiles: Record<string, unknown>[] };
    delete f.electricalProfiles[0]!['current'];
    expect(errorsOf(f).join('\n')).toMatch(/current/);
  });

  it('accepts null for unknown values', () => {
    const f = family();
    Object.assign(f.electricalProfiles[0]!, {
      current: null,
      voltage: null,
      neutral: null,
      frequencyHz: null,
      phases: null,
    });
    expect(errorsOf(f)).toEqual([]);
  });

  it('forbids frequency and phases on a DC profile (not applicable)', () => {
    const f = family();
    Object.assign(f.electricalProfiles[0]!, {
      currentType: 'dc',
      supply: 'dc',
      voltage: { qualifier: 'max', value: 1000, reference: 'dc' },
    });
    const errors = errorsOf(f).join('\n');
    expect(errors).toMatch(/must NOT be valid/);
  });

  it('requires frequency and phases on an AC profile', () => {
    const f = family();
    delete f.electricalProfiles[0]!.frequencyHz;
    expect(errorsOf(f).join('\n')).toMatch(/frequencyHz/);
  });

  it('requires min and max for a range and a value otherwise', () => {
    const f = family();
    f.electricalProfiles[0]!.voltage = {
      qualifier: 'range',
      value: 230,
      reference: 'line_to_neutral',
    };
    expect(errorsOf(f).length).toBeGreaterThan(0);
    f.electricalProfiles[0]!.voltage = {
      qualifier: 'range',
      min: 200,
      max: 250,
      reference: 'line_to_neutral',
    };
    expect(errorsOf(f)).toEqual([]);
  });

  it('accepts visual files relative to public/images/ in the drawing and icon trees only', () => {
    const withFile = (file: string) => {
      const f = family();
      f.variants[0]!.visuals = [
        {
          kind: 'icon',
          file,
          title: 'Visual',
          orientation: 'mating_face',
          accuracy: 'schematic',
          provenance: 'original',
          author: 'A',
          license: 'MIT',
        },
      ];
      return errorsOf(f).join('\n');
    };
    expect(withFile('connectors/test-plug/plug-front.svg')).toBe('');
    expect(withFile('icons/evicons/plug-type-2.svg')).toBe('');
    expect(withFile('icons/evicons-extension/plug-test.svg')).toBe('');
    expect(withFile('test-plug/plug-front.svg')).toMatch(/pattern/);
    expect(withFile('icons/other/plug.svg')).toMatch(/pattern/);
    expect(withFile('connectors/a/b/c.svg')).toMatch(/pattern/);
  });

  it('rejects unknown properties and a stated power without sources', () => {
    const f = family() as unknown as Record<string, unknown>;
    f['power'] = 22;
    expect(errorsOf(f).join('\n')).toMatch(/additional properties/);
    const g = family();
    g.electricalProfiles[0]!.maxPowerKw = { value: 2, sourceRefs: [] };
    expect(errorsOf(g).length).toBeGreaterThan(0);
  });
});
