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

## Entrada e regras permanentes

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/README.md`](README.md) | Catálogo e gate de cobertura documental. | Sempre que qualquer documento for criado, movido, renomeado ou removido. |
| [`AGENTS.md`](../AGENTS.md) | Especificação principal de produto, arquitetura e operação dos agentes. | Toda mudança permanente de requisito, processo, segurança ou release. |
| [`README.md`](../README.md) | Apresentação pública principal em PT-BR, instalação e estado do produto. | Todo release ou mudança pública de recurso, compatibilidade ou distribuição. |
| [`README.en.md`](../README.en.md) | Apresentação pública equivalente em inglês. | Na mesma alteração do README em PT-BR. |
| [`CHANGELOG.md`](../CHANGELOG.md) | Histórico compacto das versões públicas, com ligação para as notas completas. | Todo release público. |

## Comunidade, licença e GitHub

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Fluxo de contribuição, branches, verificações e Pull Requests. | Mudança de CI, proteção, ferramentas ou processo de contribuição. |
| [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | Regras de convivência e moderação da comunidade. | Mudança de governança ou canal de contato. |
| [`SECURITY.md`](../SECURITY.md) | Política de versões suportadas e relato privado de vulnerabilidades. | Mudança de suporte, risco, updater, importação ou canal de segurança. |
| [`SUPPORT.md`](../SUPPORT.md) | Canais e limites do suporte comunitário. | Mudança de Issues, Discussions ou política de atendimento. |
| [`PRIVACY.md`](../PRIVACY.md) | Política bilíngue de privacidade, armazenamento local e acessos de rede. | Mudança de telemetria, dados locais, rede, atualização ou desinstalação. |
| [`LICENSE`](../LICENSE) | Termos MIT canônicos do código autoral. | Somente por decisão explícita do mantenedor e ADR correspondente. |
| [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) | Atribuições e licenças das dependências distribuídas. | Toda alteração de dependência ou asset redistribuído. |
| [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) | Evidências e checklist exigidos em Pull Requests. | Mudança de CI, revisão, testes ou governança. |
| [`docs/github-governance.md`](github-governance.md) | Organização pública, proteção da `main`, labels e Dependabot. | Mudança nas configurações ou políticas do GitHub. |

## Produto e arquitetura vigente

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/architecture.md`](architecture.md) | Limites das camadas, persistência, fluxo do scheduler e apresentação. | Mudança estrutural, novo subsistema ou fronteira entre camadas. |
| [`docs/user-guide.md`](user-guide.md) | Guia operacional dos principais fluxos do usuário. | Toda mudança pública de interação, comportamento ou atalho. |
| [`docs/data-model.md`](data-model.md) | Schema SQLite, entidades, invariantes e evolução das migrations. | Toda migration ou mudança de integridade/persistência. |
| [`docs/scheduling.md`](scheduling.md) | Calendários, FS, propagação, transações, caminho crítico e auditoria. | Mudança no scheduler, dependências, calendário ou massa de testes. |
| [`docs/views.md`](views.md) | Comportamento compartilhado de Tabela, Kanban, Gantt e filtros. | Mudança visual ou funcional em qualquer view. |
| [`docs/reuse.md`](reuse.md) | Duplicação de tarefas/projetos e templates. | Mudança de cópia, UUIDs, relações ou templates. |
| [`docs/import-export.md`](import-export.md) | Pacote `.chronoproject`, importação, backup e segurança. | Mudança de schema aceito, formato, limites ou portabilidade. |
| [`docs/pdf-reports.md`](pdf-reports.md) | Tipos, opções, limites e privacidade dos relatórios PDF. | Mudança no conteúdo ou geração de PDF. |
| [`docs/ux-accessibility.md`](ux-accessibility.md) | Contratos de teclado, foco, contraste e validação acessível. | Mudança de interação, menu, diálogo, atalho ou identidade visual. |
| [`docs/branding.md`](branding.md) | Marca, ativos, composição do símbolo e uso na interface. | Mudança de logo, ícone, cores ou integração visual. |
| [`docs/environment.md`](environment.md) | Toolchain reproduzível, versões e histórico técnico do ambiente. | Toda atualização de Node, npm, Rust, Tauri ou dependência principal. |
| [`docs/roadmap.md`](roadmap.md) | Estado atual, fases e registro cronológico de evolução. | Toda entrega, adiamento, marco ou nova pendência. |

