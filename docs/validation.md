# Validation and generation

All checks are in `src/lib/` and run from two entry points, `scripts/validate.ts` and
`scripts/export.ts`. The site loads the dataset through the same loader (`src/lib/dataset.ts`) and
serves exports built by the same function (`src/lib/exports-files.ts`), so the validator, the
exporter and the site cannot read the data differently.

## `bun run validate`

1. **JSON Schema** (Ajv, draft 2020-12, strict mode) on every family and vocabulary.
2. **Identifiers**: file name equals `id`, directory equals `category`; no duplicate family,
   variant, profile, source, standard or contact id.
3. **Cross references**: variant → profile, profile → source and standard, `maxPowerKw` → source,
   visual → source, relation → family, `matesWith` → existing variant (any family), no mating with
   itself, no mating stored in both directions, no profile unused by every variant.
4. **External mappings**: each value exists in `mappings/<system>.json` (except in an open
   vocabulary such as OCPI 2.3.0); `variants` restrictions point to existing variants.
5. **SVG files**: every referenced file exists under `public/images/`; drawings live under
   `connectors/<family>/`, icons under `icons/`, and vendored EVicons icons (`icons/evicons/`) are
   `third_party`, `MIT` and give a `sourceUrl`. Every SVG under `public/images/connectors/` and
   `public/images/icons/` is referenced and passes the structural checks of [svg.md](svg.md)
   (drawing rules, or the lighter icon rules under `icons/`). `bun run icons:check` separately
   checks that the vendored EVicons files are byte-identical to the pinned `@evicons/svg` package.
6. **Electrical consistency** (`src/lib/electrical.ts`), per profile and the variants using it:
   - phases match the supply (1 for single-phase, 3 for three-phase);
   - the voltage reference matches the current type (`dc` for DC; no line-to-line for single-phase);
   - ranges have `min ≤ max`;
   - contact functions: single-phase has two current-carrying contacts with at most one `line`
     (unpolarised or unassigned poles use `line_or_neutral`), split-phase two lines, three-phase
     three lines; DC has both DC poles and no AC function; a neutral (or `line_or_neutral`)
     contact when `neutral` is true, none when it is false; an earth contact when
     `protectiveEarth` is true;
   - every contact named in `contactFunctions` exists on every variant using the profile;
   - a stated `maxPowerKw` does not exceed the V × I bound (√3 × V<sub>LL</sub> × I or
     3 × V<sub>LN</sub> × I for three-phase), with 2 % tolerance for rounded published figures.
     The bound is a consistency check only; it is never published as a rating.

Unknown (`null`) values are never reported: only contradictions and dangling references are.

## `bun run export` and `bun run export:check`

`export` writes `dist-data/connectors.json` and `dist-data/connectors.csv` (see
[exports.md](exports.md)). Output is deterministic: families sorted by id, no timestamp, UTF-8, LF
line endings. `export:check` regenerates in memory and fails if the committed files differ, so a
pull request that changes `data/` without regenerating the exports fails CI.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests: validate, export check,
format check, lint, unit tests, Astro check, build, and a final `git diff --exit-code dist-data`
proving the build did not change the committed exports. `.github/workflows/deploy.yml` validates
again before deploying (see [deployment.md](deployment.md)).

Tool versions come from `mise.toml` (through `jdx/mise-action`); every action is pinned by commit
SHA.
