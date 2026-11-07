# Índice da documentação

Este arquivo é o catálogo obrigatório da documentação versionada do Chrono
Project. Ele informa para que serve cada documento e quando deve ser revisado.
Todo arquivo Markdown ou texto permanente do repositório deve aparecer aqui.

Ao criar, mover, renomear ou excluir um documento, atualizar este índice na
mesma alteração. Registros históricos não devem ser reescritos apenas para
adotar o formato mais recente.

## Gate documental de release

Antes do commit final de qualquer release, percorrer todas as linhas deste
índice. Para cada documento, registrar na auditoria da branch um dos resultados:

- **Atualizado:** o release alterou seu conteúdo e a revisão foi aplicada;
- **Revisado sem mudança:** o conteúdo continua correto para o release;
- **Não aplicável:** documento histórico ou decisão não afetada, conferido sem
  reescrever o registro.

O handoff do release deve informar o total indexado e a quantidade em cada uma
das três categorias; a soma precisa coincidir com o total informado pelo script.
Arquivos atualizados devem ser listados nominalmente. O gate só termina quando
nenhum item ficou sem leitura. Depois, executar:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1
git diff --check
```

O primeiro comando confirma que todo `.md`, `.txt` e o arquivo `LICENSE`
versionados estão catalogados, valida todos os links internos da documentação,
confere o catálogo de ADRs e impede divergências entre a versão do aplicativo,
os READMEs e a nota do release atual. A mesma verificação integra o check
obrigatório **Windows quality gate**.

A política bilíngue é obrigatória antes de qualquer Pull Request de release.
Além do comando padrão, executar a variante abaixo; ela exige uma versão
`.en.md` para cada documento aplicável:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1 -RequireEnglishPairs
```