## Operação, distribuição e release

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/installation-windows.md`](installation-windows.md) | Instalação, atualização, dados, desinstalação e validação no Windows. | Mudança de instalador, updater, diretório de dados ou requisito final. |
| [`docs/troubleshooting.md`](troubleshooting.md) | Diagnóstico seguro de abertura, WebView2, dados, migrations e agendamento. | Novo erro recorrente, mudança de recuperação ou canal de suporte. |
| [`docs/webview2-testing.md`](webview2-testing.md) | Isolamento, diagnóstico e critérios do E2E desktop/WebView2. | Mudança no harness, runtime, workflow ou evidência de VM/CI. |
| [`docs/vm-validation-record.md`](vm-validation-record.md) | Plano e evidências de aceite em Windows 11 limpo. | Cada execução real em VM/máquina limpa ou troca de versão-alvo. |
| [`docs/winget.md`](winget.md) | Identidade, manifests, testes e estado da publicação no WinGet. | Cada submissão, aprovação, nova versão ou mudança de instalador. |
| [`docs/release-process.md`](release-process.md) | Checklist resumido antes/depois da tag. | Mudança no CI, proteção da `main`, tag ou publicação. |
| [`docs/release-runbook.md`](release-runbook.md) | Procedimento operacional completo de build, assinatura e publicação. | Toda mudança em script, artefato, assinatura ou responsabilidade. |
| [`docs/releases/next.md`](releases/next.md) | Rascunho vivo da próxima versão. | Durante todo desenvolvimento posterior à última release. |

## Decisões arquiteturais

ADRs registram o contexto e a decisão da época. Revisar o impacto em todo
release, mas preferir um novo ADR quando uma decisão for substituída; não apagar
o histórico.

| Documento | Para que serve | Revisar quando |
| --- | --- | --- |
| [`docs/decisions/README.md`](decisions/README.md) | Catálogo, estado e numeração das decisões arquiteturais. | Toda criação, substituição ou mudança de estado de ADR. |
| [`docs/decisions/template.md`](decisions/template.md) | Estrutura mínima para registrar uma nova decisão. | Quando o processo ou os campos obrigatórios de ADR mudarem. |

| ADR | Decisão registrada |
| --- | --- |
| [`001-tauri.md`](decisions/001-tauri.md) | Tauri 2 como shell desktop. |
| [`002-sqlite.md`](decisions/002-sqlite.md) | SQLite como fonte local de verdade. |
| [`003-typescript-domain.md`](decisions/003-typescript-domain.md) | Regras de domínio em TypeScript puro. |
| [`004-date-only.md`](decisions/004-date-only.md) | Datas de cronograma sem horário/timezone. |
| [`005-local-first.md`](decisions/005-local-first.md) | Operação local-first e offline. |
| [`006-no-sync-v1.md`](decisions/006-no-sync-v1.md) | Ausência de sincronização remota na V1. |
| [`007-portuguese-interface.md`](decisions/007-portuguese-interface.md) | Interface inicial em português. |
| [`008-configurable-working-week.md`](decisions/008-configurable-working-week.md) | Semana útil configurável. |
| [`009-fs-scheduling-policy.md`](decisions/009-fs-scheduling-policy.md) | Política reativa para dependências FS. |
| [`010-task-calendar-override.md`](decisions/010-task-calendar-override.md) | Calendário específico opcional por tarefa. |
| [`011-migration-checksum-compatibility.md`](decisions/011-migration-checksum-compatibility.md) | Reparo conservador de checksum conhecido. |
| [`012-shared-development-database.md`](decisions/012-shared-development-database.md) | Banco compartilhado para builds locais de desenvolvimento. |
| [`013-svar-react-gantt.md`](decisions/013-svar-react-gantt.md) | SVAR React Gantt como renderer. |
| [`014-workspace-task-templates.md`](decisions/014-workspace-task-templates.md) | Templates globais do workspace. |
| [`015-selective-portability.md`](decisions/015-selective-portability.md) | Importação/exportação seletiva e segura. |
| [`016-offline-holiday-catalog.md`](decisions/016-offline-holiday-catalog.md) | Catálogo de feriados sem serviço remoto. |
| [`017-windows-distribution.md`](decisions/017-windows-distribution.md) | Distribuição Windows padrão e offline. |
| [`018-manual-update-check.md`](decisions/018-manual-update-check.md) | Consulta manual de atualização; parcialmente substituída pelo ADR 020. |
| [`019-webview2-cdp-e2e.md`](decisions/019-webview2-cdp-e2e.md) | E2E em camadas e diagnóstico da janela real. |
| [`020-signed-passive-updater.md`](decisions/020-signed-passive-updater.md) | Updater passivo assinado. |
| [`021-local-pdf-reports.md`](decisions/021-local-pdf-reports.md) | Relatórios PDF gerados localmente. |
| [`022-baselines-deadlines.md`](decisions/022-baselines-deadlines.md) | Planos de referência, prazos e saúde. |
| [`023-chrono-project-name.md`](decisions/023-chrono-project-name.md) | Nome definitivo Chrono Project. |
| [`024-mechanical-clock-icon.md`](decisions/024-mechanical-clock-icon.md) | Relógio mecânico como símbolo visual. |
| [`025-summary-predecessors.md`](decisions/025-summary-predecessors.md) | Tarefas-resumo permitidas como predecessoras. |
| [`026-persistent-gantt-history.md`](decisions/026-persistent-gantt-history.md) | Histórico persistente original do Gantt. |
| [`027-simplified-application-identifier.md`](decisions/027-simplified-application-identifier.md) | Identificador Tauri simplificado. |
| [`028-task-completion.md`](decisions/028-task-completion.md) | Data factual e confirmação da conclusão. |
| [`029-critical-path.md`](decisions/029-critical-path.md) | Caminho crítico, folga e margem da meta. |
| [`030-mit-license.md`](decisions/030-mit-license.md) | Licenciamento MIT. |
| [`031-winget-distribution.md`](decisions/031-winget-distribution.md) | Identidade e estratégia de distribuição WinGet. |

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
