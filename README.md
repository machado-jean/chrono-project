<div align="center">
  <img src="src/assets/chrono-mark.png" alt="Marca do Chrono Project" width="150" />
  <h1>Chrono Project</h1>
  <p><strong>Planejamento de projetos desktop, local-first e feito para Windows.</strong></p>
  <p>Tabela, Kanban, Gantt, predecessoras, caminho crítico e dados sob seu controle.</p>
  <p>
    <strong>Português (Brasil)</strong> ·
    <a href="README.en.md">English</a>
  </p>
  <p>
    <a href="https://github.com/machado-jean/chrono-project/releases/latest"><img src="https://img.shields.io/github/v/release/machado-jean/chrono-project?display_name=tag&sort=semver&label=release&color=087f8c" alt="Última versão" /></a>
    <a href="https://github.com/machado-jean/chrono-project/actions/workflows/ci.yml"><img src="https://github.com/machado-jean/chrono-project/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
    <img src="https://img.shields.io/badge/Windows-11%20x64-2563eb" alt="Windows 11 x64" />
    <img src="https://img.shields.io/badge/opera%C3%A7%C3%A3o-offline-087a52" alt="Operação offline" />
    <img src="https://img.shields.io/badge/Tauri-2-24c8db" alt="Tauri 2" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/licen%C3%A7a-MIT-c79221" alt="Licença MIT" /></a>
  </p>
  <p>
    <a href="https://github.com/machado-jean/chrono-project/releases/latest/download/Chrono-Project-Windows-x64-Setup.exe"><strong>Baixar para Windows</strong></a>
    ·
    <a href="https://github.com/machado-jean/chrono-project/releases/latest/download/Chrono-Project-Windows-x64-Offline-Setup.exe">Instalador offline</a>
    ·
    <a href="https://github.com/machado-jean/chrono-project/releases/latest">Notas da versão</a>
  </p>
</div>

> [!NOTE]
> Chrono Project é um projeto independente de gestão de projetos e não possui
> vínculo com o Project Chrono, plataforma de simulação física.

## O que é

Chrono Project é uma aplicação desktop para planejar projetos sem depender de
contas, servidor remoto ou assinatura. Projetos, tarefas, calendários e backups
permanecem na máquina do usuário. Depois de instalado, o uso normal funciona
integralmente offline.

Foi desenhado para oferecer densidade e produtividade de software desktop sem
virar uma planilha genérica ou um painel SaaS.

## Destaques

| Área | Recursos |
| --- | --- |
| Planejamento | Tarefas, subtarefas, cinco níveis, prioridades, responsáveis, tags, datas, duração e progresso |
| Cronograma | Dependências Término–Início, múltiplas predecessoras, lag, dias úteis, feriados e propagação automática |
| Análise | Plano de referência, desvios, prazo-limite, saúde, caminho crítico, folga e margem da meta |
| Visualizações | Tabela editável, Kanban por status e Gantt hierárquico sincronizados sobre os mesmos dados |
| Produtividade | Edição inline, ações em massa, menus de contexto, histórico, `Ctrl+Z` e `Ctrl+Shift+Z` |
| Reutilização | Duplicação de tarefas e projetos, templates de árvores e preservação de relações internas |
| Portabilidade | Exportação `.chronoproject`, importação seletiva, backup verificado e relatórios PDF locais |
| Privacidade | SQLite local, sem telemetria e sem envio automático de dados |

## Instalação

O alvo atual é **Windows 11 x64**.

- **Instalador padrão — recomendado:** usa o WebView2 disponível no Windows e
  baixa o bootstrapper oficial da Microsoft somente quando necessário.
- **Instalador offline:** inclui o redistribuível do WebView2 para instalação sem
  internet.

O aplicativo é instalado para o usuário atual em:

```text
%LOCALAPPDATA%\Chrono Project\
```

Os dados ficam separados do executável:

```text
Banco:   %APPDATA%\chronoproject\chronoproject.sqlite
Backups: %APPDATA%\chronoproject\backups\
Logs:    %LOCALAPPDATA%\chronoproject\logs\
```

Consulte [instalação e manutenção no Windows](docs/installation-windows.md)
antes de atualizar uma instalação antiga ou testar o pacote offline.

## Tecnologia

- Tauri 2 e Rust na integração nativa;
- React e TypeScript estrito na aplicação;
- Vite para desenvolvimento e build;
- SQLite como fonte local de verdade;
- npm com lockfile versionado;
- testes unitários, integração, E2E e desempenho no CI para Windows.

## Desenvolvimento

Pré-requisitos e versões homologadas estão em
[docs/environment.md](docs/environment.md).

```powershell
npm ci
npm run tauri:dev
```

Gates principais:

```powershell
npm run check
npm run test:e2e
npm run test:performance
npm run build

cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo test --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
```

Os dados de desenvolvimento ficam em `.local/`, que é ignorado pelo Git. O
executável de auditoria usa intencionalmente essa base; builds distribuídos usam
o perfil normal do Windows. Veja o
[ADR 012](docs/decisions/012-shared-development-database.md).

## Documentação

- [Roadmap e histórico](docs/roadmap.md)
- [Arquitetura](docs/architecture.md)
- [Modelo de dados](docs/data-model.md)
- [Scheduler, dependências e calendário](docs/scheduling.md)
- [Tabela, Kanban e Gantt](docs/views.md)
- [Importação, exportação e backup](docs/import-export.md)
- [Relatórios PDF](docs/pdf-reports.md)
- [UX e acessibilidade](docs/ux-accessibility.md)
- [Identidade visual](docs/branding.md)
- [Organização pública do GitHub](docs/github-governance.md)
- [Processo de release](docs/release-process.md)
- [Notas da v0.2.6](docs/releases/v0.2.6.md)
- [Decisões arquiteturais](docs/decisions/)

## Estado do projeto

A versão estável mais recente é a
[v0.2.6](https://github.com/machado-jean/chrono-project/releases/tag/v0.2.6).
O produto já cobre o fluxo principal de planejamento local. A validação em uma
máquina Windows limpa e totalmente offline continua sendo o principal gate de
distribuição pendente. Os próximos incrementos planejados incluem marcos,
progresso consolidado, visões salvas, edição em massa e interoperabilidade
CSV/XLSX.

## Contribuição e licença

Relatos de problemas e propostas podem ser enviados pelas
[Issues](https://github.com/machado-jean/chrono-project/issues/new/choose), que
possuem formulários próprios para bugs e melhorias. Antes de uma mudança
estrutural, consulte `AGENTS.md` e as decisões em `docs/decisions/`.

Consulte também [como contribuir](CONTRIBUTING.md), o
[código de conduta](CODE_OF_CONDUCT.md), as opções de [suporte](SUPPORT.md) e a
[política de segurança](SECURITY.md).

O Chrono Project é distribuído sob a [licença MIT](LICENSE). Ao contribuir, você
concorda que sua contribuição seja disponibilizada sob a mesma licença.

As atribuições das dependências incorporadas estão em
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
