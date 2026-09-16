# Chrono Project v0.2.0 — rebranding em validação

A versão `0.2.0` inaugura a identidade Chrono Project. Ela não altera o schema
SQLite nem as regras de negócio, mas rompe deliberadamente a compatibilidade de
identidade com ProjectFlow 0.1.x.

## Mudanças de identidade

- produto e janela: `Chrono Project`;
- pacote, executável e repositório: `chrono-project`;
- identificador Tauri: `io.github.machadojean.chronoproject`;
- banco: `chronoproject.sqlite`;
- portabilidade: `.chronoproject`, formato `chronoproject` versão 1;
- automação E2E: prefixo `CHRONO_PROJECT_`;
- instaladores: `Chrono-Project-Windows-x64-Setup.exe` e
  `Chrono-Project-Windows-x64-Offline-Setup.exe`.

## Compatibilidade

ProjectFlow 0.1.x e Chrono Project 0.2.0 são aplicações distintas. Os dados
existentes são somente de teste e serão recriados. Não existe migration do
diretório antigo, do banco `projectflow.sqlite` ou do pacote `.projectflow`.

## Validação necessária

- lint, typecheck e testes TypeScript/React;
- testes de desempenho;
- `cargo fmt`, `cargo check`, testes Rust e Clippy;
- jornada E2E de aplicação e desktop;
- banco novo criado no diretório do novo identificador;
- round-trip `.chronoproject`;
- PDFs, logs e telas sem referências públicas à identidade anterior;
- instaladores padrão e offline;
- updater assinado consultando `machado-jean/chrono-project`;
- instalação limpa após remover ProjectFlow da máquina de teste.

## Publicação

O repositório remoto somente deve ser renomeado depois que os gates locais
estiverem verdes. Após a alteração, atualizar `origin`, confirmar os redirects e
publicar a versão `v0.2.0`. O CI de `main` e o CI disparado pela tag devem ser
validados separadamente.

Nenhum commit, push, tag ou release foi executado pelo agente.
