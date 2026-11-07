# Documentation language policy

## Purpose

Chrono Project maintains product, operational, contribution, and governance
documentation in Portuguese (Brazil) and English. Both languages must convey
the same factual information so users, contributors, and reviewers can operate
the project without relying on informal translation.

## File convention

- the Portuguese (Brazil) source uses the canonical name, for example
  `docs/scheduling.md`;
- the English version uses the same path with the `.en.md` suffix, for example
  `docs/scheduling.en.md`;
- `README.md` keeps the historical `README.en.md` exception;
- both files are versioned, catalogued in `docs/README.md`, and have valid
  internal links.

## Required coverage

The requirement covers guides, technical and operational documentation, ADRs,
community policies, the current release note, the changelog, and contribution
instructions. The canonical MIT license is not translated: it remains the
original legal text.

Historical release notes remain PT-BR-only immutable records. Starting with
v0.3.0, every new release receives its English counterpart during its own
checklist. Historical records preserve the date, scope, and facts of the
original record; a translation must not rewrite the event or invent missing
information.

## Update process

1. Update the PT-BR source and the English version in the same branch.
2. Check titles, commands, versions, paths, hashes, and URLs in both languages.
3. Record the purpose of each pair in the index.
4. Before the final release commit, run:

   ```powershell
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1 -RequireEnglishPairs
   ```

5. Do not open a release Pull Request while a pair is missing or has a factual
   discrepancy.

## Translation boundaries

File names, commands, configuration keys, identifiers, product names, and code
blocks must not be translated. Text shown in the interface must match the
translation actually delivered by the application.
