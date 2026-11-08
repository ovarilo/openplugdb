# OpenPlugDB

Open dataset of electrical plugs and connectors (`data/`) and its static Astro site. Data, code,
comments and docs are in English.

## Commands

Tool versions come from `mise.toml`; run everything through `mise exec --` (Astro 7 needs
Node ≥ 22.23.4, the system Node may be older).

```sh
mise exec -- bun install --frozen-lockfile
mise exec -- bun run validate      # schema, references, electrical rules, SVG checks
mise exec -- bun run export        # regenerate dist-data/ after any change under data/
mise exec -- bun run test          # vp test run (tests import from 'vite-plus/test')
mise exec -- bun run ci            # everything CI runs, in order
```

## Rules that are easy to break

- Never invent an electrical value or normative fact: every value cites a `sources[]` entry; use
  `null` when unknown. `null` = unknown (key required), absent key = not applicable.
  See docs/data-model.md and docs/provenance.md.
- `dist-data/connectors.{json,csv}` are committed; `export:check` fails CI when they are stale.
- Drawings: the opposite gender is its own file, never mirrored (docs/svg.md).
- `public/images/icons/evicons/` is vendored byte-identical from `@evicons/svg`: never edit it,
  reference the icon then run `bun run icons:sync`. Our icons go in `icons/evicons-extension/`.
- GitHub Actions are pinned by commit SHA; keep it that way when bumping.

## Gotchas

- Astro 7 `dev`/`preview` run as daemons: stop them with `astro dev stop` / `astro preview stop`.
  Previewing the project-site layout needs `BASE_PATH=/openplugdb/` at build and preview.
- Pagefind search exists only after `bun run build` (not in `astro dev`).
- For mobile-width checks use `chrome-headless-shell`: regular headless Chrome clamps the window to
  500 px.
- Changing the Pages custom domain does not rebuild the site: re-run `gh workflow run deploy.yml`
  (docs/deployment.md).
