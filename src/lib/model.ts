// TypeScript mirror of schemas/connector-family.schema.json.
// Convention: `null` means "unknown / not documented"; an absent optional key
// means "not applicable" (see docs/data-model.md).

export const CATEGORIES = ['ev', 'domestic', 'industrial', 'appliance'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Status = 'current' | 'discontinued' | 'obsolete' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export type Role =
  | 'plug'
  | 'socket_outlet'
  | 'cable_connector'
  | 'vehicle_connector'
  | 'vehicle_inlet'
  | 'appliance_inlet'
  | 'appliance_outlet';

export type ContactGender = 'male' | 'female' | 'mixed' | 'unknown';

export type ContactFunction =
  | 'line'
  | 'neutral'
  | 'protective_earth'
  | 'control_pilot'
  | 'proximity_pilot'
  | 'dc_positive'
  | 'dc_negative'
  | 'communication';

export interface Standard {
  id: string;
  designation: string;
  edition: string | null;
  title: string | null;
  scope: string | null;
  url?: string;
}

export interface Relation {
  type: 'extends' | 'derived_from' | 'superseded_by' | 'related';
  family: string;
  note: string | null;
}

export interface Contact {
  id: string;
  label: string;
  gender: 'male' | 'female' | 'sexless';
  form?: 'pin' | 'sleeve' | 'side_clip' | 'earth_pin' | 'earth_hole';
  note?: string;
}

export interface VariantRef {
  family: string;
  variant: string;
  note?: string;
}

export interface Visual {
  kind: 'icon' | 'technical_diagram' | 'front_view' | 'side_view' | 'pinout';
  file: string;
  title: string;
  orientation: 'mating_face' | 'side' | 'not_applicable';
  accuracy: 'schematic' | 'to_scale';
  provenance: 'original' | 'third_party';
  author: string;
  license: string;
  sourceUrl?: string;
  basedOn?: string[];
}

export interface Variant {
  id: string;
  name: string;
  aliases?: string[];
  role: Role;
  contactGender: ContactGender;
  contacts: Contact[] | null;
  keying: string | null;
  mechanicalNotes: string[];
  electricalProfiles: string[];
  matesWith: VariantRef[];
  visuals: Visual[];
}

export interface Quantity {
  qualifier: 'rated' | 'max' | 'range';
  value?: number;
  min?: number;
  max?: number;
}

export interface Voltage extends Quantity {
  reference: 'line_to_neutral' | 'line_to_line' | 'dc';
}

export interface ElectricalProfile {
  id: string;
  name: string;
  currentType: 'ac' | 'dc';
  supply: 'single_phase' | 'split_phase' | 'three_phase' | 'dc';
  phases?: number | null;
  neutral: boolean | null;
  protectiveEarth: boolean | null;
  voltage: Voltage | null;
  current: Quantity | null;
  frequencyHz?: number[] | null;
  maxPowerKw: { value: number; sourceRefs: string[] } | null;
  cooling?: 'none' | 'liquid';
  conditions: string[];
  contactFunctions: Record<string, ContactFunction> | null;
  standardRef: string | null;
  jurisdiction: string | null;
  sourceRefs: string[];
  confidence: Confidence;
}

export interface MappingEntry {
  value: string;
  match: 'exact' | 'broader' | 'narrower' | 'partial';
  variants?: string[];
  note?: string;
}

export const MAPPING_SYSTEMS = [
  'ocpi-2.2.1',
  'ocpi-2.3.0',
  'openchargemap',
  'openstreetmap',
] as const;
export type MappingSystem = (typeof MAPPING_SYSTEMS)[number];

export interface Source {
  id: string;
  title: string;
  publisher: string;
  type:
    | 'standard'
    | 'standard_abstract'
    | 'regulation'
    | 'manufacturer'
    | 'reference_database'
    | 'encyclopedia'
    | 'other';
  url: string | null;
  accessed: string;
  note?: string;
}

export interface Verification {
  status: 'verified' | 'partial' | 'incomplete';
  lastVerified: string;
  notes: string[];
}

export interface ConnectorFamily {
  $schema: string;
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  subcategory: string;
  description: string;
  status: Status;
  regions: string[];
  countries: string[];
  standards: Standard[];
  relations: Relation[];
  variants: Variant[];
  electricalProfiles: ElectricalProfile[];
  mappings: Record<MappingSystem, MappingEntry[]>;
  sources: Source[];
  verification: Verification;
}

export interface Vocabulary {
  system: MappingSystem;
  name: string;
  vocabulary: 'closed' | 'open' | 'subset';
  note?: string;
  source: { url: string; revision: string; accessed: string };
  licenseNote: string;
  values: { value: string; label?: string }[];
}