## Entrada e regras permanentes

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/README.md`](README.md) | Catálogo e gate de cobertura documental. | Sempre que qualquer documento for criado, movido, renomeado ou removido. |
| [`docs/README.en.md`](README.en.md) | English documentation index and release-coverage entry point. | In the same change as its PT-BR counterpart. |
| [`docs/documentation-language-policy.md`](documentation-language-policy.md) | Convenção e gate de paridade PT-BR/English da documentação. | Toda criação ou atualização documental. |
| [`docs/documentation-language-policy.en.md`](documentation-language-policy.en.md) | English version of the documentation language policy. | In the same change as its PT-BR counterpart. |
| [`AGENTS.md`](../AGENTS.md) | Especificação principal de produto, arquitetura e operação dos agentes. | Toda mudança permanente de requisito, processo, segurança ou release. |
| [`AGENTS.en.md`](../AGENTS.en.md) | English product, architecture, and agent-operation specification. | In the same change as its PT-BR counterpart. |
| [`README.md`](../README.md) | Apresentação pública principal em PT-BR, instalação e estado do produto. | Todo release ou mudança pública de recurso, compatibilidade ou distribuição. |
| [`README.en.md`](../README.en.md) | Apresentação pública equivalente em inglês. | Na mesma alteração do README em PT-BR. |
| [`CHANGELOG.md`](../CHANGELOG.md) | Histórico compacto das versões públicas, com ligação para as notas completas. | Todo release público. |
| [`CHANGELOG.en.md`](../CHANGELOG.en.md) | English changelog. | In the same change as its PT-BR counterpart. |

## Comunidade, licença e GitHub

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Fluxo de contribuição, branches, verificações e Pull Requests. | Mudança de CI, proteção, ferramentas ou processo de contribuição. |
| [`CONTRIBUTING.en.md`](../CONTRIBUTING.en.md) | English contribution guide. | In the same change as its PT-BR counterpart. |
| [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | Regras de convivência e moderação da comunidade. | Mudança de governança ou canal de contato. |
| [`CODE_OF_CONDUCT.en.md`](../CODE_OF_CONDUCT.en.md) | English version of the community code of conduct. | In the same change as its PT-BR counterpart. |
| [`SECURITY.md`](../SECURITY.md) | Política de versões suportadas e relato privado de vulnerabilidades. | Mudança de suporte, risco, updater, importação ou canal de segurança. |
| [`SECURITY.en.md`](../SECURITY.en.md) | English version of the security policy. | In the same change as its PT-BR counterpart. |
| [`SUPPORT.md`](../SUPPORT.md) | Canais e limites do suporte comunitário. | Mudança de Issues, Discussions ou política de atendimento. |
| [`SUPPORT.en.md`](../SUPPORT.en.md) | English version of community support channels and limits. | In the same change as its PT-BR counterpart. |
| [`PRIVACY.md`](../PRIVACY.md) | Política bilíngue de privacidade, armazenamento local e acessos de rede. | Mudança de telemetria, dados locais, rede, atualização ou desinstalação. |
| [`PRIVACY.en.md`](../PRIVACY.en.md) | English version of the privacy policy. | In the same change as its PT-BR counterpart. |
| [`LICENSE`](../LICENSE) | Termos MIT canônicos do código autoral. | Somente por decisão explícita do mantenedor e ADR correspondente. |
| [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) | Atribuições e licenças das dependências distribuídas. | Toda alteração de dependência ou asset redistribuído. |
| [`THIRD_PARTY_NOTICES.en.md`](../THIRD_PARTY_NOTICES.en.md) | English third-party notices and distributed-dependency licences. | In the same change as its PT-BR counterpart. |
| [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) | Evidências e checklist exigidos em Pull Requests. | Mudança de CI, revisão, testes ou governança. |
| [`docs/github-governance.md`](github-governance.md) | Organização pública, proteção da `main`, labels e Dependabot. | Mudança nas configurações ou políticas do GitHub. |
| [`docs/github-governance.en.md`](github-governance.en.md) | English GitHub-governance guide. | In the same change as its PT-BR counterpart. |

## Produto e arquitetura vigente

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/architecture.md`](architecture.md) | Limites das camadas, persistência, fluxo do scheduler e apresentação. | Mudança estrutural, novo subsistema ou fronteira entre camadas. |
| [`docs/architecture.en.md`](architecture.en.md) | English layer boundaries, persistence, scheduler flow, and presentation guide. | In the same change as its PT-BR counterpart. |
| [`docs/user-guide.md`](user-guide.md) | Guia operacional dos principais fluxos do usuário. | Toda mudança pública de interação, comportamento ou atalho. |
| [`docs/user-guide.en.md`](user-guide.en.md) | English guide to the main user workflows. | In the same change as its PT-BR counterpart. |
| [`docs/data-model.md`](data-model.md) | Schema SQLite, entidades, invariantes e evolução das migrations. | Toda migration ou mudança de integridade/persistência. |
| [`docs/data-model.en.md`](data-model.en.md) | English SQLite schema, entities, invariants, and migration evolution. | In the same change as its PT-BR counterpart. |
| [`docs/scheduling.md`](scheduling.md) | Calendários, FS, propagação, transações, caminho crítico e auditoria. | Mudança no scheduler, dependências, calendário ou massa de testes. |
| [`docs/scheduling.en.md`](scheduling.en.md) | English calendars, FS propagation, transactions, critical-path, and audit guide. | In the same change as its PT-BR counterpart. |
| [`docs/views.md`](views.md) | Comportamento compartilhado de Tabela, Kanban, Gantt e filtros. | Mudança visual ou funcional em qualquer view. |
| [`docs/views.en.md`](views.en.md) | English shared Table, Kanban, Gantt, filters, and regression guide. | In the same change as its PT-BR counterpart. |
| [`docs/reuse.md`](reuse.md) | Duplicação de tarefas/projetos e templates. | Mudança de cópia, UUIDs, relações ou templates. |
| [`docs/reuse.en.md`](reuse.en.md) | English guide to duplication and templates. | In the same change as its PT-BR counterpart. |
| [`docs/import-export.md`](import-export.md) | Pacote `.chronoproject`, importação, backup e segurança. | Mudança de schema aceito, formato, limites ou portabilidade. |
| [`docs/import-export.en.md`](import-export.en.md) | English import, export, and backup guide. | In the same change as its PT-BR counterpart. |
| [`docs/pdf-reports.md`](pdf-reports.md) | Tipos, opções, limites e privacidade dos relatórios PDF. | Mudança no conteúdo ou geração de PDF. |
| [`docs/pdf-reports.en.md`](pdf-reports.en.md) | English PDF-report guide. | In the same change as its PT-BR counterpart. |
| [`docs/ux-accessibility.md`](ux-accessibility.md) | Contratos de teclado, foco, contraste e validação acessível. | Mudança de interação, menu, diálogo, atalho ou identidade visual. |
| [`docs/ux-accessibility.en.md`](ux-accessibility.en.md) | English keyboard, focus, contrast, and accessible-validation audit. | In the same change as its PT-BR counterpart. |
| [`docs/decisions/032-interface-localization.md`](decisions/032-interface-localization.md) | Decisão de idiomas locais e limites de tradução da interface. | Inclusão de idioma, novo texto público ou alteração de persistência da preferência. |
| [`docs/decisions/032-interface-localization.en.md`](decisions/032-interface-localization.en.md) | English version of the interface-localisation decision. | In the same change as its PT-BR counterpart. |
| [`docs/decisions/033-internal-brazilian-holiday-catalog.md`](decisions/033-internal-brazilian-holiday-catalog.md) | Catálogo local de feriados brasileiros sem dependência de terceiros. | Alteração das regras nacionais, estaduais ou móveis do catálogo. |
| [`docs/decisions/033-internal-brazilian-holiday-catalog.en.md`](decisions/033-internal-brazilian-holiday-catalog.en.md) | English version of the internal Brazilian holiday-catalog decision. | In the same change as its PT-BR counterpart. |
| [`docs/branding.md`](branding.md) | Marca, ativos, composição do símbolo e uso na interface. | Mudança de logo, ícone, cores ou integração visual. |
| [`docs/branding.en.md`](branding.en.md) | English visual-identity, mark, and interface-system guide. | In the same change as its PT-BR counterpart. |
| [`docs/environment.md`](environment.md) | Toolchain reproduzível, versões e histórico técnico do ambiente. | Toda atualização de Node, npm, Rust, Tauri ou dependência principal. |
| [`docs/environment.en.md`](environment.en.md) | English reproducible toolchain and technical environment record. | In the same change as its PT-BR counterpart. |
| [`docs/roadmap.md`](roadmap.md) | Estado atual, fases e registro cronológico de evolução. | Toda entrega, adiamento, marco ou nova pendência. |
| [`docs/roadmap.en.md`](roadmap.en.md) | English roadmap, phase state, future scope, and evolution-record guide. | In the same change as its PT-BR counterpart. |

