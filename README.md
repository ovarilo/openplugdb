# OpenPlugDB

An open, international and static reference of electrical plugs and connectors: EV charging,
domestic, industrial and appliance couplers.

OpenPlugDB is two products built from the same sources:

1. **A dataset**: one versioned JSON file per connector family, validated by a JSON Schema and
   exported to `connectors.json` and `connectors.csv`.
2. **A static website** to browse, search and filter connectors, with their physical variants,
   electrical ratings, mating-face drawings, standards, sources and external mappings.

No backend, no database, no external service. Target site: <https://openplugdb.org>.

## What is in the dataset

The dataset covers 27 families: the main EV charging connectors, the domestic plug types A to O,
and representative industrial and appliance couplers.

| Family                                     | Category   | Status     |
| ------------------------------------------ | ---------- | ---------- |
| IEC 62196 Type 1 (SAE J1772)               | ev         | partial    |
| IEC 62196 Type 2                           | ev         | verified   |
| CCS Combo 1                                | ev         | partial    |
| CCS Combo 2                                | ev         | partial    |
| CHAdeMO                                    | ev         | partial    |
| GB/T 20234.2 AC                            | ev         | partial    |
| GB/T 20234.3 DC                            | ev         | partial    |
| MCS (Megawatt Charging System)             | ev         | incomplete |
| SAE J3400 (NACS)                           | ev         | partial    |
| NEMA 1-15 (Type A)                         | domestic   | partial    |
| NEMA 5-15 (Type B)                         | domestic   | partial    |
| Europlug (CEE 7/16, EN 50075, Type C)      | domestic   | partial    |
| BS 546 5 A (Type D)                        | domestic   | partial    |
| Type E (CEE 7/5, CEE 7/6)                  | domestic   | partial    |
| Schuko (CEE 7/3, CEE 7/4, CEE 7/7, Type F) | domestic   | partial    |
| BS 1363 (Type G)                           | domestic   | partial    |
| SI 32 (Israel, Type H)                     | domestic   | partial    |
| AS/NZS 3112 (Type I)                       | domestic   | partial    |
| SN 441011 (Type J, Swiss T12/T13 and T23)  | domestic   | partial    |
| Danish plug and socket (Type K)            | domestic   | partial    |
| CEI 23-50 (Type L, Italian 10 A and 16 A)  | domestic   | partial    |
| BS 546 15 A / SANS 164-1 (Type M)          | domestic   | partial    |
| IEC 60906-1 / NBR 14136 (Type N)           | domestic   | partial    |
| TIS 166-2549 (Type O, Thai plug)           | domestic   | verified   |
| IEC 60309 16 A 2P+E 6h (blue)              | industrial | partial    |
| IEC 60309 16 A 3P+N+E 6h (red)             | industrial | partial    |
| IEC 60320 C13/C14                          | appliance  | partial    |

`partial` and `incomplete` families are published with their gaps listed in `verification.notes`
and on their page. 30 mating-face drawings are published under `public/images/connectors/`, and 21
UI icons under `public/images/icons/` (8 vendored from EVicons, 13 OpenPlugDB extensions); the
other faces wait for a source that shows them.

## Quick start

Tool versions are pinned in [`mise.toml`](mise.toml) (Node, Bun).

```sh
mise install          # Node 24 and Bun
bun install           # dependencies
bun run dev           # site on http://localhost:4321
```

| Command                | What it does                                                                      |
| ---------------------- | --------------------------------------------------------------------------------- |
| `bun run validate`     | JSON Schema, identifiers, cross references, mappings, SVG files, electrical rules |
| `bun run export`       | regenerates `dist-data/connectors.json` and `dist-data/connectors.csv`            |
| `bun run export:check` | fails if `dist-data/` does not match `data/`                                      |
| `bun run test`         | unit tests (Vite+ / Vitest)                                                       |
| `bun run lint`         | Oxlint through Vite+                                                              |
| `bun run fmt`          | Oxfmt through Vite+ (`fmt:check` in CI)                                           |
| `bun run check`        | Astro and TypeScript diagnostics                                                  |
| `bun run build`        | export, static build to `dist/`, Pagefind search index                            |
| `bun run preview`      | serves `dist/` locally                                                            |
| `bun run ci`           | everything the CI runs, in order                                                  |

Search on the home page uses Pagefind, whose index only exists after `bun run build`; with
`bun run dev` the search box falls back to the catalog filter.

## Repository layout

```text
data/<category>/<id>.json   source of truth, one file per connector family
schemas/                    JSON Schemas (connector family, external vocabulary)
mappings/                   external vocabularies: OCPI 2.2.1/2.3.0, Open Charge Map, OSM
public/images/connectors/   SVG drawings, one folder per family
public/images/icons/        UI icons: evicons/ (vendored, MIT) and evicons-extension/ (ours)
dist-data/                  generated exports, committed and checked in CI
scripts/                    validate.ts, export.ts, sync-evicons.ts (CLI entry points)
src/lib/                    model, loader, validation rules, exports (shared by scripts and site)
src/pages, src/components   Astro site
tests/                      unit tests
docs/                       data model, validation, exports, drawings, provenance, licensing
```

## Documentation

- [Data model](docs/data-model.md)
- [Validation and generation](docs/validation.md)
- [Exports (JSON and CSV)](docs/exports.md)
- [Drawings and orientation convention](docs/svg.md)
- [Data provenance policy](docs/provenance.md)
- [Licensing policy](docs/licensing.md)
- [Deployment on GitHub Pages](docs/deployment.md)
- [Contributing](CONTRIBUTING.md)

## Licenses

| Content                                        | License                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Code (site, scripts, schemas)                  | [MIT](LICENSE)                                                                            |
| Data (`data/`, `mappings/`, `dist-data/`)      | [CC0-1.0](LICENSES/CC0-1.0.txt)                                                           |
| Drawings (`public/images/connectors/`)         | per file, see each `visuals[].license`; originals are [CC-BY-4.0](LICENSES/CC-BY-4.0.txt) |
| EVicons icons (`public/images/icons/evicons/`) | MIT, Copyright (c) 2026 Landolsi Digital, see the `LICENSE` file shipped with them        |

The reasoning, and what is not imported for license reasons, is in [docs/licensing.md](docs/licensing.md).

## Disclaimer

OpenPlugDB describes connector interfaces as defined by standards. A rating is the maximum the
interface is designed for, not the power available at a given socket or charging station. Parts
that fit together physically are not necessarily electrically compatible. The data is informative
and provided without warranty; always check the equipment rating and local regulations.

## Roadmap

Next steps for later iterations, in rough priority order:

- Review the IEC 62196-3:2026 ratings for CCS2 (configuration FF tables and Annex AA) and model
  liquid-cooled profiles.
- Confirm and draw the remaining faces: CCS2 and Type 1 vehicle connectors, the CEE 7/4 plug, the
  IEC 60309 plug and appliance-inlet faces.
- Source the CHAdeMO and MCS contact layouts (contacts are `null` today).
- Verify the OpenStreetMap keys for GB/T and MCS.
- Propose the OpenPlugDB extension icons upstream to EVicons in one pull request.
- Record proximity-pilot resistor coding once the IEC 61851-1 table is reviewed.
- Add families: Type 3, more IEC 60309 and IEC 60320 configurations, NEMA locking and 14-50.
- Publish the JSON Schema under the site domain and version the dataset with releases.
