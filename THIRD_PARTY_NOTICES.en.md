# Third-party notices

## Tauri Opener 2.5.4

Chrono Project uses `@tauri-apps/plugin-opener` and `tauri-plugin-opener` only
to open, in the default browser, the two installers published by the project
itself. The native capability restricts the permitted addresses.

- licence: MIT or Apache-2.0;
- project: <https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/opener>;
- documentation: <https://v2.tauri.app/plugin/opener/>.

## Playwright Core 1.64.1

Chrono Project uses `playwright-core` only for local diagnostics of Tauri-window
automation. The package does not bundle a browser, is not needed by the layered
E2E gate, and is not included in the production executable or installers.

- licence: Apache-2.0;
- project: <https://github.com/microsoft/playwright>;
- documentation: <https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp>.
