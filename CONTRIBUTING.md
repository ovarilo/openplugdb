# Contributing to OpenPlugDB

Thank you for helping. Corrections with a better source are as valuable as new connectors.

## Ground rules

- **Cite a source for every value.** Standards (official abstracts or previews), specifications and
  manufacturer datasheets first; encyclopedias only as secondary sources. See
  [docs/provenance.md](docs/provenance.md).
- **Do not guess.** Unknown values are `null`; write the gap in `verification.notes`. A partial entry
  with honest gaps is better than a complete-looking one.
- **Do not copy** text, tables or images from standards, ShareAlike drawings or databases whose
  license is not compatible with CC0. See [docs/licensing.md](docs/licensing.md).
- **Ratings are not installations.** Never add a single "power" figure for a connector; record
  `maxPowerKw` only when a source states it.
- Data, field names, code, comments and documentation are in English.

## Setup

```sh
mise install
bun install
bun run dev
```

## Adding or fixing a connector

1. Edit or create `data/<category>/<id>.json`; the file name is the `id`, the folder is the
   `category`. Start from a similar family and keep `"$schema"` so editors validate as you type.
2. One variant per physical part (plug, socket-outlet, inlet…). Set `role` and `contactGender`
   separately, list the `contacts`, and store each mating once in `matesWith`.
3. Add electrical profiles with their `sourceRefs`, `standardRef` and `confidence`; map the contacts
   in `contactFunctions`.
4. Add external mappings. If a value is missing from `mappings/<system>.json`, add it there with
   the documented source, in the same pull request.
5. Drawings (optional): follow [docs/svg.md](docs/svg.md). Draw each gender separately; never
   mirror. Only draw a face confirmed by a source showing it. `visuals[].file` is relative to
   `public/images/`: drawings are `connectors/<family-id>/<name>.svg`.
   Icons (optional): reference an EVicons icon as `icons/evicons/<name>.svg` and run
   `bun run icons:sync` to vendor it unchanged; never edit files in `icons/evicons/`. Icons
   EVicons lacks go to `icons/evicons-extension/` and follow the EVicons design guide.
6. Run:

   ```sh
   bun run validate
   bun run export      # regenerate dist-data/ and commit it
   bun run ci          # optional: everything the CI runs
   ```

7. Open a pull request describing the sources you used.

## Code changes

- TypeScript strict, minimal dependencies, client-side JavaScript only where interaction needs it.
- Test first: add or update tests in `tests/` (`bun run test`) for any rule or transformation.
- Conventional Commits for commit messages (`feat:`, `fix:`, `docs:`, `data:`…).

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
