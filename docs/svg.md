# Drawings

Drawings are a feature, not decoration: a front view must let a reader identify a part and its
contacts. Files live in `public/images/connectors/<family-id>/` and are declared in the `visuals` of
the variant they show. `visuals[].file` is relative to `public/images/`, so a drawing is referenced
as `connectors/<family-id>/<name>.svg`.

## Kinds

| `kind`              | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `front_view`        | mating face of one part, with contact labels       |
| `pinout`            | detailed contact assignment (mating face)          |
| `technical_diagram` | other technical drawing                            |
| `side_view`         | optional profile view                              |
| `icon`              | simplified UI pictogram, not a technical reference |

Interface icons and technical drawings are separate on purpose, on disk and on the site (the
connector page shows icons in their own "Icons" block). See [Icons](#icons) below.

## Orientation convention

- **Mating face**: the part is seen straight on, from the side that meets its counterpart, as you
  look at it just before connecting. For a socket, you look into the socket; for a plug or an
  inlet, you look at the pins.
- Each part keyed by an asymmetric feature is drawn with that feature in its usual reference
  position: the flat edge of IEC 62196 Type 2 at the top, the IEC 60309 earth contact at 6 h (bottom),
  the NEMA 5-15R ground hole at the bottom (the standard does not fix the mounting orientation), the
  chamfered corners of IEC 60320 couplers at the top, the two power contacts of SAE J3400 (NACS) at
  the top.
- Two mating faces are mirror images of each other. **The opposite gender is drawn as its own file,
  never derived by mirroring**: the validator rejects `scale(-1…)` and `matrix(-1…)` transforms.
  Each face is checked against a source that shows that face.
- The `title` states the part, its gender and the view, e.g. "IEC 62196 Type 2 vehicle inlet (male),
  mating face".

## Style

| Element            | Rendering                                                            |
| ------------------ | -------------------------------------------------------------------- |
| Outline            | stroke `#1c2430`, width 3, no fill                                   |
| Male contact (pin) | filled circle `#1c2430`, white label inside when it fits             |
| Female contact     | ring (stroke `#1c2430`, width 3), dark label inside when it fits     |
| Sexless contact    | filled bar (e.g. Schuko earthing clips)                              |
| Labels             | `system-ui, sans-serif`, 10 px bold; small contacts labelled outside |
| Caption            | "MATING FACE · MALE/FEMALE/MIXED", 9 px, `#5a6472`, at the bottom    |
| Canvas             | `viewBox` 200 wide, no `width`/`height`, transparent background      |

Contact labels use the ids of the variant (`L1`, `N`, `PE`, `CP`, `PP`, `DC+`, `DC−`…). Unassigned
positions use `L/N`. A face that carries male and female contacts together (`contactGender: mixed`,
such as the CEE 7/5 socket-outlet with its earth pin, or the CEE 7/7 plug with its earth hole) uses
the caption "MATING FACE · MIXED". The site shows drawings on a light plate in both colour schemes.

## Accuracy

`accuracy: schematic` means contact positions and the outline are correct **relative to each other**
and follow the cited sources; dimensions are not to scale. When proportions follow published
dimensions, the `<desc>` says which ones. `to_scale` is reserved for drawings built from the
dimensional standard sheets. `basedOn` lists the source ids the drawing was checked against.

A drawing is only published once the layout of that face is shown by a source depicting that face
(not deduced by mirroring the opposite part), and its outline and proportions are backed by
published dimensions or primary drawings. When the contact assignment relies on a single secondary
source, the drawing may be published but the family's `verification.notes` say so (the line and
neutral sides of BS 546 and BS 1363, for example). Faces without such support stay undrawn and are
listed in the verification notes (in this iteration: the CCS2 DC and Type 1 vehicle connectors, the
IEC 60309 plug and appliance-inlet faces, the CEE 7/4 plug, CHAdeMO, MCS and SI 32).

## Structural checks (`src/lib/svg.ts`)

- `<svg>` root with the SVG namespace and a `viewBox`, no fixed `width`/`height`;
- accessibility: `role="img"` and a non-empty `<title>` (add a `<desc>` describing the layout);
- no `<script>`, event handler attributes, `<foreignObject>`, embedded `<image>` or external
  reference (only local `#fragment` references);
- no mirror transform;
- no opaque full-canvas background;
- 30 kB maximum.

