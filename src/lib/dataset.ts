import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  CATEGORIES,
  MAPPING_SYSTEMS,
  type ConnectorFamily,
  type Variant,
  type VariantRef,
  type Vocabulary,
} from './model.ts';

export interface LoadedFamily {
  family: ConnectorFamily;
  /** Repository-relative POSIX path of the source file. */
  path: string;
}

export interface Dataset {
  families: LoadedFamily[];
  vocabularies: Vocabulary[];
}

/** Repository root. Scripts and the Astro build both run from it. */
export const ROOT = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/**
 * Loads every data/<category>/<id>.json file and every mappings/<system>.json
 * vocabulary. This is the single loader used by the validator, the exporter and
 * the site, so they cannot drift apart. Families are sorted by id.
 */
export function loadDataset(root: string = ROOT): Dataset {
  const families: LoadedFamily[] = [];
  const dataDir = join(root, 'data');
  for (const dir of readdirSync(dataDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of readdirSync(join(dataDir, dir.name)).sort()) {
      if (!file.endsWith('.json')) continue;
      const path = join(dataDir, dir.name, file);
      families.push({
        family: readJson<ConnectorFamily>(path),
        path: relative(root, path).split('\\').join('/'),
      });
    }
  }
  families.sort((a, b) => a.family.id.localeCompare(b.family.id));

  const vocabularies = MAPPING_SYSTEMS.map((system) =>
    readJson<Vocabulary>(join(root, 'mappings', `${system}.json`)),
  );
  return { families, vocabularies };
}

export const variantKey = (ref: { family: string; variant: string }) =>
  `${ref.family}/${ref.variant}`;

/**
 * Mating relations in both directions. Sources store each mating once; this
 * derives the full, symmetric view used by the site and the exports.
 */
export function matingIndex(families: ConnectorFamily[]): Map<string, VariantRef[]> {
  const index = new Map<string, VariantRef[]>();
  const add = (key: string, ref: VariantRef) => {
    const list = index.get(key) ?? [];
    if (!list.some((r) => variantKey(r) === variantKey(ref))) list.push(ref);
    index.set(key, list);
  };
  for (const family of families) {
    for (const variant of family.variants) {
      const self = { family: family.id, variant: variant.id };
      for (const ref of variant.matesWith) {
        add(variantKey(self), ref);
        add(variantKey(ref), ref.note === undefined ? self : { ...self, note: ref.note });
      }
    }
  }
  for (const list of index.values())
    list.sort((a, b) => variantKey(a).localeCompare(variantKey(b)));
  return index;
}

/** Variants of a family that a profile applies to. */
export function variantsUsingProfile(family: ConnectorFamily, profileId: string): Variant[] {
  return family.variants.filter((v) => v.electricalProfiles.includes(profileId));
}

export const isCategory = (value: string): value is ConnectorFamily['category'] =>
  (CATEGORIES as readonly string[]).includes(value);
