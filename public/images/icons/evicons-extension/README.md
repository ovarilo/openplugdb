# EVicons extension (staged for upstream)

Icons that OpenPlugDB draws for connectors [EVicons](https://github.com/evicons/evicons) 0.8.0 does
not cover. They follow the EVicons design guide and contribution rules (24 × 24 grid, stroke 1.5,
`currentColor`, round caps and joins, outline only, `plug-*` names, SVGO-normalised markup,
metadata in the `icons/<name>.json` format) so that the whole folder can be proposed to
`evicons/evicons` in one pull request, after an issue per icon as its `CONTRIBUTING.md` asks.

- License: MIT (see [`LICENSE`](LICENSE)), the license of EVicons, so the files can go upstream
  unchanged. The vendored upstream icons live next door in `../evicons/` and are never edited.
- `since` is `0.9.0`, the next upstream minor release at the time of writing; the maintainers set
  the real version on merge.
- `provenance.createdBy` is `ai`; `approvedBy` and `approvedOn` stay `null`, as upstream requires
  of contributors.
- `osm` and `ocpi` list only values that no EVicons 0.8.0 icon claims and that OpenPlugDB maps as an
  exact match for the face shown.

## How the icons were made

Each icon is the face of an OpenPlugDB front view (`public/images/connectors/`), whose layout is
checked against the sources cited in its `basedOn`. The drawing's outline and contact centres were
scaled uniformly into the 24 grid, without mirroring; nothing was added that the drawing and its
sources do not show. Round recesses reuse the EVicons Schuko construction (circle R 9 at (12, 12),
19 mm hole pitch = 8.75 units); round holes and pins are r 0.5 two-arc discs (r 0.75 for the larger
earth holes), flat blades and slots are stroked segments (like the Schuko earthing clips), and the
male earth pin of CEE 7/5 is a ring r 1.25. Polygon corners have fillets r 1.25. All gaps between
centre lines are at least 2.78 units, so no icon needs `dense-connector` or `sharp-corner`.

Convention extensions to discuss upstream: `plug-europlug` shows a plug face (the Europlug exists only
as a plug), and `plug-iec-60320-c14` shows an appliance inlet face. Upstream accepts domestic
sockets only as charging sockets, so some of these icons may be declined.

## Icons

| Icon                 | Face shown                                   | OpenPlugDB variant                 | Layout sources (via the front view)                                                |
| -------------------- | -------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `plug-nema-5-15`     | NEMA 5-15R receptacle, ground hole down      | `nema-5-15` / `5-15r-receptacle`   | Wikipedia "NEMA connector"; WorldStandards type B                                  |
| `plug-iec-60320-c14` | IEC 60320 C14 appliance inlet                | `iec-60320-c13-c14` / `c14-inlet`  | Schurter 6010 datasheet                                                            |
| `plug-europlug`      | Europlug CEE 7/16 plug                       | `europlug` / `europlug-plug`       | Wikipedia "Europlug"; WorldStandards type C                                        |
| `plug-bs-546-5a`     | BS 546 5 A socket (Type D)                   | `bs-546-5a` / `bs-546-5a-socket`   | Wikipedia "BS 546"; WorldStandards type D                                          |
| `plug-cee-7-5`       | CEE 7/5 socket (Type E), earth pin up        | `cee-7-type-e` / `cee-7-5-socket`  | Wikipedia "AC power plugs and sockets"; WorldStandards type E                      |
| `plug-bs-1363`       | BS 1363 socket (Type G), earth aperture up   | `bs-1363` / `bs-1363-socket`       | Wikipedia "BS 1363"; WorldStandards type G                                         |
| `plug-as-nzs-3112`   | AS/NZS 3112 10 A socket (Type I), earth down | `as-nzs-3112` / `10a-socket`       | Wikipedia "AC power plugs and sockets" and "AS/NZS 3112"                           |
| `plug-sn-441011`     | SN 441011 type 13 socket (Type J)            | `sn-441011` / `t13-socket`         | Wikipedia "SN 441011"; OSM wiki `Key:socket:*`                                     |
| `plug-ds-60884-2-d1` | Danish socket (Type K), earth hole down      | `ds-60884-2-d1` / `earthed-socket` | Wikipedia "AC power plugs and sockets"; Sikkerhedsstyrelsen guidance               |
| `plug-cei-23-50-10a` | CEI 23-50 10 A socket (Type L)               | `cei-23-50` / `10a-socket`         | Wikipedia "AC power plugs and sockets"; Museum of Plugs and Sockets (Italy)        |
| `plug-bs-546-15a`    | BS 546 15 A / SANS 164-1 socket (Type M)     | `bs-546-15a` / `socket`            | Museum of Plugs and Sockets (South Africa); Wikipedia "SANS 164"                   |
| `plug-iec-60906-1`   | IEC 60906-1 socket (Type N), earth offset up | `iec-60906-1` / `iec-socket`       | Wikipedia "AC power plugs and sockets"; Museum of Plugs and Sockets (South Africa) |
| `plug-tis-166`       | TIS 166 socket (Type O), earth hole up       | `tis-166` / `socket`               | TIS 166-2549 standard text                                                         |

Each `<name>.json` gives the full citation (URLs and retrieval dates) in `standard.source`.
