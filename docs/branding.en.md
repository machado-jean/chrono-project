# Chrono Project visual identity

## GitHub presentation

`README.md` uses the official transparent mark in `src/assets/chrono-mark.png`,
centred and reduced, without creating a parallel symbol variant. The main page
is kept in Brazilian Portuguese and links to `README.en.md`, which provides an
equivalent English presentation.

README badges must represent only verifiable states: latest release, `main` CI,
Windows platform, offline operation, and Tauri. Downloads use the permanent
`releases/latest/download` URLs, retaining stable names for standard and
offline installers.

Repository topics describe technology and domain, never unproven qualities.
The `open-source` topic is valid only while the MIT `LICENSE` is published on
the default branch. The official Social Preview uses a 2:1 ratio, a clear dense
composition, original symbol without redraw, product name, and short bilingual
message. Its editable source is `docs/assets/github-social-preview.html`; the
published PNG is `docs/assets/github-social-preview.png`.

## Official mark

The Chrono Project symbol is an open mechanical clock shaped as a `C`. Its
construction combines chronology, precision, and planning without reproducing
another product’s identity.

Permanent elements:

- circular ring open on the right to form the letter `C`;
- visible mechanism with gears, bridges, balance wheel, and jewels;
- two skeleton hands with clearly different lengths;
- navy dial with gold five-minute marks and four intermediate white ticks;
- subtle cyan arc for progress;
- three external ornamental extensions only at 12, 9, and 6 o’clock;
- gold filigree inspired by watchmaking;
- transparent background.

The mark uses neither text, Roman numerals, a right-side external dot, sword,
nor elements belonging to Chrono Trigger. The time theme is expressed as an
original product composition.

## Visual hierarchy

Depth order, from background to foreground:

1. navy dial enamel;
2. white ticks and gold markers;
3. structural rings;
4. filigree and mechanical bridges;
5. jewels and hands.

When elements cross, occlusion must follow this order. Markers must not appear
placed over filigree or mechanical pieces.

## Interface use

- The integrated title bar contains the mark, **Chrono Project**, and native
  minimise, maximise/restore, and close controls.
- The sidebar does not repeat the name; it shows the mark and **Local planning**.
- When collapsed, the mark is the **Show projects** button.
- Empty state uses the same mark without replacing accessible text.
- Decorative images use `alt=""`; name and function remain exposed by controls
  and landmarks.

The former provisional `PF` marker from ProjectFlow was removed.

## Interface identity

Chrono Project identity extends beyond the icon. Table, Kanban, Gantt, menus,
dialogs, filters, and states form a recognisable system connected to time,
precision, and mechanism.

The aim is to avoid the generic dashboard appearance common to automatically
repeated UI patterns: excessive rounded cards, large empty areas, purposeless
gradients, diffuse shadows, pills for all content, and interchangeable sidebar /
header / block compositions.

### Principles

- **Instrument, not showcase:** the application should feel like a desktop
  planning tool, not a landing page or promotional dashboard.
- **Intentional density:** use screen area without compressing readability,
  focus, or interaction targets.
- **Time as structure:** use rhythm, scale, dividers, progression, and subtle
  mechanical details; do not scatter clocks or gears as decoration.
- **Functional personality:** borders, colours, icons, and motion distinguish
  hierarchy, state, dependency, and temporal impact.
- **Own consistency:** the same function keeps appearance and behaviour in
  Table, Kanban, and Gantt.
- **Originality without copying:** references may guide atmosphere and finish,
  never reproduce another application or franchise composition.

### Broad-review process

1. inventory components, density, colours, radii, shadows, and inconsistencies;
2. define tokens and two or three pilot screens with dense data;
3. approve direction before expanding to the whole application;
4. create or adapt shared components, avoiding isolated fixes;
5. validate keyboard access, contrast, reduced motion, 125%/150% scaling, and
   minimum width;
6. compare without the logo: the interface should still feel like Chrono.

Visual differentiation must never reduce productivity, accessibility, or
schedule clarity.

### Progressive implementation

The first visual-system stage is concentrated in shell, sidebar, top menus,
header, filters, tabs, and Table. It establishes ink, paper, brass, and cyan
colours, technical title typography, and more precise geometry. Kanban, Gantt,
and dialogs adopt the same tokens after pilot inspection with dense data.

Navigation follows a desktop-application model: a compact menu bar gathers
navigation, File, Edit, and View; a narrow rail switches Table, Kanban, and
Gantt; an adjacent panel keeps projects. The two side areas use one surface and
hierarchy, without decorative numbering, redundant descriptions, or icons in
Windows textual menus.

All views share the vocabulary for background, borders, radius, focus, and
state colours. Differences represent view function, not unrelated products.
Table header belongs to the light composition; dark bands are reserved for
contexts where they genuinely help.

### Application colour system

- firm cool neutrals structure window, panels, tables, and forms;
- teal/cyan identifies primary action, focus, selection, and navigation;
- gold identifies brand and planning-attention points;
- green, amber, and red are reserved for success, risk, and error;
- light support colours are never the sole state signal: text, border, or icon
  preserves interpretation;
- large surfaces avoid sugary or overly pastel colours; saturated colours appear
  in controlled actions and states.

The overall composition uses only three recurring levels: application frame,
content, and editable panels. Headers, sidebars, and view backgrounds share the
frame; white is reserved for tables, cards, menus, and dialogs. Do not create a
new colour band for each command group.

## Official files

| Use | File |
| --- | --- |
| transparent raster source | `src/assets/chrono-mark.png` |
| main Tauri icon | `src-tauri/icons/icon.png` |
| Windows executable | `src-tauri/icons/icon.ico` |
| Apple bundle maintained by Tauri | `src-tauri/icons/icon.icns` |
| common sizes | `src-tauri/icons/32x32.png`, `128x128.png`, `128x128@2x.png` |
| Windows tiles | `src-tauri/icons/StoreLogo.png` and `Square*Logo.png` |

Derivatives are generated by Tauri CLI from the approved source. Do not edit
individual sizes, which would diverge installer, executable, and interface.

## Quality criteria

- retain transparency and optical margin;
- retain recognisable `C` outline at 32 px;
- retain adequate contrast on light and dark backgrounds;
- do not include text in the image file;
- do not alter count or radial angle of tick marks;
- inspect 16, 24, 32, 48, 128, and 256 px before publication;
- inspect title bar, taskbar, Start menu, shortcut, app list, installer, and
  uninstaller on Windows.

## Regeneration

At repository root:

```powershell
npm run tauri -- icon src\assets\chrono-mark.png --output src-tauri\icons
```

The command can also create mobile targets outside Windows V1. Do not add those
to the repository while those platforms remain out of scope.
