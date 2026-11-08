import { describe, expect, it } from 'vite-plus/test';
import { checkProfile, powerUpperBoundKw } from '../src/lib/electrical.ts';
import type { ElectricalProfile, Variant } from '../src/lib/model.ts';

const ac1: ElectricalProfile = {
  id: 'ac-1ph',
  name: 'AC single-phase',
  currentType: 'ac',
  supply: 'single_phase',
  phases: 1,
  neutral: true,
  protectiveEarth: true,
  voltage: { qualifier: 'rated', value: 230, reference: 'line_to_neutral' },
  current: { qualifier: 'rated', value: 16 },
  frequencyHz: [50, 60],
  maxPowerKw: null,
  conditions: [],
  contactFunctions: { L: 'line', N: 'neutral', PE: 'protective_earth' },
  standardRef: null,
  jurisdiction: null,
  sourceRefs: ['src'],
  confidence: 'high',
};

const ac3: ElectricalProfile = {
  ...ac1,
  id: 'ac-3ph',
  supply: 'three_phase',
  phases: 3,
  voltage: { qualifier: 'rated', value: 400, reference: 'line_to_line' },
  current: { qualifier: 'max', value: 32 },
  contactFunctions: { L1: 'line', L2: 'line', L3: 'line', N: 'neutral', PE: 'protective_earth' },
};

const dc: ElectricalProfile = {
  ...ac1,
  id: 'dc',
  currentType: 'dc',
  supply: 'dc',
  neutral: false,
  voltage: { qualifier: 'max', value: 1000, reference: 'dc' },
  current: { qualifier: 'max', value: 200 },
  contactFunctions: { 'DC+': 'dc_positive', 'DC-': 'dc_negative', PE: 'protective_earth' },
};
delete dc.phases;
delete dc.frequencyHz;

const variant = (contactIds: string[]): Variant => ({
  id: 'v',
  name: 'Variant',
  role: 'plug',
  contactGender: 'male',
  contacts: contactIds.map((id) => ({ id, label: id, gender: 'male' })),
  keying: null,
  mechanicalNotes: [],
  electricalProfiles: [],
  matesWith: [],
  visuals: [],
});

describe('powerUpperBoundKw', () => {
  it('uses V x I for single-phase line-to-neutral', () => {
    expect(powerUpperBoundKw(ac1)).toBeCloseTo(3.68, 2);
  });

  it('uses sqrt(3) x V_LL x I for three-phase line-to-line', () => {
    expect(powerUpperBoundKw(ac3)).toBeCloseTo(22.17, 2);
  });

  it('uses 3 x V_LN x I for three-phase line-to-neutral', () => {
    const p: ElectricalProfile = {
      ...ac3,
      voltage: { qualifier: 'rated', value: 230, reference: 'line_to_neutral' },
    };
    expect(powerUpperBoundKw(p)).toBeCloseTo(22.08, 2);
  });

  it('uses V x I for DC', () => {
    expect(powerUpperBoundKw(dc)).toBeCloseTo(200, 5);
  });

  it('uses the upper end of a range', () => {
    expect(
      powerUpperBoundKw({
        ...ac1,
        voltage: { qualifier: 'range', min: 200, max: 250, reference: 'line_to_neutral' },
      }),
    ).toBeCloseTo(4, 5);
  });

  it('returns null when voltage or current is unknown', () => {
    expect(powerUpperBoundKw({ ...ac1, voltage: null })).toBeNull();
    expect(powerUpperBoundKw({ ...ac1, current: null })).toBeNull();
  });
});

describe('checkProfile', () => {
  it('accepts consistent profiles', () => {
    expect(checkProfile(ac1, [variant(['L', 'N', 'PE'])])).toEqual([]);
    expect(checkProfile(ac3, [variant(['L1', 'L2', 'L3', 'N', 'PE', 'CP', 'PP'])])).toEqual([]);
    expect(checkProfile(dc, [variant(['DC+', 'DC-', 'PE'])])).toEqual([]);
  });

  it('accepts a stated power below the computed upper bound', () => {
    expect(checkProfile({ ...ac3, maxPowerKw: { value: 22, sourceRefs: ['src'] } }, [])).toEqual(
      [],
    );
  });

  it('rejects a stated power above the computed upper bound', () => {
    const issues = checkProfile({ ...ac1, maxPowerKw: { value: 7.4, sourceRefs: ['src'] } }, []);
    expect(issues.join('\n')).toMatch(/exceeds/);
  });

  it('rejects a phase count inconsistent with the supply', () => {
    expect(checkProfile({ ...ac3, phases: 1 }, []).join('\n')).toMatch(/phases/);
  });

  it('rejects a line-to-line reference on a single-phase profile', () => {
    const p: ElectricalProfile = {
      ...ac1,
      voltage: { qualifier: 'rated', value: 400, reference: 'line_to_line' },
    };
    expect(checkProfile(p, []).join('\n')).toMatch(/reference/);
  });

  it('requires three line contacts for a three-phase profile', () => {
    const p: ElectricalProfile = {
      ...ac3,
      contactFunctions: { L1: 'line', N: 'neutral', PE: 'protective_earth' },
    };
    expect(checkProfile(p, []).join('\n')).toMatch(/3 line/);
  });

  it('requires a neutral contact when neutral is true', () => {
    const p: ElectricalProfile = {
      ...ac1,
      contactFunctions: { L: 'line', PE: 'protective_earth' },
    };
    expect(checkProfile(p, []).join('\n')).toMatch(/neutral/);
  });

  it('requires both DC poles on a DC profile', () => {
    const p: ElectricalProfile = {
      ...dc,
      contactFunctions: { 'DC+': 'dc_positive', PE: 'protective_earth' },
    };
    expect(checkProfile(p, []).join('\n')).toMatch(/dc_negative/);
  });

  it('rejects AC functions on a DC profile', () => {
    const p: ElectricalProfile = {
      ...dc,
      contactFunctions: { ...dc.contactFunctions, L1: 'line' },
    };
    expect(checkProfile(p, []).join('\n')).toMatch(/DC profile/);
  });

  it('rejects a function on a contact the variant does not have', () => {
    expect(checkProfile(ac3, [variant(['L1', 'N', 'PE'])]).join('\n')).toMatch(/L2/);
  });

  it('does not flag unknown contact functions or contacts', () => {
    expect(checkProfile({ ...ac3, contactFunctions: null }, [])).toEqual([]);
    expect(checkProfile(ac3, [{ ...variant([]), contacts: null }])).toEqual([]);
  });

  it('rejects a range with min above max', () => {
    const p: ElectricalProfile = {
      ...ac1,
      voltage: { qualifier: 'range', min: 250, max: 200, reference: 'line_to_neutral' },
    };
    expect(checkProfile(p, []).join('\n')).toMatch(/min/);
  });
});
