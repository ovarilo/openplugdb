# Licensing policy

The repository holds three kinds of content with different needs, so it has no single license.
The full texts are in [`LICENSES/`](../LICENSES).

| Content                                                      | License   | Why                                                                                   |
| ------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------- |
| Code: `src/`, `scripts/`, `tests/`, `schemas/`, config files | MIT       | permissive, usual for tooling and sites                                               |
| Data: `data/`, `mappings/`, `dist-data/`                     | CC0-1.0   | facts compiled by the project from cited sources; maximal reuse, no attribution chain |
| Original drawings in `public/images/connectors/`             | CC-BY-4.0 | creative works; attribution keeps the provenance visible when they are reused         |
| Third-party drawings                                         | their own | declared per file in `visuals[].license`, with `sourceUrl`                            |
| EVicons icons in `public/images/icons/evicons/`              | MIT       | vendored unchanged from `@evicons/svg`, with the upstream `LICENSE` next to them      |
| Extension icons in `public/images/icons/evicons-extension/`  | MIT       | the EVicons license, so they can be proposed upstream unchanged                       |

## Why CC0 is possible for the data

- The dataset contains facts (ratings, contact layouts, standard designations and editions), the
  project's own structure and wording, and citations. Facts are not copyrighted; the selection and
  wording are the project's own.
- No third-party database was imported. External identifiers (OCPI enum values, Open Charge Map ids,
  OpenStreetMap keys) appear only as interoperability references; the specification texts and
  descriptions are not reproduced. Open Charge Map titles are short factual labels kept for
  readability.
- Sources under attribution or ShareAlike terms (PlugVoltage CC BY 4.0, OSM wiki CC BY-SA 2.0,
  Wikimedia Commons CC BY-SA files) were read but not copied.

If a future contribution imports data under another license (e.g. PlugVoltage CC BY 4.0, Open EV
Data CDLA-Permissive-2.0), it must stay in a separate, clearly licensed file or the dataset license
must be revisited. **Never relabel third-party data as CC0.**

## Drawings

- Original drawings are drawn from scratch from cited sources (`basedOn`), not traced from other
  drawings.
- Public-domain or permissive drawings (e.g. some Wikimedia Commons files) may be added as
  `provenance: third_party` with their license and `sourceUrl`, after checking the license of the
  exact file.
- ShareAlike drawings (CC BY-SA) must not be traced or adapted into project files, which would make
  them ShareAlike. They can be linked as references.
- EVicons icons (MIT, Copyright (c) 2026 Landolsi Digital) are vendored byte for byte from the
  pinned npm package `@evicons/svg` into `public/images/icons/evicons/`, together with its
  `LICENSE` file, which carries the MIT notice (`bun run icons:sync`; CI runs `bun run icons:check`).
  They are declared as `kind: icon`, `provenance: third_party`, `license: MIT` with a `sourceUrl`.
- Icons the project draws for interfaces EVicons does not cover live in
  `public/images/icons/evicons-extension/`, apart from the vendored files, so that they can be
  proposed upstream together. They are MIT ("Copyright (c) 2026 OpenPlugDB contributors", with
  their own `LICENSE` file in that folder), not CC-BY-4.0 like the drawings: EVicons only accepts
  MIT contributions. Their geometry is the contact layout of the project's own front views (facts
  from the cited sources), scaled into the EVicons grid; no third-party drawing was traced.

## Standards

Standards are cited, never reproduced. Values taken from official preview samples and abstracts are
facts; the standard texts, tables and figures are not copied.
