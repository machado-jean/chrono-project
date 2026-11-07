# ADR 024 — Mechanical clock as the visual symbol

## Status

Accepted on 2026-09-24.

## Context

Chrono Project identity needed to replace the provisional `PF` mark and
abstract icons used during development. The symbol had to communicate time,
chronology, and precision, remain recognisable at small sizes, and be original.

The initial Chrono Trigger clock-theme reference was treated only as an
affective memory and conceptual direction. Copying typography, composition,
ornamentation, or that brand’s clock would not be acceptable.

## Decision

Adopt an open, `C`-shaped mechanical clock with visible gears, two hands,
filigree, and three outer extensions at 12, 9, and 6 o’clock.

Its scale follows analog-clock logic: primary markers every five minutes and
four smaller, radial, uniform ticks between adjacent primary markers. The dial
uses navy blue, gold metal, and a cyan progress arc on a transparent background.

The same symbol is the source of truth for the interface and Tauri derivatives.
The sidebar displays **Local planning**, without repeating the name already in
the integrated Chrono Project title bar.

## Consequences

- The icon gains visual richness at larger sizes while keeping the `C` outline
  as a recognisable element when reduced.
- Mechanical details can simplify at 16–32 px; the outline, hands, and three
  extensions therefore take priority.
- Any future change must regenerate the complete icon set and repeat Windows
  integration-point inspection.
- Detailed specification and asset paths are in
  [`docs/branding.md`](../branding.md).

## Rejected alternatives

- Keep `PF`: it referred to the provisional ProjectFlow name.
- Abstract two-arc symbol: it did not clearly communicate a clock.
- Horizontal logo: it does not fit desktop-icon usage points.
- Visual approximation of Chrono Trigger: it would reduce originality and
  create an improper association with another intellectual property.
