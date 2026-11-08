import type { ContactFunction, ElectricalProfile, Quantity, Variant } from './model.ts';

/** Upper end of a quantity: the value for rated/max, the max for a range. */
export function upperValue(q: Quantity | null): number | null {
  if (!q) return null;
  return (q.qualifier === 'range' ? q.max : q.value) ?? null;
}

/**
 * Theoretical upper bound of the power a profile can carry, in kW.
 * It is a consistency bound, never published as the connector power:
 * - DC and single-phase: V x I
 * - three-phase: sqrt(3) x V_LL x I, or 3 x V_LN x I
 * - split-phase: V x I with V line-to-line (or 2 x V_LN x I)
 */
export function powerUpperBoundKw(profile: ElectricalProfile): number | null {
  const v = upperValue(profile.voltage);
  const i = upperValue(profile.current);
  if (v === null || i === null || !profile.voltage) return null;
  const ref = profile.voltage.reference;
  let factor = 1;
  if (profile.supply === 'three_phase') factor = ref === 'line_to_line' ? Math.sqrt(3) : 3;
  else if (profile.supply === 'split_phase') factor = ref === 'line_to_line' ? 1 : 2;
  return (factor * v * i) / 1000;
}

const AC_FUNCTIONS: ContactFunction[] = ['line', 'neutral', 'line_or_neutral'];
const DC_FUNCTIONS: ContactFunction[] = ['dc_positive', 'dc_negative'];
/** Rounding tolerance for published power figures (e.g. 22 kW for 22.17 kW). */
const POWER_TOLERANCE = 1.02;

/**
 * Electrical consistency rules that JSON Schema cannot express.
 * Unknown values (null) are never errors: only contradictions are reported.
 */
export function checkProfile(profile: ElectricalProfile, variants: Variant[]): string[] {
  const issues: string[] = [];
  const at = `profile '${profile.id}'`;

  for (const [name, q] of [
    ['voltage', profile.voltage],
    ['current', profile.current],
  ] as const) {
    if (q?.qualifier === 'range' && q.min !== undefined && q.max !== undefined && q.min > q.max) {
      issues.push(`${at}: ${name} range min (${q.min}) is above max (${q.max})`);
    }
  }

  const expectedPhases = { single_phase: 1, split_phase: 1, three_phase: 3, dc: undefined }[
    profile.supply
  ];
  if (profile.currentType === 'ac' && profile.phases != null && profile.phases !== expectedPhases) {
    issues.push(`${at}: ${profile.phases} phases is inconsistent with supply '${profile.supply}'`);
  }

  if (profile.voltage) {
    const ref = profile.voltage.reference;
    if (profile.currentType === 'dc' && ref !== 'dc')
      issues.push(`${at}: DC voltage must use reference 'dc'`);
    if (profile.currentType === 'ac' && ref === 'dc')
      issues.push(`${at}: AC voltage cannot use reference 'dc'`);
    if (profile.supply === 'single_phase' && ref === 'line_to_line') {
      issues.push(`${at}: single-phase voltage reference must be line_to_neutral`);
    }
  }

  if (profile.maxPowerKw) {
    const bound = powerUpperBoundKw(profile);
    if (bound !== null && profile.maxPowerKw.value > bound * POWER_TOLERANCE) {
      issues.push(
        `${at}: stated max power ${profile.maxPowerKw.value} kW exceeds the V x I bound of ${bound.toFixed(2)} kW`,
      );
    }
  }

  const functions = profile.contactFunctions;
  if (functions) {
    const values = Object.values(functions);
    const count = (f: ContactFunction) => values.filter((v) => v === f).length;
    // Contacts that may carry the neutral: assigned ones and unassigned poles.
    const possibleNeutrals = count('neutral') + count('line_or_neutral');

    if (profile.currentType === 'dc') {
      const ac = values.filter((v) => AC_FUNCTIONS.includes(v));
      if (ac.length > 0) issues.push(`${at}: DC profile assigns AC functions (${ac.join(', ')})`);
      for (const f of DC_FUNCTIONS)
        if (count(f) === 0) issues.push(`${at}: DC profile has no ${f} contact`);
    } else {
      const dc = values.filter((v) => DC_FUNCTIONS.includes(v));
      if (dc.length > 0) issues.push(`${at}: AC profile assigns DC functions (${dc.join(', ')})`);
      const lines = count('line');
      if (profile.supply === 'single_phase') {
        // Two current-carrying contacts; unpolarised or unassigned poles use line_or_neutral.
        const carrying = lines + possibleNeutrals;
        if (lines > 1)
          issues.push(`${at}: single-phase allows at most 1 line contact, found ${lines}`);
        if (carrying !== 2) {
          issues.push(`${at}: single-phase needs 2 current-carrying contacts, found ${carrying}`);
        }
      } else {
        const required = profile.supply === 'three_phase' ? 3 : 2;
        if (lines !== required) {
          issues.push(
            `${at}: '${profile.supply}' needs ${required} line contact(s), found ${lines}`,
          );
        }
      }
    }
    if (profile.neutral === true && possibleNeutrals === 0)
      issues.push(`${at}: neutral is true but no neutral contact`);
    if (profile.neutral === false && possibleNeutrals > 0)
      issues.push(`${at}: neutral is false but a neutral contact is assigned`);
    if (profile.protectiveEarth === true && count('protective_earth') === 0) {
      issues.push(`${at}: protectiveEarth is true but no protective_earth contact`);
    }

    for (const variant of variants) {
      if (!variant.contacts) continue;
      const ids = new Set(variant.contacts.map((c) => c.id));
      for (const contactId of Object.keys(functions)) {
        if (!ids.has(contactId)) {
          issues.push(`${at}: contact '${contactId}' is not defined on variant '${variant.id}'`);
        }
      }
    }
  }

  return issues;
}
