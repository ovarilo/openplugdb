# Data provenance policy

## Principles

1. **No invented value.** Every electrical or normative value cites at least one source in the
   profile's `sourceRefs`. If no source gives it, the value is `null` (unknown), and the gap is
   written in `verification.notes`.
2. **No derived ratings.** A maximum power is recorded only when a source states it. The V × I
   bound computed by the validator is a consistency check, never data.
3. **Normative values are not product ratings.** A manufacturer datasheet may confirm a normative
   value, a contact layout or a gender, but its own rating (e.g. "200 A permanent") is never stored
   as the connector rating. It may appear in `conditions` as an explicit example.
4. **Editions matter.** Standards carry their edition. When editions disagree, the profile says which
   edition its values come from (see CCS Combo 2: 2022 values, 2026 edition not yet reviewed).
5. **Unknown is not an error.** Partial families are publishable when their gaps are listed.

## Source hierarchy

| Rank | Source type (`sources[].type`)                | Use                                                                                       |
| ---- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | `standard`, `standard_abstract`, `regulation` | ratings, contacts, editions (official abstracts and preview samples)                      |
| 2    | `manufacturer`                                | layouts, genders, dimensions, confirmation of ratings                                     |
| 3    | `reference_database`                          | facts only (dimensions, letter types); text and images are not copied                     |
| 4    | `encyclopedia`                                | secondary: only when nothing better was found, flagged with `confidence: medium` or lower |

## Confidence

Each electrical profile has a `confidence`:

- `high`: from the standard text or abstract, or a primary specification, consistent across sources;
- `medium`: from a manufacturer or secondary source citing the standard, not checked against it;
- `low`: single secondary source or unresolved conflict. Prefer leaving the value `null`.

## Verification status

- `verified`: values and layouts checked against primary sources; remaining notes are minor.
- `partial`: published with known gaps (listed on the page).
- `incomplete`: draft; flagged on the site.

`verification.lastVerified` is the date of the last check, and `sources[].accessed` the date each
source was read.

## Reusing other datasets

Other datasets helped design the model and vocabulary but were **not imported**:

| Reference                      | License                       | Use in OpenPlugDB                                              |
| ------------------------------ | ----------------------------- | -------------------------------------------------------------- |
| OCPI 2.2.1 / 2.3.0             | CC BY-ND 4.0 (spec text)      | enum identifiers only, in `mappings/`; descriptions not copied |
| Open Charge Map reference data | not stated for reference data | ConnectionType ids and titles only, for interoperability       |
| OpenStreetMap wiki `socket:*`  | CC BY-SA 2.0 (wiki text)      | key names only                                                 |
| EVicons                        | MIT                           | studied for icon conventions; not imported yet                 |
| PlugVoltage                    | CC BY 4.0                     | not imported: would require attribution on the whole dataset   |
| Open EV Data                   | CDLA-Permissive-2.0           | not imported                                                   |
| WorldStandards                 | all rights reserved           | facts cited as a source; no text or image reused               |
| BeNomad API documentation      | proprietary                   | naming conventions studied only                                |
| Wikimedia Commons drawings     | per file                      | not traced; see [licensing.md](licensing.md)                   |