## Operação, distribuição e release

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/installation-windows.md`](installation-windows.md) | Instalação, atualização, dados, desinstalação e validação no Windows. | Mudança de instalador, updater, diretório de dados ou requisito final. |
| [`docs/installation-windows.en.md`](installation-windows.en.md) | English Windows installation and maintenance guide. | In the same change as its PT-BR counterpart. |
| [`docs/troubleshooting.md`](troubleshooting.md) | Diagnóstico seguro de abertura, WebView2, dados, migrations e agendamento. | Novo erro recorrente, mudança de recuperação ou canal de suporte. |
| [`docs/troubleshooting.en.md`](troubleshooting.en.md) | English troubleshooting guide. | In the same change as its PT-BR counterpart. |
| [`docs/webview2-testing.md`](webview2-testing.md) | Isolamento, diagnóstico e critérios do E2E desktop/WebView2. | Mudança no harness, runtime, workflow ou evidência de VM/CI. |
| [`docs/webview2-testing.en.md`](webview2-testing.en.md) | English WebView2 desktop-E2E isolation, diagnosis, and promotion criteria. | In the same change as its PT-BR counterpart. |
| [`docs/vm-validation-record.md`](vm-validation-record.md) | Plano e evidências de aceite em Windows 11 limpo. | Cada execução real em VM/máquina limpa ou troca de versão-alvo. |
| [`docs/vm-validation-record.en.md`](vm-validation-record.en.md) | English Windows 11 clean-machine acceptance record. | In the same change as its PT-BR counterpart. |
| [`docs/winget.md`](winget.md) | Identidade, manifests, testes e estado da publicação no WinGet. | Cada submissão, aprovação, nova versão ou mudança de instalador. |
| [`docs/winget.en.md`](winget.en.md) | English WinGet identity, manifests, validation, and publication status. | In the same change as its PT-BR counterpart. |
| [`docs/release-process.md`](release-process.md) | Checklist resumido antes/depois da tag. | Mudança no CI, proteção da `main`, tag ou publicação. |
| [`docs/release-process.en.md`](release-process.en.md) | English pre-tag and post-publication checklist. | In the same change as its PT-BR counterpart. |
| [`docs/release-runbook.md`](release-runbook.md) | Procedimento operacional completo de build, assinatura e publicação. | Toda mudança em script, artefato, assinatura ou responsabilidade. |
| [`docs/release-runbook.en.md`](release-runbook.en.md) | English build, signing, publication, wait, and handoff runbook. | In the same change as its PT-BR counterpart. |
| [`docs/releases/next.md`](releases/next.md) | Rascunho vivo da próxima versão. | Durante todo desenvolvimento posterior à última release. |
| [`docs/releases/next.en.md`](releases/next.en.md) | English living draft for the next release. | In the same change as its PT-BR counterpart. |

## Decisões arquiteturais

ADRs registram o contexto e a decisão da época. Revisar o impacto em todo
release, mas preferir um novo ADR quando uma decisão for substituída; não apagar
o histórico.

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/decisions/README.md`](decisions/README.md) | Catálogo, estado e numeração das decisões arquiteturais. | Toda criação, substituição ou mudança de estado de ADR. |
| [`docs/decisions/README.en.md`](decisions/README.en.md) | English architecture decision catalogue. | In the same change as its PT-BR counterpart. |
| [`docs/decisions/template.md`](decisions/template.md) | Estrutura mínima para registrar uma nova decisão. | Quando o processo ou os campos obrigatórios de ADR mudarem. |
| [`docs/decisions/template.en.md`](decisions/template.en.md) | English template for a new architecture decision. | In the same change as its PT-BR counterpart. |

