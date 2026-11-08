import { matingIndex, variantKey, type Dataset } from './dataset.ts';
import type {
  ConnectorFamily,
  ElectricalProfile,
  MappingSystem,
  Quantity,
  Variant,
} from './model.ts';

export interface ExportMeta {
  version: string;
}

export const DATA_LICENSE = 'CC0-1.0';
export const SCHEMA_URL = 'https://openplugdb.org/schemas/connector-family.schema.json';

/** Value written in the CSV for a documented-but-unknown value (JSON null). */
export const UNKNOWN = 'unknown';
/** Separator for multiple values inside one CSV cell. */
export const MULTI = '|';

/**
 * connectors.json: the source families, sorted by id, without the editor-only
 * `$schema` key, and with the derived reverse matings (`matedBy`).
 * No timestamp, so the same sources always give the same bytes.
 */
export function buildJson(dataset: Dataset, meta: ExportMeta): string {
  const families = dataset.families.map((l) => l.family);
  const declared = new Set(
    families.flatMap((f) =>
      f.variants.flatMap((v) => v.matesWith.map((r) => `${f.id}/${v.id}->${variantKey(r)}`)),
    ),
  );
  const matings = matingIndex(families);

  const out = {
    name: 'OpenPlugDB',
    datasetVersion: meta.version,
    license: DATA_LICENSE,
    schema: SCHEMA_URL,
    families: families.map(({ $schema: _schema, ...family }) => ({
      ...family,
      variants: family.variants.map((v) => {
        const self = `${family.id}/${v.id}`;
        const matedBy = (matings.get(self) ?? []).filter(
          (r) => !declared.has(`${self}->${variantKey(r)}`),
        );
        return { ...v, matedBy };
      }),
    })),
  };
  return `${JSON.stringify(out, null, 2)}\n`;
}

export const CSV_COLUMNS = [
  'family_id',
  'family_name',
  'category',
  'subcategory',
  'status',
  'aliases',
  'standards',
  'regions',
  'countries',
  'variant_id',
  'variant_name',
  'role',
  'contact_gender',
  'contacts',
  'mates_with',
  'profile_id',
  'profile_name',
  'current_type',
  'supply',
  'phases',
  'neutral',
  'protective_earth',
  'voltage_qualifier',
  'voltage_v',
  'voltage_reference',
  'current_qualifier',
  'current_a',
  'frequency_hz',
  'max_power_kw',
  'cooling',
  'jurisdiction',
  'confidence',
  'ocpi_2_2_1',
  'ocpi_2_3_0',
  'openchargemap',
  'openstreetmap',
  'verification_status',
  'last_verified',
] as const;

type Cell = string | number | boolean | null | undefined;

/** RFC 4180 cell. Formula-like prefixes are neutralised for spreadsheets. */
export function csvCell(value: Cell): string {
  if (value === undefined) return '';
  if (value === null) return UNKNOWN;
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const join = (values: string[] | null | undefined): Cell =>
  values === null ? null : values === undefined ? undefined : values.join(MULTI);

/** "230", "200..250"; null stays null (unknown). */
function quantity(q: Quantity | null | undefined): Cell {
  if (q === undefined) return undefined;
  if (q === null) return null;
  return q.qualifier === 'range' ? `${q.min}..${q.max}` : q.value;
}

function mappingCell(family: ConnectorFamily, system: MappingSystem, variant: Variant): Cell {
  return family.mappings[system]
    .filter((m) => !m.variants || m.variants.includes(variant.id))
    .map((m) => m.value)
    .join(MULTI);
}

const PROFILE_COLUMN_COUNT =
  CSV_COLUMNS.indexOf('confidence') - CSV_COLUMNS.indexOf('profile_id') + 1;

function profileCells(p: ElectricalProfile | undefined): Cell[] {
  if (!p) return Array.from({ length: PROFILE_COLUMN_COUNT }, () => undefined);
  return [
    p.id,
    p.name,
    p.currentType,
    p.supply,
    p.phases,
    p.neutral,
    p.protectiveEarth,
    p.voltage === null ? null : p.voltage.qualifier,
    quantity(p.voltage),
    p.voltage === null ? null : p.voltage.reference,
    p.current === null ? null : p.current.qualifier,
    quantity(p.current),
    p.frequencyHz === undefined ? undefined : join(p.frequencyHz?.map(String) ?? null),
    p.maxPowerKw === null ? undefined : p.maxPowerKw.value,
    p.cooling,
    p.jurisdiction ?? undefined,
    p.confidence,
  ];
}

/**
 * connectors.csv: one row per (variant, electrical profile); a variant without
 * profile gets one row with empty profile columns. See docs/exports.md.
 */
export function buildCsv(dataset: Dataset): string {
  const families = dataset.families.map((l) => l.family);
  const matings = matingIndex(families);
  const lines = [CSV_COLUMNS.join(',')];

  for (const f of families) {
    const standards = f.standards.map((s) =>
      s.edition ? `${s.designation} / ${s.edition}` : s.designation,
    );
    for (const v of f.variants) {
      const profiles = v.electricalProfiles.map((id) =>
        f.electricalProfiles.find((p) => p.id === id),
      );
      for (const p of profiles.length > 0 ? profiles : [undefined]) {
        const cells: Cell[] = [
          f.id,
          f.name,
          f.category,
          f.subcategory,
          f.status,
          join(f.aliases),
          join(standards),
          join(f.regions),
          join(f.countries),
          v.id,
          v.name,
          v.role,
          v.contactGender,
          join(v.contacts?.map((c) => c.id) ?? null),
          join((matings.get(`${f.id}/${v.id}`) ?? []).map(variantKey)),
          ...profileCells(p),
          mappingCell(f, 'ocpi-2.2.1', v),
          mappingCell(f, 'ocpi-2.3.0', v),
          mappingCell(f, 'openchargemap', v),
          mappingCell(f, 'openstreetmap', v),
          f.verification.status,
          f.verification.lastVerified,
        ];
        lines.push(cells.map(csvCell).join(','));
      }
    }
  }
  return `${lines.join('\n')}\n`;
}
