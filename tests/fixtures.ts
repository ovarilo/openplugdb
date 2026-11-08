import type { Dataset, LoadedFamily } from '../src/lib/dataset.ts';
import type { ConnectorFamily, Vocabulary } from '../src/lib/model.ts';

export function family(overrides: Partial<ConnectorFamily> = {}): ConnectorFamily {
  return {
    $schema: '../../schemas/connector-family.schema.json',
    id: 'test-plug',
    name: 'Test plug',
    aliases: ['TP'],
    category: 'domestic',
    subcategory: 'household',
    description: 'A test family.',
    status: 'current',
    regions: ['europe'],
    countries: ['FR'],
    standards: [{ id: 'std', designation: 'IEC 00000', edition: null, title: null, scope: null }],
    relations: [],
    variants: [
      {
        id: 'plug',
        name: 'Test plug',
        role: 'plug',
        contactGender: 'male',
        contacts: [
          { id: 'L', label: 'L', gender: 'male' },
          { id: 'N', label: 'N', gender: 'male' },
        ],
        keying: null,
        mechanicalNotes: [],
        electricalProfiles: ['ac'],
        matesWith: [{ family: 'test-plug', variant: 'socket' }],
        visuals: [],
      },
      {
        id: 'socket',
        name: 'Test socket',
        role: 'socket_outlet',
        contactGender: 'female',
        contacts: [
          { id: 'L', label: 'L', gender: 'female' },
          { id: 'N', label: 'N', gender: 'female' },
        ],
        keying: null,
        mechanicalNotes: [],
        electricalProfiles: ['ac'],
        matesWith: [],
        visuals: [],
      },
    ],
    electricalProfiles: [
      {
        id: 'ac',
        name: 'AC',
        currentType: 'ac',
        supply: 'single_phase',
        phases: 1,
        neutral: true,
        protectiveEarth: false,
        voltage: { qualifier: 'rated', value: 230, reference: 'line_to_neutral' },
        current: { qualifier: 'rated', value: 10 },
        frequencyHz: [50],
        maxPowerKw: null,
        conditions: [],
        contactFunctions: { L: 'line', N: 'neutral' },
        standardRef: 'std',
        jurisdiction: null,
        sourceRefs: ['src'],
        confidence: 'high',
      },
    ],
    mappings: {
      'ocpi-2.2.1': [{ value: 'DOMESTIC_C', match: 'exact' }],
      'ocpi-2.3.0': [],
      openchargemap: [],
      openstreetmap: [],
    },
    sources: [
      {
        id: 'src',
        title: 'Source',
        publisher: 'Pub',
        type: 'other',
        url: 'https://example.org',
        accessed: '2026-11-08',
      },
    ],
    verification: { status: 'verified', lastVerified: '2026-11-08', notes: [] },
    ...overrides,
  };
}

export function vocabulary(system: Vocabulary['system'], values: string[]): Vocabulary {
  return {
    system,
    name: system,
    vocabulary: 'closed',
    source: { url: 'https://example.org', revision: 'r1', accessed: '2026-11-08' },
    licenseNote: 'test',
    values: values.map((value) => ({ value })),
  };
}

export function dataset(families: ConnectorFamily[]): Dataset {
  const loaded: LoadedFamily[] = families.map((f) => ({
    family: f,
    path: `data/${f.category}/${f.id}.json`,
  }));
  return {
    families: loaded,
    vocabularies: [
      vocabulary('ocpi-2.2.1', ['DOMESTIC_C', 'DOMESTIC_F']),
      vocabulary('ocpi-2.3.0', ['DOMESTIC_C']),
      vocabulary('openchargemap', ['28']),
      vocabulary('openstreetmap', ['socket:schuko']),
    ],
  };
}
