import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, type Dataset } from './dataset.ts';
import { buildCsv, buildJson } from './export.ts';

export const EXPORT_FILES = ['connectors.json', 'connectors.csv'] as const;
export type ExportFile = (typeof EXPORT_FILES)[number];

/** The exact bytes of every export. Used by scripts/export.ts and the site endpoints. */
export function buildExports(dataset: Dataset): Record<ExportFile, string> {
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    version: string;
  };
  return {
    'connectors.json': buildJson(dataset, { version }),
    'connectors.csv': buildCsv(dataset),
  };
}
