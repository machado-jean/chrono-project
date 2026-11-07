# Avisos de terceiros

## Tauri Opener 2.5.4

O Chrono Project usa `@tauri-apps/plugin-opener` e `tauri-plugin-opener` somente
para abrir, no navegador padrão, os dois instaladores publicados pelo próprio
projeto. A capability nativa restringe os endereços permitidos.

- licença: MIT ou Apache-2.0;
- projeto: <https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/opener>;
- documentação: <https://v2.tauri.app/plugin/opener/>.

## Playwright Core 1.64.1

O Chrono Project usa `playwright-core` somente no diagnóstico local da automação da
janela Tauri. O pacote não incorpora navegador, não é necessário no gate E2E em
camadas e não é incluído no executável ou nos instaladores de produção.

- licença: Apache-2.0;
- projeto: <https://github.com/microsoft/playwright>;
- documentação: <https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp>.
