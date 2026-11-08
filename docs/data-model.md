# Data model

Each connector family is one JSON file, `data/<category>/<id>.json`, validated by
[`schemas/connector-family.schema.json`](../schemas/connector-family.schema.json) (JSON Schema
draft 2020-12). The file name must equal the `id`, and the directory must equal the `category`.

The five concepts of the model are logical boundaries inside that single file. One file per family
keeps every connector independently editable, without a join across files.

```text
ConnectorFamily
├── standards[]           referenced standards with their editions
├── relations[]           links to other families (extends, derived_from, superseded_by, related)
├── variants[]            ConnectorVariant: one physical part per role
│   ├── contacts[]        position id, label, gender, optional form
│   ├── electricalProfiles   ids of the profiles this variant supports
│   ├── matesWith[]       counterparts, possibly in another family
│   └── visuals[]         VisualAsset: SVG files
├── electricalProfiles[]  ElectricalProfile: shared by variants, referenced by id
├── mappings              ReferencesAndMappings: OCPI 2.2.1, OCPI 2.3.0, Open Charge Map, OSM
├── sources[]             cited documents, referenced by id
└── verification          status, last verification date, known gaps
```

## Unknown versus not applicable

| Situation                          | JSON                         | CSV        |
| ---------------------------------- | ---------------------------- | ---------- |
| Value documented                   | the value                    | the value  |
| Unknown: not documented in sources | `null` (the key is required) | `unknown`  |
| Not applicable                     | the key is absent            | empty cell |

The schema enforces this: unknown-able keys are required and nullable, and not-applicable keys are
forbidden where they cannot apply (a DC profile cannot have `phases` or `frequencyHz`; an AC
profile must have them, possibly `null`). An unknown value is never a validation error.

## ConnectorFamily

| Field                     | Notes                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| `id`                      | stable kebab-case OpenPlugDB identifier, independent from standards      |
| `name`, `aliases`         | canonical name and other names (trade names, letters, short names)       |
| `category`, `subcategory` | `ev`, `domestic`, `industrial`, `appliance`; free kebab-case subcategory |
| `status`                  | `current`, `discontinued`, `obsolete`, `unknown`                         |
| `regions`, `countries`    | broad regions and ISO 3166-1 alpha-2 codes, both optional (empty lists)  |
| `standards[]`             | `designation` (e.g. `IEC 62196-2`), `edition` (or `null`), `scope`       |

## ConnectorVariant

A variant is one physical part. **Role and contact gender are independent**:

- `role`: `plug`, `socket_outlet`, `cable_connector`, `vehicle_connector`, `vehicle_inlet`,
  `appliance_inlet`, `appliance_outlet`.
- `contactGender`: `male`, `female`, `mixed`, `unknown`. A CEE 7/7 plug is a `plug` with `mixed`
  contacts (male pins, female earth hole); a GB/T vehicle inlet would be an inlet with female contacts.
- `contacts[]`: each contact has a stable position `id` (`L1`, `PE`, `DC+`…), a `label`, a `gender`
  (`male`, `female`, or `sexless` for surface contacts such as Schuko earthing clips) and an optional
  `form`. `null` when the contact set is not documented.
- `matesWith[]`: counterparts this part physically mates with. Each relation is stored **once**, in
  one direction; the reverse is derived (`matedBy` in the JSON export). Relations can cross families
  (CCS2 inlet ↔ Type 2 vehicle connector). Mating is physical only: it says nothing about electrical
  compatibility.

## ElectricalProfile

A family can have several profiles (AC single-phase, AC three-phase, DC, or one per rating system).
Profiles are declared once per family and referenced by the variants that support them.

| Field                         | Notes                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `currentType`, `supply`       | `ac`/`dc`; `single_phase`, `split_phase`, `three_phase`, `dc`                                                                                                       |
| `phases`, `frequencyHz`       | required for AC (nullable), forbidden for DC                                                                                                                        |
| `neutral`, `protectiveEarth`  | booleans or `null`                                                                                                                                                  |
| `voltage`                     | `qualifier` (`rated`, `max`, `range`), `value` or `min`/`max`, `reference` (`line_to_neutral`, `line_to_line`, `dc`)                                                |
| `current`                     | same qualifiers, in amperes                                                                                                                                         |
| `maxPowerKw`                  | only when a cited source states it, with its own `sourceRefs`; never computed                                                                                       |
| `cooling`                     | only when the rating depends on cooling                                                                                                                             |
| `contactFunctions`            | contact id → function under this profile (`line`, `neutral`, `protective_earth`, `control_pilot`, `proximity_pilot`, `dc_positive`, `dc_negative`, `communication`) |
| `standardRef`, `jurisdiction` | the standard defining the values, and the rating system when it varies by region (`IEC`, `UL/CSA`, `NEMA`)                                                          |
| `sourceRefs`, `confidence`    | sources backing this profile and a `high`/`medium`/`low` confidence                                                                                                 |

Contact functions belong to the profile, not to the contact, because the same pin can change role:
the two power contacts of SAE J3400 carry DC+/DC− in DC and L1/L2 in AC.

A rating is the capability of the interface. It is never the power available at an installation,
and no single power figure is attached to a connector type.

## VisualAsset

See [svg.md](svg.md). Each visual declares `kind`, `file`, `title`, `orientation`, `accuracy`,
`provenance`, `author`, `license`, and optionally `sourceUrl` and `basedOn` (source ids it was
checked against).

`file` is relative to `public/images/`:

| Visual                        | `file`                               | Rules                                           |
| ----------------------------- | ------------------------------------ | ----------------------------------------------- |
| drawing (every kind but icon) | `connectors/<family-id>/<name>.svg`  | in the folder of its own family                 |
| vendored EVicons icon         | `icons/evicons/<name>.svg`           | `kind: icon`, `third_party`, `MIT`, `sourceUrl` |
| OpenPlugDB extension icon     | `icons/evicons-extension/<name>.svg` | `kind: icon`                                    |

A `kind: icon` file must live under `icons/`; any other kind under `connectors/<family-id>/`.

## ReferencesAndMappings

`mappings` has one list per external system. An empty list means the system has no equivalent value.
Each entry gives the external `value`, a `match` (`exact`, `broader`, `narrower`, `partial`), an
optional `variants` restriction and a `note`. Allowed values live in `mappings/<system>.json`:

| System          | Vocabulary                                   | Unknown values                                       |
| --------------- | -------------------------------------------- | ---------------------------------------------------- |
| `ocpi-2.2.1`    | closed enum                                  | rejected                                             |
| `ocpi-2.3.0`    | open enum                                    | accepted (OCPI 2.3.0 made ConnectorType an OpenEnum) |
| `openchargemap` | closed list                                  | rejected                                             |
| `openstreetmap` | curated subset of documented `socket:*` keys | rejected: add the documented key first               |

`sources[]` hold the title, publisher, type (`standard`, `standard_abstract`, `manufacturer`,
`encyclopedia`…), URL and access date. `verification` holds the status (`verified`, `partial`,
`incomplete`), the last verification date and the known gaps.