| ADR | Decisão registrada |
| --- | --- |
| [`001-tauri.md`](decisions/001-tauri.md) | Tauri 2 como shell desktop. |
| [`001-tauri.en.md`](decisions/001-tauri.en.md) | Tauri 2 as the desktop shell. |
| [`002-sqlite.md`](decisions/002-sqlite.md) | SQLite como fonte local de verdade. |
| [`002-sqlite.en.md`](decisions/002-sqlite.en.md) | SQLite as the local source of truth. |
| [`003-typescript-domain.md`](decisions/003-typescript-domain.md) | Regras de domínio em TypeScript puro. |
| [`003-typescript-domain.en.md`](decisions/003-typescript-domain.en.md) | Pure TypeScript domain rules. |
| [`004-date-only.md`](decisions/004-date-only.md) | Datas de cronograma sem horário/timezone. |
| [`004-date-only.en.md`](decisions/004-date-only.en.md) | Schedule dates without time/timezone. |
| [`005-local-first.md`](decisions/005-local-first.md) | Operação local-first e offline. |
| [`005-local-first.en.md`](decisions/005-local-first.en.md) | Local-first and offline operation. |
| [`006-no-sync-v1.md`](decisions/006-no-sync-v1.md) | Ausência de sincronização remota na V1. |
| [`006-no-sync-v1.en.md`](decisions/006-no-sync-v1.en.md) | No remote synchronisation in V1. |
| [`007-portuguese-interface.md`](decisions/007-portuguese-interface.md) | Interface inicial em português. |
| [`007-portuguese-interface.en.md`](decisions/007-portuguese-interface.en.md) | Portuguese interface decision. |
| [`008-configurable-working-week.md`](decisions/008-configurable-working-week.md) | Semana útil configurável. |
| [`008-configurable-working-week.en.md`](decisions/008-configurable-working-week.en.md) | Configurable working week decision. |
| [`009-fs-scheduling-policy.md`](decisions/009-fs-scheduling-policy.md) | Política reativa para dependências FS. |
| [`009-fs-scheduling-policy.en.md`](decisions/009-fs-scheduling-policy.en.md) | FS scheduler policy. |
| [`010-task-calendar-override.md`](decisions/010-task-calendar-override.md) | Calendário específico opcional por tarefa. |
| [`010-task-calendar-override.en.md`](decisions/010-task-calendar-override.en.md) | Effective calendar per task. |
| [`011-migration-checksum-compatibility.md`](decisions/011-migration-checksum-compatibility.md) | Reparo conservador de checksum conhecido. |
| [`011-migration-checksum-compatibility.en.md`](decisions/011-migration-checksum-compatibility.en.md) | Controlled compatibility for migration 3 checksum. |
| [`012-shared-development-database.md`](decisions/012-shared-development-database.md) | Banco compartilhado para builds locais de desenvolvimento. |
| [`012-shared-development-database.en.md`](decisions/012-shared-development-database.en.md) | Shared database for development and local test releases. |
| [`013-svar-react-gantt.md`](decisions/013-svar-react-gantt.md) | SVAR React Gantt como renderer. |
| [`013-svar-react-gantt.en.md`](decisions/013-svar-react-gantt.en.md) | SVAR React Gantt as the temporal projection. |
| [`014-workspace-task-templates.md`](decisions/014-workspace-task-templates.md) | Templates globais do workspace. |
| [`014-workspace-task-templates.en.md`](decisions/014-workspace-task-templates.en.md) | Workspace-wide task-tree templates. |
| [`015-selective-portability.md`](decisions/015-selective-portability.md) | Importação/exportação seletiva e segura. |
| [`015-selective-portability.en.md`](decisions/015-selective-portability.en.md) | SQLite package with aggregate-based selective import. |
| [`016-offline-holiday-catalog.md`](decisions/016-offline-holiday-catalog.md) | Catálogo de feriados sem serviço remoto. |
| [`016-offline-holiday-catalog.en.md`](decisions/016-offline-holiday-catalog.en.md) | Superseded offline holiday catalog decision. |
| [`017-windows-distribution.md`](decisions/017-windows-distribution.md) | Distribuição Windows padrão e offline. |
| [`017-windows-distribution.en.md`](decisions/017-windows-distribution.en.md) | Windows distribution with NSIS and two WebView2 strategies. |
| [`018-manual-update-check.md`](decisions/018-manual-update-check.md) | Consulta manual de atualização; parcialmente substituída pelo ADR 020. |
| [`018-manual-update-check.en.md`](decisions/018-manual-update-check.en.md) | Manual update check through GitHub Releases. |
| [`019-webview2-cdp-e2e.md`](decisions/019-webview2-cdp-e2e.md) | E2E em camadas e diagnóstico da janela real. |
| [`019-webview2-cdp-e2e.en.md`](decisions/019-webview2-cdp-e2e.en.md) | Layered E2E and Tauri-window diagnostics. |
| [`020-signed-passive-updater.md`](decisions/020-signed-passive-updater.md) | Updater passivo assinado. |
| [`020-signed-passive-updater.en.md`](decisions/020-signed-passive-updater.en.md) | Signed passive updater. |
| [`021-local-pdf-reports.md`](decisions/021-local-pdf-reports.md) | Relatórios PDF gerados localmente. |
| [`021-local-pdf-reports.en.md`](decisions/021-local-pdf-reports.en.md) | Local vector PDF reports. |
| [`022-baselines-deadlines.md`](decisions/022-baselines-deadlines.md) | Planos de referência, prazos e saúde. |
| [`022-baselines-deadlines.en.md`](decisions/022-baselines-deadlines.en.md) | Immutable baselines and informative deadlines. |
| [`023-chrono-project-name.md`](decisions/023-chrono-project-name.md) | Nome definitivo Chrono Project. |
| [`023-chrono-project-name.en.md`](decisions/023-chrono-project-name.en.md) | Chrono Project as product identity. |
| [`024-mechanical-clock-icon.md`](decisions/024-mechanical-clock-icon.md) | Relógio mecânico como símbolo visual. |
| [`024-mechanical-clock-icon.en.md`](decisions/024-mechanical-clock-icon.en.md) | Mechanical clock as the visual symbol. |
| [`025-summary-predecessors.md`](decisions/025-summary-predecessors.md) | Tarefas-resumo permitidas como predecessoras. |
| [`025-summary-predecessors.en.md`](decisions/025-summary-predecessors.en.md) | Summary task as an FS predecessor. |
| [`026-persistent-gantt-history.md`](decisions/026-persistent-gantt-history.md) | Histórico persistente original do Gantt. |
| [`026-persistent-gantt-history.en.md`](decisions/026-persistent-gantt-history.en.md) | Persistent Gantt editing history. |
| [`027-simplified-application-identifier.md`](decisions/027-simplified-application-identifier.md) | Identificador Tauri simplificado. |
| [`027-simplified-application-identifier.en.md`](decisions/027-simplified-application-identifier.en.md) | Simplified application identifier. |
| [`028-task-completion.md`](decisions/028-task-completion.md) | Data factual e confirmação da conclusão. |
| [`028-task-completion.en.md`](decisions/028-task-completion.en.md) | Factual task completion. |
| [`029-critical-path.md`](decisions/029-critical-path.md) | Caminho crítico, folga e margem da meta. |
| [`029-critical-path.en.md`](decisions/029-critical-path.en.md) | Critical path and project-target margin. |
| [`030-mit-license.md`](decisions/030-mit-license.md) | Licenciamento MIT. |
| [`030-mit-license.en.md`](decisions/030-mit-license.en.md) | Public MIT licence. |
| [`031-winget-distribution.md`](decisions/031-winget-distribution.md) | Identidade e estratégia de distribuição WinGet. |
| [`031-winget-distribution.en.md`](decisions/031-winget-distribution.en.md) | Public distribution through WinGet. |
| [`033-internal-brazilian-holiday-catalog.md`](decisions/033-internal-brazilian-holiday-catalog.md) | Catálogo brasileiro interno de feriados. |

