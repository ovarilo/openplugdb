import { describe, expect, it } from 'vite-plus/test';
import { buildCsv, buildJson, csvCell, CSV_COLUMNS } from '../src/lib/export.ts';
import { dataset, family } from './fixtures.ts';

const meta = { version: '0.1.0' };

function parseCsv(text: string): string[][] {
  // Minimal RFC 4180 parser for test purposes.
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  return rows;
}

describe('csvCell', () => {
  it('quotes cells containing separators, quotes or newlines', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
  });

  it('neutralises spreadsheet formula prefixes', () => {
    expect(csvCell('=1+1')).toBe("'=1+1");
    expect(csvCell('-x')).toBe("'-x");
  });

  it('keeps numeric values readable, including negative-free numbers', () => {
    expect(csvCell(230)).toBe('230');
    expect(csvCell(true)).toBe('true');
  });
});

describe('buildCsv', () => {
  it('writes one row per variant and electrical profile, with a header', () => {
    const rows = parseCsv(buildCsv(dataset([family()])));
    expect(rows[0]).toEqual([...CSV_COLUMNS]);
    expect(rows).toHaveLength(3);
    const header = rows[0]!;
    const plug = Object.fromEntries(header.map((h, i) => [h, rows[1]![i]]));
    expect(plug).toMatchObject({
      family_id: 'test-plug',
      variant_id: 'plug',
      role: 'plug',
      contact_gender: 'male',
      contacts: 'L|N',
      mates_with: 'test-plug/socket',
      profile_id: 'ac',
      current_type: 'ac',
      phases: '1',
      voltage_qualifier: 'rated',
      voltage_v: '230',
      voltage_reference: 'line_to_neutral',
      current_a: '10',
      frequency_hz: '50',
      max_power_kw: '',
      ocpi_2_2_1: 'DOMESTIC_C',
      ocpi_2_3_0: '',
    });
  });

  it('writes standards as "designation / edition", omitting unknown editions', () => {
    const f = family();
    f.standards.push({
      id: 'std2',
      designation: 'IEC 11111',
      edition: '2.0 (2022)',
      title: null,
      scope: null,
    });
    const rows = parseCsv(buildCsv(dataset([f])));
    expect(rows[1]![rows[0]!.indexOf('standards')]).toBe('IEC 00000|IEC 11111 / 2.0 (2022)');
  });

  it('derives the reverse mating direction', () => {
    const rows = parseCsv(buildCsv(dataset([family()])));
    const i = rows[0]!.indexOf('mates_with');
    expect(rows[2]![i]).toBe('test-plug/plug');
  });

  it('writes "unknown" for unknown values and an empty cell for not applicable ones', () => {
    const f = family();
    f.electricalProfiles[0]!.current = null;
    f.variants[0]!.contacts = null;
    const rows = parseCsv(buildCsv(dataset([f])));
    const h = rows[0]!;
    expect(rows[1]![h.indexOf('current_a')]).toBe('unknown');
    expect(rows[1]![h.indexOf('contacts')]).toBe('unknown');
    expect(rows[1]![h.indexOf('cooling')]).toBe('');
  });

  it('writes ranges as min..max', () => {
    const f = family();
    f.electricalProfiles[0]!.voltage = {
      qualifier: 'range',
      min: 200,
      max: 250,
      reference: 'line_to_neutral',
    };
    const rows = parseCsv(buildCsv(dataset([f])));
    expect(rows[1]![rows[0]!.indexOf('voltage_v')]).toBe('200..250');
  });

  it('keeps variant-scoped mappings on their variants only', () => {
    const f = family();
    f.mappings.openstreetmap = [{ value: 'socket:schuko', match: 'exact', variants: ['socket'] }];
    const rows = parseCsv(buildCsv(dataset([f])));
    const i = rows[0]!.indexOf('openstreetmap');
    expect(rows[1]![i]).toBe('');
    expect(rows[2]![i]).toBe('socket:schuko');
  });

  it('writes a row for a variant without electrical profile', () => {
    const f = family();
    f.variants[1]!.electricalProfiles = [];
    const rows = parseCsv(buildCsv(dataset([f])));
    expect(rows).toHaveLength(3);
    expect(rows[2]![rows[0]!.indexOf('profile_id')]).toBe('');
    expect(rows[2]![rows[0]!.indexOf('ocpi_2_2_1')]).toBe('DOMESTIC_C');
    for (const row of rows) expect(row).toHaveLength(CSV_COLUMNS.length);
  });
});

describe('buildJson', () => {
  it('is deterministic and ends with a newline', () => {
    const a = buildJson(dataset([family()]), meta);
    const b = buildJson(dataset([family()]), meta);
    expect(a).toBe(b);
    expect(a.endsWith('}\n')).toBe(true);
    expect(a).not.toMatch(/generated/i);
  });

  it('drops $schema and adds the derived reverse matings', () => {
    const json = JSON.parse(buildJson(dataset([family()]), meta));
    const f = json.families[0];
    expect(f.$schema).toBeUndefined();
    expect(f.variants[1].matedBy).toEqual([{ family: 'test-plug', variant: 'plug' }]);
    expect(json.datasetVersion).toBe('0.1.0');
  });
});
