# ADR 030 — Public MIT licence

## Status

Accepted on 2026-10-10.

## Context

Chrono Project began to be presented publicly in Brazilian Portuguese and
English. Without an explicit licence, visitors can read the repository but do
not receive clear permission to use, modify, or redistribute its code.

## Decision

Publish Chrono Project authored code under the MIT licence, with copyright held
by Jean Machado and project contributors. The canonical declaration is in
`LICENSE`; npm and Cargo manifests use the `MIT` SPDX identifier.

The project licence does not replace licences for dependencies, catalogs, or
other third-party material. Those attributions remain documented in
`THIRD_PARTY_NOTICES.md`.

## Consequences

- use, copying, modification, and redistribution are permitted under MIT terms;
- copies or substantial portions must retain the copyright notice and licence;
- software remains provided without warranty;
- accepted contributions are distributed under the project’s same licence;
- the repository is identified as open source by the `LICENSE` file published
  on the default branch.
