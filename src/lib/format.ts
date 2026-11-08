import type { ElectricalProfile, Quantity, Role, Variant } from './model.ts';

/** Prefixes a site path with the configured base (e.g. /openplugdb/ on GitHub Pages). */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

const nf = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

/** "230 V", "up to 63 A", "200–250 V", "unknown". */
export function formatQuantity(q: Quantity | null, unit: string): string {
  if (q === null) return 'unknown';
  if (q.qualifier === 'range') return `${nf.format(q.min ?? 0)}–${nf.format(q.max ?? 0)} ${unit}`;
  const text = `${nf.format(q.value ?? 0)} ${unit}`;
  return q.qualifier === 'max' ? `up to ${text}` : text;
}

export const VOLTAGE_REFERENCE_LABEL = {
  line_to_neutral: 'line–neutral',
  line_to_line: 'line–line',
  dc: 'DC',
} as const;

export function formatVoltage(p: ElectricalProfile): string {
  if (!p.voltage) return 'unknown';
  const base = formatQuantity(p.voltage, 'V');
  return p.voltage.reference === 'dc'
    ? base
    : `${base} (${VOLTAGE_REFERENCE_LABEL[p.voltage.reference]})`;
}

export function formatFrequency(p: ElectricalProfile): string {
  if (p.frequencyHz === undefined) return 'n/a';
  if (p.frequencyHz === null) return 'unknown';
  return `${p.frequencyHz.join(' / ')} Hz`;
}

export const SUPPLY_LABEL = {
  single_phase: 'AC single-phase',
  split_phase: 'AC split-phase',
  three_phase: 'AC three-phase',
  dc: 'DC',
} as const;

export const ROLE_LABEL: Record<Role, string> = {
  plug: 'Plug',
  socket_outlet: 'Socket-outlet',
  cable_connector: 'Cable connector',
  vehicle_connector: 'Vehicle connector',
  vehicle_inlet: 'Vehicle inlet',
  appliance_inlet: 'Appliance inlet',
  appliance_outlet: 'Appliance outlet',
};

export const CATEGORY_LABEL = {
  ev: 'EV charging',
  domestic: 'Domestic',
  industrial: 'Industrial',
  appliance: 'Appliance couplers',
} as const;

export const CATEGORY_BLURB = {
  ev: 'Vehicle connectors and inlets: IEC 62196, SAE J3400, CCS and more.',
  domestic: 'Household plugs and socket-outlets, from Schuko to NEMA.',
  industrial: 'IEC 60309 and other industrial plugs and sockets.',
  appliance: 'IEC 60320 couplers used on equipment power cords.',
} as const;

export const yesNo = (value: boolean | null): string =>
  value === null ? 'unknown' : value ? 'yes' : 'no';

/**
 * Visuals of a family split for display: technical drawings and UI icons are
 * shown in separate blocks (an icon is not a technical reference).
 */
export function splitVisuals(variants: Variant[]) {
  const all = variants.flatMap((variant) => variant.visuals.map((visual) => ({ visual, variant })));
  return {
    drawings: all.filter(({ visual }) => visual.kind !== 'icon'),
    icons: all.filter(({ visual }) => visual.kind === 'icon'),
  };
}

/** Main visual for thumbnails: front view first, then an icon, then any other drawing. */
export function primaryVisual(variants: Variant[]) {
  const all = variants.flatMap((v) => v.visuals);
  return all.find((v) => v.kind === 'front_view') ?? all.find((v) => v.kind === 'icon') ?? all[0];
}
