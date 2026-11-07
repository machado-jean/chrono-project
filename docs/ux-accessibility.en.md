# UX and accessibility audit

Top menus follow expected desktop behaviour: only one stays open; `Esc` closes
it and returns focus to its command; clicking outside the bar closes an open menu
without triggering action.

## Scope

This audit closes the local Phase 7 UX/accessibility increment. It covers the
Portuguese and English desktop interface, keyboard navigation, semantics exposed
by WebView2, focus, legibility, and minimum window width. It changes neither
business rules, SQLite schema, nor user data.

It is a technical verification against `AGENTS.md`, not formal WCAG
conformance certification.

## Direction for future visual reviews

Future UI reviews reduce generic-dashboard appearance and build a recognisable
Chrono language: dense desktop application, own tokens, characteristic
hierarchy, and details inspired by precision/chronology without turning UI into
themed decoration. Avoid cards, pills, gradients, shadows, and large spacing
applied merely because templates or AI-generated applications repeat them.
Every visual choice has a clear function and remains coherent across views.

Differentiation remains subordinate to contrast, visible focus, accessible names,
drag alternatives, reduced motion, minimum width, Windows scaling, and legible
dense projects.

## Included fixes and guarantees

- Windows window uses an integrated Chrono title bar with native drag region and
  named minimise, maximise/restore, and close controls. Controls preserve visible
  focus; double click free area toggles maximised state.
- Critical path uses a project switch with `role`/`aria-checked` beside baseline.
  Information button and first enable open focus-trapped Escape-closing dialog.
  Diagram describes real fork/convergence with accessible title/description;
  automatic target is textual and indicators are not colour-only. It separates
  **Forecast finish**, **Final target**, and **Overall margin**; unavailable
  analysis gives exact reason/action.
- **Skip to main content** bypasses project list; selected project exposes
  `aria-current="page"`.
- Table has accessible caption; hierarchy/detail buttons expose
  `aria-expanded`; its single horizontal bar can focus and remains available
  without reaching final task. Native competing bar stays hidden while touchpad
  and Shift+wheel continue.
- Table/Kanban provide task menus through right click and accessible button.
  Arrows, Home, End, and Escape operate menu and restore focus. Text fields use
  the light Chrono menu (cut/copy/paste/select all before task actions); other
  form controls offer coherent value copy. Clipboard failures become textual
  alerts and return focus to source control.
- Every Table row exposes pending/save/error state through accessible compact
  indicator/tooltip, not colour only. Normal state does not repeat **Saved**;
  **Save** appears only with pending change.
- Reordering/actions share one horizontal strip. Visual-code help is focusable
  and associated with explanation. Filter count uses non-interruptive live
  announcement.
- Table, Kanban, Gantt tabs support arrows, Home, End. Top menus Escape-close
  back to menu title. **Help > Keyboard shortcuts** and `Ctrl+/` list only
  actually available commands. Task details Escape-collapse to same-row button.
- Modals move focus to safe action, trap Tab/Shift+Tab, Escape-close where
  allowed, and restore invoking focus. Destructive restore confirmation starts
  at **Cancel**.
- Kanban retains **Status** selector as drag alternative, announces saving, uses
  `DD/MM/YYYY`, highlights drop destination, and validates dedicated Pointer
  Events handle on real WebView2.
- Task completion uses shared Table/Kanban/Gantt modal that textualises existing
  data, traps/restores focus, allows Escape cancel, then saves Completed, 100%,
  and factual date. Reopen requests new progress.
- Gantt inspector is gesture alternative. AUTO bar movement adjusts FS interval;
  protected left edge, duration-adjusting right edge, and derived summary dates
  enforce rules. MANUAL tasks announce locked dates, block gesture, retain exact
  inspector editing.
- Visible feedback/status region announces save, FS limits, and changed-lag
  count. Gantt Undo/Redo joins unified Table/Kanban/Gantt history via `Ctrl+Z`
  and `Ctrl+Shift+Z`; text fields retain native undo.
- Unsaved row uses amber fileting and discrete task-cell highlight, never whole
  error-painted table. Bulk selection has named lock/unlock controls and
  `Ctrl+Shift+L` outside editable fields.
- Summary-predecessor relation opens impact preview with focus trap, Escape,
  and text old/new dates. Predecessor selector has named search, checkboxes,
  summary indication, existing relations, textual preview. **Edit** exposes
  Undo/Redo with shortcut and operation description.
- Gantt context menu is primary FS create/delete route; only leaves are targets
  while summaries can be sources. All operational/support text avoids 7–9 px;
  secondary colours improved contrast; forced-colour mode has explicit outlines.
- Reduced-motion preference is honoured. Brand mark is decorative (`alt=""`);
  name remains in title bar and collapsed-sidebar command has accessible name
  **Show projects**.

## Evidence

On 8 September 2026 desktop E2E also passed simulated 125%/150% density at
960×640 minimum viewport: no global horizontal scroll, all three tabs available,
shortcut dialog operable/Escape-closing. WebView2 accessibility tree exposed
**Projects**, **Project list**, **Main menu**, main content, and all view tabs.

Automation verifies structure consumed by assistive technology but does not hear
Narrator synthesis. Manual Narrator pass remains needed for pronunciation,
auditory order, and dynamic-message clarity.

Historical 117 tests are superseded by consolidated 8 September run with 122
regular tests and three real desktop scenarios. It included focus-trapped/restored
dialogs, menu Escape, current project, caption, shortcuts, detail closing,
Kanban drag, Gantt temporal editing/completion/FS lag, summary recalculation,
and visual FS creation. Real Tauri/WebView2 verified Kanban card movement and
restoration, predecessor task end expansion and SQLite persistence. At 1024×720
and 960 px, document/body matched viewport without global horizontal scroll;
Table retained its own scroll by design. Full gates are in
[environment](environment.en.md).

## Accessible alternatives

| Visual interaction | Available alternative |
| --- | --- |
| Drag Kanban card | **Status** selector on the card |
| Read progress by colour | Text percentage on card/Table |
| Follow Gantt dependency | Dependency selector and equivalent Table data |
| Edit temporal bar | Inspector native start/duration fields |
| Identify highlighted conflict | Text row message/conflict summary |

## Manual release route

On clean Windows VM:

1. press Tab from window and verify visible focus on skip link and following controls;
2. use skip link and verify focus reaches main content;
3. open **File**, navigate action, press Escape;
4. press `Ctrl+/`, traverse shortcuts and close Escape;
5. open task details, enter field, press Escape, verify details close/focus returns;
6. open import/template modal, traverse with Tab/Shift+Tab, close Escape, verify return;
7. traverse Table/Kanban/Gantt with arrows, Home, End;
8. in Kanban change status through selector without dragging;
9. inspect at Windows 125%/150% scaling when available.

## Known limits

- SVAR renders visual Gantt layer; essential information/editing remains in
  native Chrono controls and Table, the accessible reference interface.
- Simulated 125%/150% passed; repeat with real Windows scale on installed build
  and listen with Narrator on clean VM.
- Automated harness passed locally with isolation and remains diagnostic until
  VM/CI validation; mandatory gate remains layered.
