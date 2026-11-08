// Validates the dataset: JSON Schema, identifiers and cross references,
// external mappings, SVG files and electrical consistency.
// Usage: bun scripts/validate.ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDataset, ROOT } from '../src/lib/dataset.ts';
import { compileSchema } from '../src/lib/schema.ts';
import { checkSvg } from '../src/lib/svg.ts';
import { DRAWINGS_DIR, ICONS_DIR, validateReferences } from '../src/lib/validate.ts';

/** visuals[].file is relative to this folder. */
const SVG_ROOT = join(ROOT, 'public', 'images');

const validateFamily = compileSchema(ROOT, 'connector-family.schema.json');
const validateVocabulary = compileSchema(ROOT, 'vocabulary.schema.json');

const dataset = loadDataset();
const issues: string[] = [];

const schemaErrors = (path: string, valid: boolean, errors: typeof validateFamily.errors) => {
  if (valid) return;
  for (const e of errors ?? [])
    issues.push(`${path}: schema ${e.instancePath || '/'} ${e.message ?? ''}`);
};

for (const { family, path } of dataset.families)
  schemaErrors(path, validateFamily(family), validateFamily.errors);
for (const vocabulary of dataset.vocabularies) {
  schemaErrors(
    `mappings/${vocabulary.system}.json`,
    validateVocabulary(vocabulary),
    validateVocabulary.errors,
  );
}

// Cross references only make sense on schema-valid data.
if (issues.length === 0) {
  issues.push(
    ...validateReferences(dataset, { svgExists: (file) => existsSync(join(SVG_ROOT, file)) }),
  );
}

// Every SVG of the drawing and icon trees must be structurally valid and
// referenced by a variant. Icons get the lighter icon rules (docs/svg.md).
const referenced = new Set(
  dataset.families.flatMap((l) => l.family.variants.flatMap((v) => v.visuals.map((x) => x.file))),
);
for (const tree of [DRAWINGS_DIR, ICONS_DIR]) {
  const dir = join(SVG_ROOT, tree);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
    const file = `${tree}${entry.split('\\').join('/')}`;
    if (!file.endsWith('.svg')) continue;
    const mode = tree === ICONS_DIR ? 'icon' : 'drawing';
    for (const issue of checkSvg(readFileSync(join(SVG_ROOT, file), 'utf8'), { mode })) {
      issues.push(`public/images/${file}: ${issue}`);
    }
    if (!referenced.has(file)) issues.push(`public/images/${file}: not referenced by any variant`);
  }
}

const variants = dataset.families.reduce((n, l) => n + l.family.variants.length, 0);
if (issues.length > 0) {
  console.error(`✗ ${issues.length} issue(s):\n${issues.map((i) => `  - ${i}`).join('\n')}`);
  process.exit(1);
}
console.log(
  `✓ ${dataset.families.length} families, ${variants} variants, ${referenced.size} SVG files, ${dataset.vocabularies.length} vocabularies: valid`,
);
