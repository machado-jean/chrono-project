# Chrono Project v0.2.0 — candidato a release

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
- símbolo oficial: relógio mecânico aberto em forma de `C`;
- conjunto Tauri/Windows regenerado a partir de `src/assets/chrono-mark.png`;
- interface sem o marcador provisório `PF` e sem repetição do nome na barra
  lateral.

As especificações de uso estão em [`docs/branding.md`](../branding.md), e a
decisão está registrada no [ADR 024](../decisions/024-mechanical-clock-icon.md).

## Compatibilidade

ProjectFlow 0.1.x e Chrono Project 0.2.0 são aplicações distintas. Os dados
existentes são somente de teste e serão recriados. Não existe migration do
diretório antigo, do banco `projectflow.sqlite` ou do pacote `.projectflow`.

## Evidência local concluída

- [x] versões `0.2.0` consistentes em npm, Cargo e Tauri;
- [x] ESLint;
- [x] typecheck TypeScript;
- [x] 140 testes TypeScript/React;
- [x] build Vite de produção;
- [x] transparência e leitura dos ícones de 32 e 128 px;
- [x] ícone aplicado à interface e aos formatos gerados pelo Tauri;
- [x] marcador `PF` removido da interface.

## Validação ainda necessária

- [ ] testes de desempenho;
- [ ] `cargo fmt`, `cargo check`, testes Rust e Clippy;
- [ ] jornada E2E de aplicação;
- [ ] auditoria desktop diagnóstica quando o ambiente permitir;
- [ ] banco novo criado no diretório do novo identificador;
- [ ] round-trip `.chronoproject`;
- [ ] PDFs, logs e telas sem referências públicas à identidade anterior;
- [ ] executável e instaladores com o novo ícone;
- [ ] instaladores padrão e offline;
- [ ] updater assinado consultando `machado-jean/chrono-project`;
- [ ] inspeção do ícone na barra de título, barra de tarefas, menu Iniciar,
  atalho, lista de aplicativos, instalador e desinstalador;
- [ ] instalação limpa após remover ProjectFlow da máquina de teste;
- [ ] tamanhos e SHA-256 dos artefatos registrados;
- [ ] CI de `main` aprovado;
- [ ] CI da tag `v0.2.0` aprovado após publicação autorizada.

## Publicação

O repositório remoto somente deve ser renomeado depois que os gates locais
estiverem verdes. Após a alteração, atualizar `origin`, confirmar os redirects e
publicar a versão `v0.2.0`. O CI de `main` e o CI disparado pela tag devem ser
validados separadamente.

As notas destinadas ao usuário estão em [`v0.2.0.md`](v0.2.0.md).

Nenhum commit, push, tag ou release foi executado pelo agente. Os campos de
publicação permanecem explicitamente pendentes.
