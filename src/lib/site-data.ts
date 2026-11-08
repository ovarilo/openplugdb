import { loadDataset, matingIndex, type Dataset } from './dataset.ts';
import { CATEGORIES, type ConnectorFamily } from './model.ts';

let cached: Dataset | undefined;

/** Dataset for the site, loaded once per build. */
export function dataset(): Dataset {
  cached ??= loadDataset();
  return cached;
}

export const families = (): ConnectorFamily[] => dataset().families.map((l) => l.family);

export const findFamily = (id: string): ConnectorFamily | undefined =>
  families().find((f) => f.id === id);

export const matings = () => matingIndex(families());

export interface FamilyFacets {
  currentTypes: ('ac' | 'dc')[];
  phases: number[];
  roles: string[];
  genders: string[];
}

export function facets(f: ConnectorFamily): FamilyFacets {
  const profiles = f.electricalProfiles;
  return {
    currentTypes: [...new Set(profiles.map((p) => p.currentType))].sort(),
    phases: [
      ...new Set(profiles.flatMap((p) => (typeof p.phases === 'number' ? [p.phases] : []))),
    ].sort(),
    roles: [...new Set(f.variants.map((v) => v.role))].sort(),
    genders: [...new Set(f.variants.map((v) => v.contactGender))].sort(),
  };
}

export function stats() {
  const all = families();
  return {
    families: all.length,
    variants: all.reduce((n, f) => n + f.variants.length, 0),
    profiles: all.reduce((n, f) => n + f.electricalProfiles.length, 0),
    drawings: all.reduce(
      (n, f) =>
        n + f.variants.reduce((m, v) => m + v.visuals.filter((x) => x.kind !== 'icon').length, 0),
      0,
    ),
    sources: new Set(all.flatMap((f) => f.sources.map((s) => s.url ?? s.title))).size,
    byCategory: Object.fromEntries(
      CATEGORIES.map((c) => [c, all.filter((f) => f.category === c).length]),
    ) as Record<(typeof CATEGORIES)[number], number>,
  };
}