## Notas históricas de release

Esses documentos são registros imutáveis do que foi preparado ou publicado em
cada versão. No checklist, conferir coerência e links; não modernizar texto ou
preencher lacunas históricas sem uma correção factual explícita.

| Documento | Marco principal |
| --- | --- |
| [`v0.1.5.md`](releases/v0.1.5.md) | Infraestrutura de testes e atualização do ProjectFlow. |
| [`v0.1.6.md`](releases/v0.1.6.md) | Usabilidade e acessibilidade da janela desktop. |
| [`v0.1.7.md`](releases/v0.1.7.md) | Relatórios PDF e preparação local. |
| [`v0.1.8.md`](releases/v0.1.8.md) | Controle do plano e schema 5. |
| [`v0.2.0.md`](releases/v0.2.0.md) | Renomeação para Chrono Project. |
| [`v0.2.1.md`](releases/v0.2.1.md) | Identidade visual definitiva. |
| [`v0.2.2.md`](releases/v0.2.2.md) | Edição segura, autosave e produtividade. |
| [`v0.2.3.md`](releases/v0.2.3.md) | Conclusão factual e identificador `chronoproject`. |
| [`v0.2.4.md`](releases/v0.2.4.md) | Coluna Tarefa ajustável e exportação contextual. |
| [`v0.2.5.md`](releases/v0.2.5.md) | Interface Windows mais coesa. |
| [`v0.2.6.md`](releases/v0.2.6.md) | Predecessoras em lote, histórico e caminho crítico. |
| [`v0.2.7.md`](releases/v0.2.7.md) | Governança pública, publisher Windows e preparação WinGet. |
| [`v0.2.8.md`](releases/v0.2.8.md) | Fluidez de Tabela e Gantt e rolagem persistente. |
| [`v0.2.9.md`](releases/v0.2.9.md) | Relatórios PDF críticos, importação estável e atualização coordenada de dependências. |
| [`v0.3.0.md`](releases/v0.3.0.md) | Localização PT-BR/EN, catálogo interno de feriados e hardening de dependências. |
| [`v0.3.0.en.md`](releases/v0.3.0.en.md) | English release notes for v0.3.0. |

## Testes e fixtures

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`tests/e2e/README.md`](../tests/e2e/README.md) | Gate E2E em camadas e diagnóstico desktop. | Mudança de cenário, harness, isolamento ou promoção ao CI. |
| [`tests/integration/README.md`](../tests/integration/README.md) | Localização e fronteira dos testes de integração. | Mudança de estratégia ou criação de suíte neste diretório. |
| [`tests/fixtures/README.md`](../tests/fixtures/README.md) | Regras para fixtures versionáveis e dados seguros. | Inclusão de fixture, banco ou pacote de teste. |

## Configurações públicas relacionadas

Estes arquivos não são documentação Markdown, mas suas mudanças normalmente
exigem revisar as seções correspondentes deste índice:

- `.github/ISSUE_TEMPLATE/`: formulários e canais de entrada;
- `.github/CODEOWNERS`: propriedade de revisão;
- `.github/dependabot.yml`: política de atualizações;
- `.github/workflows/ci.yml`: gate obrigatório **Windows quality gate**;
- `.github/workflows/desktop-e2e.yml`: diagnóstico manual da janela;
- `package.json`, `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`: versões,
  comandos, identidade e dependências principais;
- `packaging/winget/`: manifests públicos do catálogo WinGet.