Icons under `public/images/icons/` are checked in icon mode, because upstream icon files carry a
fixed `width`/`height` and no `<title>` (the page gives the alternative text): the `width`/`height`,
`role="img"` and `<title>` rules are dropped; every other rule above still applies.

`bun run validate` also checks that every visual file exists, that every SVG under
`public/images/connectors/` and `public/images/icons/` is referenced by a variant, that drawings
live under `connectors/<family-id>/` and icons under `icons/`, and that `icons/evicons/` files are
`third_party`, `MIT` and give a `sourceUrl`.

## Icons

Icons (`kind: icon`) are simplified UI pictograms, not technical references. They come from
[EVicons](https://github.com/evicons/evicons) (MIT, Copyright (c) 2026 Landolsi Digital), a 24 × 24
outline set (stroke 1.5, `currentColor`) that covers EV connectors, Schuko and the CEE industrial
sockets. EVicons draws each interface once (the vehicle inlet face, or the socket face for
socket-only connectors), without separate male and female versions, and has nothing for IEC 60320,
NEMA or most domestic types.

| Folder                                   | Content                                                     | `visuals[].file`                     |
| ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `public/images/icons/evicons/`           | upstream icons, byte-identical to the pinned `@evicons/svg` | `icons/evicons/<name>.svg`           |
| `public/images/icons/evicons-extension/` | OpenPlugDB icons for what EVicons lacks                     | `icons/evicons-extension/<name>.svg` |

- **Vendored icons** are never edited. Reference the icon in `visuals`, then run
  `bun run icons:sync`: it copies every referenced icon and the package `LICENSE` from
  `node_modules/@evicons/svg/` unchanged. `bun run icons:check` (run by CI) fails when a vendored
  file is missing or differs from the package. They are declared with `provenance: third_party`,
  `license: MIT`, `author: "Landolsi Digital (EVicons)"` and a `sourceUrl` pinned to the package
  version, e.g. `https://github.com/evicons/evicons/blob/v0.8.0/packages/svg/svg/plug-type-2.svg`.
- Before attaching a vendored icon, compare it with the variant's sourced layout (contact count and
  positions, keying, outline). An icon that contradicts it, or that cannot be checked because no
  source shows that face, is not attached and the family's `verification.notes` say why
  (`plug-gbt-dc`, `plug-chademo` and `plug-mcs` in this iteration). `plug-type-2` is also attached
  to the GB/T 20234.2 AC vehicle inlet, which EVicons covers with the same face.
- **Extension icons** are kept apart so that they can be proposed upstream in one pull request.
  They follow the EVicons design guide and contribution rules exactly (root attributes, grid,
  stroke, naming `plug-*`, SVGO-normalised markup), not the drawing style above. Each
  `<name>.svg` has a `<name>.json` next to it in the upstream metadata format (`category`,
  `meaning`, `tags`, `since`, `standard` naming the figure checked, `osm`/`ocpi` only for values no
  upstream icon claims, `provenance.createdBy`), and the folder carries its own MIT `LICENSE` and a
  `README.md` listing the icons and their sources. They are declared with `provenance: original`,
  `license: MIT`, `author: "OpenPlugDB contributors"` and the `basedOn` of the front view they were
  drawn from.
- An extension icon is only made for a face that already has a sourced front view: its outline and
  contact centres are scaled from that drawing into the 24 grid, never mirrored or completed.
- Attach an icon to the variant whose face it shows (for EVicons connector icons, the vehicle inlet;
  for Schuko and CEE, the socket-outlet; for extension icons, the face of their front view), with
  `orientation: mating_face` and `accuracy: schematic`.
- A family without a front view uses its icon as the thumbnail on the site.

To propose the extension icons upstream: open one issue per icon on `evicons/evicons` (name, meaning,
standard), then copy `<name>.svg` and `<name>.json` into the upstream `icons/` folder, run its
`npm run lint:icons` and `npm run build:icons`, and follow its `CONTRIBUTING.md` (preview, checks,
`CHANGELOG` entry). Once released, switch the visuals to `icons/evicons/<name>.svg`
(`provenance: third_party`), run `bun run icons:sync` and delete the extension copy.

## Licenses

Each visual declares its `license` (SPDX) and `provenance`. Original drawings are `CC-BY-4.0`,
author "OpenPlugDB contributors". Third-party files keep their own license and must give a
`sourceUrl`. Do not trace ShareAlike (CC BY-SA) drawings into project files: see
[licensing.md](licensing.md).
