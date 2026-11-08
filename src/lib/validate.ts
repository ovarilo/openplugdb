import { checkProfile } from './electrical.ts';
import { variantKey, variantsUsingProfile, type Dataset } from './dataset.ts';
import { MAPPING_SYSTEMS } from './model.ts';

/** Visual files are relative to public/images/. Drawings live per family under this folder. */
export const DRAWINGS_DIR = 'connectors/';
/** UI icons: vendored EVicons files and our own extension icons. */
export const ICONS_DIR = 'icons/';
/** Icons copied unchanged from the @evicons/svg package (see scripts/sync-evicons.ts). */
export const EVICONS_DIR = 'icons/evicons/';

export interface ReferenceCheckOptions {
  /** Whether public/images/<file> exists. Injected to keep this pure. */
  svgExists: (file: string) => boolean;
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  return [...new Set(values.filter((v) => seen.size === seen.add(v).size))];
}

/**
 * Cross-file and cross-field checks that JSON Schema cannot express:
 * identifiers, references, mappings, visuals and electrical consistency.
 * Unknown (null) values are never reported; only contradictions and dangling
 * references are.
 */
export function validateReferences(dataset: Dataset, options: ReferenceCheckOptions): string[] {
  const issues: string[] = [];
  const families = dataset.families.map((l) => l.family);
  const familyIds = new Set(families.map((f) => f.id));
  const variantKeys = new Set(
    families.flatMap((f) => f.variants.map((v) => variantKey({ family: f.id, variant: v.id }))),
  );
  const vocabularies = new Map(dataset.vocabularies.map((v) => [v.system, v]));

  for (const id of duplicates(families.map((f) => f.id)))
    issues.push(`duplicate family id '${id}'`);

  const declared = new Set<string>();
  for (const f of families) {
    for (const v of f.variants) {
      for (const ref of v.matesWith)
        declared.add(`${variantKey({ family: f.id, variant: v.id })}->${variantKey(ref)}`);
    }
  }

  for (const { family: f, path } of dataset.families) {
    const at = `${path}`;
    const report = (message: string) => issues.push(`${at}: ${message}`);

    const segments = path.split('/');
    if (segments.at(-1) !== `${f.id}.json`) report(`file name must be '${f.id}.json'`);
    if (segments.at(-2) !== f.category) report(`directory must match category '${f.category}'`);

    const sourceIds = new Set(f.sources.map((s) => s.id));
    const standardIds = new Set(f.standards.map((s) => s.id));
    const profileIds = new Set(f.electricalProfiles.map((p) => p.id));
    const ownVariantIds = new Set(f.variants.map((v) => v.id));

    for (const [kind, ids] of [
      ['source', f.sources.map((s) => s.id)],
      ['standard', f.standards.map((s) => s.id)],
      ['variant', f.variants.map((v) => v.id)],
      ['electrical profile', f.electricalProfiles.map((p) => p.id)],
    ] as const) {
      for (const id of duplicates([...ids])) report(`duplicate ${kind} id '${id}'`);
    }

    const checkSources = (refs: string[] | undefined, where: string) => {
      for (const ref of refs ?? [])
        if (!sourceIds.has(ref)) report(`${where}: unknown source '${ref}'`);
    };

    for (const relation of f.relations) {
      if (!familyIds.has(relation.family))
        report(`relation ${relation.type}: unknown family '${relation.family}'`);
      if (relation.family === f.id)
        report(`relation ${relation.type}: a family cannot relate to itself`);
    }

    for (const v of f.variants) {
      const where = `variant '${v.id}'`;
      for (const id of duplicates((v.contacts ?? []).map((c) => c.id)))
        report(`${where}: duplicate contact id '${id}'`);
      for (const p of v.electricalProfiles) {
        if (!profileIds.has(p)) report(`${where}: unknown electrical profile '${p}'`);
      }
      const self = variantKey({ family: f.id, variant: v.id });
      for (const ref of v.matesWith) {
        const key = variantKey(ref);
        if (!variantKeys.has(key)) report(`${where}: mates with unknown variant '${key}'`);
        if (key === self) report(`${where}: a variant cannot mate with itself`);
        if (declared.has(`${key}->${self}`) && self < key) {
          report(`${where}: mating with '${key}' is stored in both directions; keep one`);
        }
      }
      for (const visual of v.visuals) {
        const vw = `${where} visual '${visual.file}'`;
        if (!options.svgExists(visual.file)) report(`${vw}: missing SVG file '${visual.file}'`);
        checkSources(visual.basedOn, vw);
        if (visual.provenance === 'third_party' && !visual.sourceUrl)
          report(`${vw}: third-party visual needs a sourceUrl`);
        if (
          (visual.kind === 'front_view' || visual.kind === 'pinout') &&
          visual.orientation !== 'mating_face'
        ) {
          report(`${vw}: ${visual.kind} must use orientation 'mating_face'`);
        }
        if (visual.kind === 'icon') {
          if (!visual.file.startsWith(ICONS_DIR))
            report(`${vw}: icon must live under '${ICONS_DIR}'`);
          if (visual.file.startsWith(EVICONS_DIR)) {
            if (visual.provenance !== 'third_party')
              report(`${vw}: vendored EVicons icon must have provenance 'third_party'`);
            if (visual.license !== 'MIT')
              report(`${vw}: vendored EVicons icon must have license 'MIT'`);
          }
        } else if (!visual.file.startsWith(`${DRAWINGS_DIR}${f.id}/`)) {
          report(`${vw}: file must live under '${DRAWINGS_DIR}${f.id}/'`);
        }
      }
    }

    for (const p of f.electricalProfiles) {
      const where = `profile '${p.id}'`;
      checkSources(p.sourceRefs, where);
      checkSources(p.maxPowerKw?.sourceRefs, `${where} maxPowerKw`);
      if (p.standardRef !== null && !standardIds.has(p.standardRef))
        report(`${where}: unknown standard '${p.standardRef}'`);
      const users = variantsUsingProfile(f, p.id);
      if (users.length === 0) report(`${where}: not used by any variant`);
      for (const issue of checkProfile(p, users)) report(issue);
    }

    for (const system of MAPPING_SYSTEMS) {
      const vocabulary = vocabularies.get(system);
      const known = new Set(vocabulary?.values.map((v) => v.value));
      for (const m of f.mappings[system]) {
        if (vocabulary && vocabulary.vocabulary !== 'open' && !known.has(m.value)) {
          report(`'${m.value}' is not a known ${system} value (see mappings/${system}.json)`);
        }
        for (const variant of m.variants ?? []) {
          if (!ownVariantIds.has(variant))
            report(`${system} mapping '${m.value}' refers to unknown variant '${variant}'`);
        }
      }
    }
  }
  return issues;
}
