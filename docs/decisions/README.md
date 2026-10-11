# Índice de decisões arquiteturais

Architecture Decision Records (ADRs) preservam contexto, decisão e
consequências relevantes. Eles não são documentação descartável: quando uma
decisão muda, registrar a substituição ou criar um novo ADR sem apagar o
histórico.

## Como criar

1. Copie [`template.md`](template.md).
2. Use o próximo número de três dígitos e um nome curto em kebab-case.
3. Preencha status, contexto, decisão, consequências e validação.
4. Registre impacto em dados, compatibilidade e migração.
5. Adicione o novo ADR neste índice e em [`docs/README.md`](../README.md).

## Catálogo

| ADR | Tema | Estado atual |
| --- | --- | --- |
| [001](001-tauri.md) | Tauri 2 | Aceito |
| [002](002-sqlite.md) | SQLite local | Aceito |
| [003](003-typescript-domain.md) | Domínio em TypeScript | Aceito |
| [004](004-date-only.md) | Datas `date-only` | Aceito |
| [005](005-local-first.md) | Arquitetura local-first | Aceito |
| [006](006-no-sync-v1.md) | Sem sincronização na V1 | Aceito |
| [007](007-portuguese-interface.md) | Interface em português | Aceito |
| [008](008-configurable-working-week.md) | Semana útil configurável | Aceito |
| [009](009-fs-scheduling-policy.md) | Política FS reativa | Aceito/revisado |
| [010](010-task-calendar-override.md) | Calendário por tarefa | Aceito |
| [011](011-migration-checksum-compatibility.md) | Compatibilidade de checksum | Aceito |
| [012](012-shared-development-database.md) | Banco compartilhado de desenvolvimento | Aceito |
| [013](013-svar-react-gantt.md) | Renderer Gantt | Aceito |
| [014](014-workspace-task-templates.md) | Templates do workspace | Aceito |
| [015](015-selective-portability.md) | Portabilidade seletiva | Aceito |
| [016](016-offline-holiday-catalog.md) | Feriados offline | Aceito |
| [017](017-windows-distribution.md) | Distribuição Windows | Aceito |
| [018](018-manual-update-check.md) | Consulta manual de atualização | Parcialmente substituído pelo ADR 020 |
| [019](019-webview2-cdp-e2e.md) | E2E e diagnóstico WebView2 | Reavaliado; diagnóstico não bloqueante |
| [020](020-signed-passive-updater.md) | Updater assinado | Implementado |
| [021](021-local-pdf-reports.md) | Relatórios PDF locais | Aceito |
| [022](022-baselines-deadlines.md) | Baseline, prazo e saúde | Aceito |
| [023](023-chrono-project-name.md) | Nome Chrono Project | Aceito |
| [024](024-mechanical-clock-icon.md) | Símbolo de relógio mecânico | Aceito |
| [025](025-summary-predecessors.md) | Resumo como predecessora | Aceito |
| [026](026-persistent-gantt-history.md) | Histórico do Gantt | Aceito |
| [027](027-simplified-application-identifier.md) | Identificador simplificado | Implementado desde 0.2.3 |
| [028](028-task-completion.md) | Conclusão factual | Implementado desde 0.2.3 |
| [029](029-critical-path.md) | Caminho crítico e margem | Aceito |
| [030](030-mit-license.md) | Licença MIT | Implementado |
| [031](031-winget-distribution.md) | Distribuição WinGet | Implementado; submissão em revisão |

O próximo número disponível é **032**.
