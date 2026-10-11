# Roadmap e registro de evolução

Este é o registro vivo de execução do Chrono Project. Ele traduz o roadmap definido em `AGENTS.md` em fases acompanháveis, checkpoints verificáveis e um histórico cronológico das entregas.

`AGENTS.md` continua sendo a fonte de verdade para produto, arquitetura e regras operacionais. Este documento não substitui a especificação e não deve introduzir escopo incompatível com ela.

Última atualização: **10 de outubro de 2026**.

## Como manter este documento

Estados utilizados:

- **Concluída:** todos os critérios de saída da fase foram comprovados.
- **Em andamento:** existe trabalho ativo e delimitado na fase.
- **Planejada:** o escopo está previsto, mas ainda não começou.
- **Bloqueada:** há um impedimento explícito registrado no histórico.
- **Decisão pendente:** o avanço depende de uma escolha de arquitetura, integridade de dados ou stack.

Ao concluir uma entrega:

1. atualizar o estado e os itens da fase afetada;
2. registrar evidências, testes e migrations aplicáveis;
3. acrescentar uma entrada no histórico sem apagar entradas anteriores;
4. associar o commit ou escrever `não commitado`;
5. registrar decisões relevantes em ADR;
6. indicar o próximo incremento recomendado.

Não usar percentuais subjetivos. O progresso deve ser demonstrado por entregáveis e validações.

## Estado atual

| Item | Estado |
| --- | --- |
| Etapa do produto | Candidato 0.2.6 em validação final |
| Fase ativa | Hardening e distribuição Windows |
| Próxima fase | Validar manualmente e gerar os artefatos da v0.2.6 |
| Versão da aplicação | `0.2.6` |
| Versão do schema SQLite | `9` |
| Último commit de referência | `8d1e6d3` — publicação da v0.2.5 |
| Branch de trabalho | `main`; candidato 0.2.6 ainda não commitado |
| Checkpoints obrigatórios | A, B, C e D concluídos; E em validação |
| Funcionalidades de negócio | Core, scheduler, views, reutilização e portabilidade implementados |

## Visão geral das fases

| Fase | Objetivo | Estado | Checkpoint Git | Critério principal de saída |
| --- | --- | --- | --- | --- |
| 0 — Ambiente | Preparar e documentar o toolchain Windows | Concluída | 1 | Pré-requisitos oficiais instalados e validados |
| 1 — Fundação | Criar shell, qualidade, persistência e documentação | Concluída | 1 e 2 | Aplicação vazia executa, testes passam e SQLite migra |
| 2 — Core | Implementar Project, Task, hierarquia e Tabela inicial | Concluída | 3 | Core persistido e editável com integridade e testes |
| 3 — Scheduling | Implementar calendário, dependência FS e propagação | Concluída | 4 | Scheduler FS estável e coberto pelos casos obrigatórios |
| 4 — Views | Entregar Kanban, Gantt e filtros sincronizados | Concluída | 5 | As views projetam a mesma tarefa sem duplicar dados |
| 5 — Reutilização | Entregar duplicação e templates | Concluída | 6 | Árvores e relações internas são recriadas com novos UUIDs |
| 6 — Portabilidade | Entregar exportação, importação e backup | Concluída | 7 | Round-trip preserva semanticamente o workspace |
| 7 — Hardening e distribuição | Preparar o produto para uso real no Windows | Em andamento | 8 | Instalador e operação offline validados em máquina limpa |
| 8 — Controle do plano | Baseline, desvios, prazos-limite e saúde | Concluída | 9 | O plano aprovado pode ser comparado ao cronograma corrente |
| 9 — Identidade visual | Novo ícone profissional e aplicação consistente da marca | Em andamento | 10 | Aplicativo, instaladores e artefatos exibem a identidade aprovada |
| 10 — Análise do cronograma | Caminho crítico, folgas e explicabilidade | Em andamento | 11 | O usuário identifica e entende as tarefas que controlam o término |
| 11 — Progresso e marcos | Marcos e consolidação automática de progresso | Planejada | 12 | Progresso e eventos-chave são coerentes na hierarquia e nas views |
| 12 — Produtividade | Visões salvas, edição em massa e histórico global | Planejada | 13 | Operações frequentes são rápidas, reversíveis e acessíveis |
| 13 — Interoperabilidade | Importação e exportação CSV/XLSX | Planejada | 14 | Dados tabulares transitam com prévia, validação e relatório de erros |

## Fase 0 — Ambiente

Estado: **Concluída**.

- [x] Inspecionar Git, Node, npm, Rust, Cargo, Rustup e requisitos do Tauri.
- [x] Consultar documentação oficial e selecionar versões compatíveis.
- [x] Preservar Git e WebView2 existentes por já estarem adequados.
- [x] Instalar Node.js LTS, Rust MSVC e Visual Studio Build Tools necessários.
- [x] Validar Windows SDK, MSVC e WebView2.
- [x] Registrar versões, origens, hashes e comandos.

Evidência principal: [environment.md](environment.md).

Critério de saída atendido: o ambiente reproduzível permite compilar Tauri 2 no Windows 11 x64.

## Fase 1 — Fundação

Estado: **Concluída**.

- [x] Criar scaffold Tauri 2 + React + TypeScript + Vite com npm.
- [x] Configurar TypeScript estrito e ESLint type-aware.
- [x] Configurar Vitest, Testing Library e CI para Windows.
- [x] Adicionar SQLite embarcado e migration técnica inicial.
- [x] Adicionar logging local.
- [x] Criar a estrutura de módulos prevista em `AGENTS.md`.
- [x] Criar documentação de arquitetura, dados, scheduling e importação/exportação.
- [x] Registrar ADRs das decisões fundamentais.
- [x] Validar lint, typecheck, testes, Rust, Clippy e build de release.
- [x] Executar a aplicação vazia e confirmar banco e log fora do Git.

Evidências principais:

- [architecture.md](architecture.md)
- [data-model.md](data-model.md)
- [migration inicial](../src-tauri/migrations/0001_initial.sql)
- [workflow de CI](../.github/workflows/ci.yml)

Critério de saída atendido: Checkpoints A, B, C e D confirmados, sem regras de negócio implementadas prematuramente.

## Fase 2 — Core

Estado: **Concluída**.

Ordem recomendada:

- [x] Detalhar o modelo de Project e Task antes da primeira migration de negócio.
- [x] Definir contratos, invariantes e erros explícitos em TypeScript puro.
- [x] Criar migration versionada para calendários, Project, Task e tags.
- [x] Testar banco novo e upgrade do schema anterior.
- [x] Implementar repositories e transações SQLite.
- [x] Implementar criação, edição, arquivamento e exclusão segura de projetos.
- [x] Implementar tarefas, status, prioridade, progresso, datas e duração.
- [x] Concluir ordenação/reordenação de projetos e tarefas na interface.
- [x] Implementar hierarquia, troca de pai e prevenção de ciclos de parentesco.
- [x] Estabelecer estado único compartilhável pelas views.
- [x] Entregar a primeira Tabela editável, com hierarquia e controles nativos de teclado.
- [x] Cobrir domínio, repositories, persistência e fluxos principais de UI.
- [x] Atualizar documentação e schema version.

Critérios de saída:

- Project e Task persistem sem perda de integridade.
- Hierarquia inválida é rejeitada antes da escrita.
- A Tabela permite criar e editar o núcleo dos dados.
- Banco novo e upgrade são testados.
- Lint, typecheck, testes e build passam.

Critério de saída atendido: o Core persiste com integridade, rejeita hierarquia
inválida, permite edição e reordenação na Tabela, migra bancos existentes e
passa pelos gates de qualidade. O Checkpoint Git 3 foi consolidado no commit
`1b3e9c6`.

## Fase 3 — Scheduling

Estado: **Concluída**.

- [x] Implementar datas `date-only` e calendário de trabalho em TypeScript puro.
- [x] Implementar fins de semana, feriados e exceções.
- [x] Implementar duração inclusiva em dias úteis.
- [x] Implementar edição assistida entre início, fim e duração.
- [x] Implementar grafo, detecção de ciclo e ordenação topológica.
- [x] Implementar dependência FS com lag e múltiplos predecessores.
- [x] Restringir dependências ao mesmo projeto; sucessoras permanecem folhas e
  predecessoras podem ser folhas ou resumos conforme o ADR 025.
- [x] Implementar modos AUTO e MANUAL com conflitos informativos.
- [x] Implementar calendário opcional por tarefa e opção **Todos os dias**.
- [x] Implementar propagação reativa para frente e para trás em tarefas `AUTO`.
- [x] Recalcular e bloquear edição direta de tarefas-resumo.
- [x] Persistir calendário, relações e recalculações em transação.
- [x] Cobrir todos os 15 casos obrigatórios do scheduler.
- [x] Atualizar documentação e ADRs 009–010.

Critério de saída atendido: scheduler FS determinístico e isolado da UI, com
calendário efetivo, cadeia, ciclos, MANUAL/AUTO, resumos e rollback cobertos.

## Fase 4 — Views

Estado: **Concluída; pronta para commit local**.

- [x] Implementar Kanban por status com alternativa acessível ao drag-and-drop.
- [x] Implementar busca e filtros mínimos.
- [x] Avaliar biblioteca de Gantt por licença, manutenção, TypeScript, desempenho, acessibilidade e bundle.
- [x] Registrar a escolha de Gantt em ADR antes da integração.
- [x] Implementar Gantt com hierarquia, dependências e tarefas-resumo.
- [x] Garantir atualização imediata entre Tabela, Kanban e Gantt.
- [x] Validar que nenhuma view mantém uma cópia persistida de Task.
- [x] Cobrir interação e sincronização entre views.

Critério de saída atendido: as três views operam sobre a mesma fonte de verdade,
os filtros são compartilhados, o Gantt delega alterações ao scheduler e a
sincronização entre Kanban e Tabela está coberta por testes de UI.

Melhorias de UX não bloqueantes, como ação **Hoje**, enquadramento automático
do projeto, navegação entre as pontas de uma relação e densidade compacta do
Kanban, permanecem em backlog. Marcos, baseline e caminho crítico exigirão
decisões próprias e não fazem parte deste checkpoint.

## Fase 5 — Reutilização

Estado: **Concluída; pronta para auditoria e commit local**.

- [x] Duplicar tarefa isolada.
- [x] Duplicar tarefa com descendentes.
- [x] Reconstruir `parent_id` usando mapa de UUIDs.
- [x] Preservar dependências internas e omitir externas por padrão.
- [x] Duplicar projeto.
- [x] Criar, persistir, aplicar e excluir templates globais.
- [x] Validar hierarquia e grafo antes de confirmar a transação.
- [x] Cobrir duplicação, identidade, persistência e rollback com testes.

Critério de saída atendido: cópias são independentes, mantêm estrutura interna
válida, omitem relações externas e nunca compartilham identidade com a origem.

## Fase 6 — Portabilidade

Estado: **Concluída; pronta para auditoria e commit local**.

- [x] Finalizar e documentar o formato `.chronoproject`.
- [x] Exportar projeto.
- [x] Exportar workspace completo.
- [x] Validar manifest, schema, versão, integridade, tamanho e entradas.
- [x] Impedir path traversal e execução de conteúdo importado.
- [x] Importar projetos e templates selecionados por staging e transação.
- [x] Atualizar projeto por UUID ou importar como cópia remapeada.
- [x] Criar backup automático antes de importação e restauração.
- [x] Implementar backup e restore locais.
- [x] Testar round-trip semântico em workspace vazio.
- [x] Atualizar [import-export.md](import-export.md) e ADR 015.

Critério de saída atendido: exportação e importação preservam semanticamente os dados selecionados, não alteram projetos ignorados e falhas relevantes revertem a operação inteira.

## Fase 7 — Hardening e distribuição Windows

Estado: **Em andamento**.

- [x] Medir 1.000 tarefas por projeto e 10.000 por workspace.
- [x] Avaliar virtualização e processamento nos cenários medidos; nenhuma alteração necessária neste checkpoint.
- [x] Revisar UX desktop, atalhos, foco, contraste e mensagens de erro.
- [x] Implementar verificação manual de release e acesso aos instaladores permanentes.
- [x] Implementar e executar o fluxo E2E mínimo.
- [x] Avaliar e documentar MSI/NSIS e estratégia WebView2 offline.
- [x] Gerar build release Windows x64 e instaladores padrão/offline.
- [x] Definir e referenciar a matriz de validação WebView2/E2E desktop.
- [x] Isolar User Data Folder e porta CDP por execução no harness desktop.
- [x] Validar cinco inicializações consecutivas com verificação dos processos do perfil.
- [ ] Testar instalação em máquina Windows limpa sem toolchain.
- [ ] Validar funcionamento integralmente offline.
- [ ] Validar preservação de dados em atualização, reinstalação e desinstalação.
- [x] Documentar instalação, atualização, desinstalação e recuperação.

Critério de saída: Checkpoint E concluído e critérios de aceite do MVP verificados em ambiente limpo.

## Roadmap consolidado pós-MVP

As fases seguintes ampliam o planejamento sem transformar o Chrono Project em
sistema de apontamento de horas, gestão de pessoas ou colaboração online. A
ordem é deliberada: primeiro registrar o plano aprovado, depois explicar seus
riscos, consolidar o progresso e somente então aumentar produtividade e
interoperabilidade.

Os números de versão abaixo são alvos de planejamento, não compromissos de
release. Cada fase deve ser auditada e encerrada antes do início da seguinte.

## Fase 8 — Controle do plano

Estado: **Concluída**. Versão: `0.1.8`.

### Escopo

- Criar um plano de referência nomeado do projeto, com confirmação explícita.
- Preservar no plano início, fim, duração e progresso das tarefas existentes.
- Comparar plano de referência e cronograma corrente sem alterar o scheduler.
- Exibir início/fim planejados, atuais e desvio em dias úteis na Tabela.
- Desenhar as barras do plano atrás das barras correntes no Gantt.
- Incluir a comparação nos relatórios PDF quando solicitado.
- Adicionar prazo-limite opcional, separado da data final agendada.
- Classificar tarefas de forma explicável como dentro do prazo, em risco ou
  atrasadas, sem deslocá-las automaticamente.
- Permitir atualizar o plano somente com confirmação e manter ao menos a
  data de criação da fotografia substituída no histórico do projeto.
- Permitir excluir o plano e todas as revisões com confirmação, preservando as
  tarefas e o cronograma atuais.
- Limitar a árvore a quatro níveis e melhorar o aproveitamento de espaço com a
  barra de projetos recolhível.

### Integridade e testes obrigatórios

- Migration aditiva, teste de banco novo e upgrade do schema atual.
- Exportação, importação, backup, restore, duplicação de projeto e templates
  revisados quanto aos novos dados.
- Comparação em dias úteis respeitando calendário e exceções do projeto.
- Plano de referência imutável durante edições comuns; alterações correntes não podem
  modificar silenciosamente a fotografia aprovada.
- Testes de Tabela, Gantt, PDF e round-trip `.chronoproject`.

### Critério de saída

O usuário consegue congelar o plano, alterar o cronograma e entender claramente
o que mudou, por quanto tempo e se algum prazo-limite foi comprometido.

Critério atendido em 12/09/2026. A auditoria final também validou a hierarquia
máxima em um projeto de 205 tarefas, datas e predecessoras relevantes, Kanban,
Gantt e navegação completa por roda e barras independentes.

## Fase 9 — Identidade visual e ícone do aplicativo

Estado: **Implementada; validação de distribuição pendente**. Versão-alvo:
`0.2.1`.

### Escopo

- Definir uma direção visual profissional, moderna e sóbria para o Chrono Project.
- Criar propostas de ícone baseadas em fluxo estruturado, cronograma e marco,
  evitando símbolos genéricos ou excessivamente abstratos.
- Validar legibilidade em tamanhos pequenos, contraste e reconhecimento na barra
  de tarefas, menu Iniciar, atalhos, janela e lista de aplicativos do Windows.
- Escolher a proposta com aprovação do usuário e gerar o conjunto oficial de
  ícones exigido pelo Tauri/Windows.
- Substituir o marcador provisório `PF` na aplicação quando a composição visual
  aprovada permitir, mantendo nome e acessibilidade textual.
- Aplicar a identidade aos instaladores, executável, metadados e documentação de
  distribuição sem alterar identidade do aplicativo ou localização dos dados.
- Estender a identidade para um sistema de interface autoral, reconhecível mesmo
  sem o logotipo e diferente de dashboards genéricos ou templates recorrentes
  de aplicações geradas por IA.
- Definir tokens e padrões próprios para densidade, tipografia, cores, bordas,
  raios, elevação, ícones e movimento, preservando a produtividade desktop.
- Evitar excesso de cartões, `pills`, gradientes, sombras e espaços vazios sem
  função operacional.

### Integridade e testes obrigatórios

- Manter os arquivos-fonte editáveis e documentar cores, margens e variantes.
- Verificar visualmente os tamanhos usados pelo Windows, inclusive 16, 24, 32,
  48, 128 e 256 pixels e telas com escala ampliada.
- Recompilar executável e instaladores padrão/offline e confirmar que assinatura
  do updater, atualização e preservação de dados continuam funcionando.
- Validar instalação limpa, atualização sobre versão anterior e ícone nos pontos
  de integração do Windows antes de encerrar a fase.

### Critério de saída

O Chrono Project possui um ícone aprovado, reconhecível e consistente na interface,
no Windows e nos artefatos de distribuição, sem regressão funcional.

Em uma evolução posterior, a própria interface deve continuar reconhecível como
Chrono sem depender do ícone: original, coesa e relacionada a precisão e tempo,
sem copiar outro produto nem sacrificar densidade ou acessibilidade.

O símbolo, a interface e os derivados Tauri foram implementados em 24/09/2026.
Os executáveis e instaladores padrão/offline `0.2.1` foram gerados, assinados e
validados localmente em 25/09/2026. O encerramento da fase ainda depende da
atualização manual sobre `0.2.0` e da inspeção dos pontos de integração do
Windows.

### Próxima revisão visual da interface

Antes de uma reformulação ampla, criar um inventário das telas e componentes
atuais, identificar padrões genéricos ou inconsistentes e propor duas ou três
telas-piloto com dados reais. A direção escolhida deve ser aplicada por sistema
de componentes, não por retoques isolados. A validação deve cobrir Tabela densa,
Kanban, Gantt, diálogos, estados vazios, largura mínima, escalas de 125%/150%,
teclado e contraste.

## Incremento transversal — Estabilidade e produtividade pós-0.2.1

Estado: **Em andamento**. Versão-alvo: **a definir**.

Este incremento reúne revisões observadas no uso real da Tabela e do Gantt. A
ordem prioriza estabilidade, depois fluidez de edição e, por último, mudanças
de domínio no scheduler.

### Etapa 1 — Segurança na edição de datas

Estado: **Concluída localmente; não commitada**.

- [x] impedir que anos parciais ou inválidos sejam enviados ao scheduler;
- [x] restaurar a última data válida quando a edição incompleta perde o foco;
- [x] manter datas completas com cálculo assistido de início, fim e duração;
- [x] proteger Tabela e Kanban com a mesma recuperação visual já usada no Gantt;
- [x] cobrir a regressão que derrubava a Tabela durante a digitação do ano.

Evidências: ESLint, TypeScript, 141 testes regulares, jornada E2E da aplicação
e build Vite de produção aprovados em 2 de outubro de 2026. Não houve mudança de
schema, persistência ou regra do scheduler.

### Etapa 2 — Ações rápidas das views

Estado: **Concluída localmente; não commitada**.

- [x] substituir o texto do botão de confirmação de predecessora por `+`, com
  contraste, tooltip **Adicionar predecessora** e nome acessível;
- [x] manter a rolagem horizontal disponível na parte inferior da área visível;
- [x] criar menu de contexto próprio para tarefas, reutilizável entre Tabela,
  Kanban e Gantt, com copiar/colar integrado nos campos de texto;
- [x] começar o menu da Tabela com detalhes, subtarefa, predecessora, duplicação, template
  e exclusão, respeitando contexto, teclado e confirmação destrutiva.
- [x] oferecer no Kanban mudança de status, duplicação e exclusão pelo mesmo
  padrão, mantendo o seletor de status e o Gantt como alternativas existentes.

Evidências: componente de menu reutilizável, abertura por clique direito ou
botão acessível, navegação por setas, `Home`, `End` e `Esc`, restauração de foco,
ações de texto no menu próprio e sincronização bidirecional da rolagem.
ESLint, TypeScript, 143 testes regulares, jornada E2E e build Vite aprovados.

### Etapa 3 — Salvamento automático

Estado: **Concluída localmente; não commitada**.

- [x] persistir seleções e datas válidas ao confirmar a alteração;
- [x] persistir texto após pausa curta e sempre ao sair do campo;
- [x] capturar gravações pendentes antes de desmontar a Tabela ao trocar de view;
- [x] serializar gravações por tarefa e exibir **Salvando**, **Salva** ou erro;
- [x] manter a edição local e permitir nova tentativa quando a gravação falhar.

Evidências: autosave não bloqueante com debounce de 700 ms, flush ao perder foco
ou desmontar a linha, fila independente por tarefa e botão **Salvar** mantido
como fallback. Foram aprovados ESLint, TypeScript, 149 testes regulares, jornada
E2E da aplicação e build Vite em 2 de outubro de 2026. Não houve mudança de
schema, código nativo ou política do scheduler.

### Etapa 4 — Bloqueio explícito de datas

Estado: **Concluída localmente; não commitada**.

- [x] representar `AUTO`/`MANUAL` como cadeado aberto/fechado;
- [x] impedir arrasto e redimensionamento de tarefa travada e explicar o bloqueio;
- [x] manter alertas de conflitos FS e alterações de lag produzidas por arrasto;
- [x] integrar travar/destravar à linha, aos detalhes e aos menus de contexto sem remover a semântica
  interna atual antes de existir justificativa para migration.

Evidências: Tabela e Gantt expõem a mesma trava, tarefas `MANUAL` continuam
editáveis por valores exatos e o domínio rejeita gestos temporais em tarefas
travadas. Testes de UI e domínio cobrem alternância e bloqueio do arrasto.

### Etapa 5 — Tarefa-resumo como predecessora

Estado: **Concluída localmente; não commitada**.

- [x] permitir resumo somente como predecessora, mantendo resumo como sucessora
  proibido por possuir datas derivadas;
- [x] propagar alterações descendentes para o resumo e dele para sucessoras;
- [x] preservar dependências diretas com folhas quando uma nova irmã for criada;
- [x] oferecer a escolha entre manter, transferir ou remover uma relação quando
  uma tarefa-folha recebe sua primeira subtarefa;
- [x] validar ciclos combinando hierarquia e dependências;
- [x] revisar duplicação, templates, importação, exportação e transações;
- [x] cobrir o exemplo em que `2.1` depende do resumo `1`, enquanto `3.1`
  depende diretamente de `1.5`: criar `1.6` desloca apenas `2.1`.

Evidências: ADR 025, migration `0006_summary_predecessors.sql`, schema 6,
upgrade não destrutivo, grafo combinado, testes de scheduler, templates, UI,
persistência e portabilidade. A suíte consolidada possui 157 testes
TypeScript/React e 38 testes Rust aprovados em 2 de outubro de 2026.

### Etapa 6 — Impacto, produtividade e histórico persistente

Estado: **Concluída localmente; não commitada**.

- [x] mostrar prévia das datas afetadas antes de adicionar ou remover uma
  predecessora-resumo;
- [x] travar e destravar tarefas-folha selecionadas em uma transação;
- [x] oferecer `Ctrl+Shift+L` sem capturar o atalho dentro de campos editáveis;
- [x] persistir até 50 revisões de desfazer/refazer do Gantt por projeto;
- [x] manter o histórico ao trocar de view e reabrir a aplicação;
- [x] migrar o schema 7 sem destruir dados e aceitar pacotes dos schemas 4 a 6
  por upgrade de uma cópia temporária;
- [x] auditar uma cópia do banco real da versão 0.2.1 e preservar o original;
- [x] corrigir a corrida entre autosave e criação rápida de dependências para
  que A → B → C sempre use o grafo mais recente.

Evidências: ADR 026, migration `0007_persistent_gantt_history.sql`, teste de
upgrade do banco real, testes de domínio/UI/Rust e jornada no Tauri/WebView2
real. O histórico persistente cobre edições temporais do Gantt e não pretende
ser uma trilha de auditoria global. Em 3 de outubro de 2026, passaram 161 testes
TypeScript/React, 39 testes Rust mais a auditoria isolada do banco 0.2.1,
Clippy, build e duas execuções consecutivas dos cinco cenários desktop.

## Fase 10 — Análise e explicação do cronograma

Estado: **Em andamento**. Primeiro incremento implementado em 07/10/2026.

### Escopo

- [x] Calcular caminho crítico sobre tarefas-folha e dependências FS.
- [x] Calcular folga total em dias úteis e identificar tarefas quase críticas.
- [x] Destacar tarefas críticas no Gantt sem depender somente de cor.
- [x] Adicionar filtros para tarefas críticas e com baixa folga.
- [x] Expor caminho crítico e folga na Tabela.
- [ ] Avaliar inclusão opcional no PDF.
- Criar uma explicação de agendamento por tarefa: predecessora controladora,
  lag, calendário efetivo, próxima data útil e impacto no término do projeto.
- [x] Indicar quando não existe rede suficiente para determinar caminho crítico.

### Integridade e testes obrigatórios

- Implementação em TypeScript puro, independente de React e Tauri.
- Casos com cadeias independentes, múltiplas predecessoras, lag, feriados,
  tarefas MANUAL, tarefas-resumo e redes desconectadas.
- Nenhuma alteração incidental na política reativa FS já estabilizada.
- Testes de desempenho nos limites de 1.000 tarefas por projeto foram adiados
  por decisão de produto até a conclusão dos incrementos funcionais.

### Critério de saída

O usuário identifica quais tarefas controlam a data final, quanto cada tarefa
pode atrasar e por que uma data foi calculada.

## Fase 11 — Progresso hierárquico e marcos

Estado: **Planejada**. Versão-alvo sugerida: `0.2.1`.

### Escopo

- Permitir progresso manual ou calculado em cada tarefa-resumo.
- Calcular o progresso da tarefa-pai a partir dos filhos, ponderado pela duração
  útil de cada filho; não serão introduzidos campos de esforço ou horas.
- Definir comportamento explícito para filhos cancelados, sem datas ou com
  duração inválida antes de persistir qualquer cálculo.
- Manter tarefas-folha com progresso editável e opção de derivação coerente a
  partir do status.
- Introduzir marco como tipo de item de cronograma de duração zero e data única.
- Representar marcos de forma própria na Tabela, Gantt, filtros e PDF.
- Preservar marcos e política de progresso em duplicação, templates e pacotes
  `.chronoproject`.

### Decisões obrigatórias antes da implementação

- Registrar em ADR a exceção do marco à regra atual `duração 1 = mesmo dia`.
- [x] `Concluída` força 100% após confirmação; 100% isoladamente não muda o
  status. `Cancelada` permanece neutra e não conserva data de conclusão (ADR 028).
- Definir se o modo calculado será configurado por tarefa-resumo ou por projeto.

### Integridade e testes obrigatórios

- Migration aditiva, banco novo, upgrade, import/export e rollback.
- Arredondamento determinístico e resultado estável em hierarquias profundas.
- Pais com filhos de durações diferentes, cancelados e parcialmente concluídos.
- Garantir que progresso não altere datas ou dependências.

### Critério de saída

Tarefas-resumo representam o avanço real dos filhos sem registro de horas, e
marcos representam eventos-chave sem distorcer a duração do cronograma.

## Fase 12 — Produtividade, configuração de views e reversibilidade

Estado: **Planejada**. Versão-alvo sugerida: `0.2.2`.

Incremento parcial concluído em 07/10/2026: histórico legível da sessão,
inclusão/remoção/intervalo de predecessoras em massa e filtro por múltiplos
responsáveis. Visões salvas permanecem explicitamente como `to-do`.

### Escopo

- Salvar visões com filtros, ordenação, expansão da hierarquia e escala do Gantt.
- Permitir escolher, ordenar, redimensionar e fixar colunas da Tabela.
- Fornecer visões iniciais como **Atrasadas**, **Esta semana**, **Críticas** e
  **Marcos**, sem criar cópias persistidas de tarefas.
- Implementar edição em massa de status, prioridade, progresso, responsável,
  tags e calendário, sempre com prévia do alcance.
- Ampliar desfazer/refazer para alterações da Tabela e ações em massa.
- Criar histórico local legível para datas, progresso, dependências, status e
  alterações produzidas pelo scheduler.
- Manter alternativa por teclado para toda ação em massa ou visual.

### Limites

- O histórico não será trilha multiusuário nem auditoria remota.
- Não armazenar snapshots completos do banco a cada edição.
- Ações que alteram estrutura, dependências ou muitas tarefas devem ser
  transacionais e aparecer como uma única operação reversível.

### Critério de saída

O usuário configura o espaço de trabalho, altera conjuntos grandes com segurança
e consegue compreender ou desfazer as mudanças relevantes.

## Fase 13 — Interoperabilidade tabular

Estado: **Planejada**. Versão-alvo sugerida: `0.2.3`.

### Escopo

- Exportar a projeção atual ou o projeto completo para CSV e XLSX.
- Importar CSV/XLSX com prévia, mapeamento de colunas e validação por linha.
- Tratar hierarquia por código estrutural ou identificador de pai.
- Resolver predecessoras FS por UUID estável quando disponível e por código
  visual somente dentro do projeto importado.
- Permitir importar como novo projeto ou atualizar por UUID, com confirmação.
- Produzir relatório claro de linhas criadas, atualizadas, ignoradas ou inválidas.
- Preservar `.chronoproject` como único formato de fidelidade completa para backup,
  templates, calendários, configurações e transporte entre computadores.

### Integridade e testes obrigatórios

- Nenhuma escrita antes da validação integral e da prévia confirmada.
- Importação em staging e transação, com rollback total em erro bloqueante.
- Testar caracteres portugueses, fórmulas tratadas como dados, células grandes,
  datas inválidas, códigos duplicados, ciclos e referências ausentes.
- Documentar explicitamente quais informações CSV/XLSX não preservam.

### Critério de saída

O Chrono Project troca listas de tarefas com planilhas de forma previsível e segura,
sem enfraquecer o pacote `.chronoproject` nem a integridade do banco local.

## Escopo explicitamente descartado deste roadmap

- controle de tempo, cronômetro, apontamento ou timesheet;
- cadastro de recursos, capacidade, carga, sobrealocação ou nivelamento;
- esforço estimado, realizado ou restante em horas;
- sincronização em nuvem, contas e colaboração simultânea;
- telemetria e envio automático de dados;
- dependências SS, FF e SF enquanto a política exclusiva FS permanecer vigente;
- dashboards avançados, custos e valor agregado sem nova decisão explícita.

O campo **Responsável** existente continua sendo metadado informativo da tarefa;
ele não cria entidade de recurso nem interfere no scheduler.

## Ordem e dependências entre as fases pós-MVP

```text
Fechar Fase 7 / validar v0.1.7
              │
              ▼
Fase 8 — baseline, desvios e prazos-limite
              │
              ▼
Fase 9 — identidade visual e ícone profissional
              │
              ▼
Fase 10 — caminho crítico, folgas e explicação
              │
              ▼
Fase 11 — progresso consolidado e marcos
              │
              ▼
Fase 12 — visões salvas, edição em massa e histórico
              │
              ▼
Fase 13 — CSV/XLSX
```

O plano de referência precede a identidade visual, permitindo consolidar a
interface atual antes de criar os ativos definitivos. A identidade precede o
caminho crítico para que os próximos recursos já nasçam sob o sistema visual
aprovado. Marcos e progresso vêm
depois porque alteram semântica e schema. A produtividade usa esses campos já
estáveis; a interoperabilidade fica por último para não cristalizar em planilhas
um modelo ainda em evolução.

## Referências de produto para as fases futuras

Estas referências orientam conceitos e critérios de UX; não autorizam copiar
interfaces, código ou ampliar automaticamente o escopo:

- [Microsoft Project — caminho crítico](https://support.microsoft.com/en-us/project/show-the-critical-path-of-your-project-in-project)
- [Microsoft Project — cargas e nivelamento](https://support.microsoft.com/en-us/project/project-management-goal-resolve-resource-allocation-problems) — consultado para delimitar o recurso que foi descartado
- [OpenProject — comparação com baseline](https://www.openproject.org/docs/user-guide/work-packages/baseline-comparison/)
- [OpenProject — acompanhamento de progresso](https://www.openproject.org/docs/user-guide/time-and-costs/progress-tracking/)

## Checkpoints Git

| Checkpoint | Estado | Evidência atual |
| --- | --- | --- |
| 0 — Especificação inicial | Concluído | `c525351` — `Initial project setup` |
| 1 — Ambiente + scaffold | Concluído | `7b41a4a` — fundação consolidada |
| 2 — SQLite + migrations + qualidade | Concluído | `7b41a4a` — fundação consolidada |
| 3 — Project/Task core | Concluído | `1b3e9c6` |
| 4 — Scheduler FS | Concluído | `6f02673` |
| 5 — Tabela/Kanban/Gantt | Concluído | `36b2096` |
| 6 — Duplicação/templates | Concluído | `2a6faef` — reutilização consolidada |
| 7 — Export/import/backup | Concluído | `fc26a29` — portabilidade e backups consolidados |
| 8 — Empacotamento Windows | Em andamento | instaladores locais padrão e offline gerados; máquina limpa pendente |

Os Checkpoints 1 e 2 foram consolidados no mesmo commit porque a primeira entrega validada incluiu scaffold, qualidade, SQLite e migrations. Futuros checkpoints podem conter vários commits pequenos e coerentes.

## Decisões previstas

Estas decisões ainda não bloqueiam o projeto, mas devem ser resolvidas antes do trabalho correspondente:

| Tema | Momento | Registro esperado |
| --- | --- | --- |
| Biblioteca ou estratégia da Tabela | Antes de adicionar uma dependência de grid | A base atual usa HTML nativo; ADR se uma dependência estrutural for necessária |
| Biblioteca de Gantt | Resolvida na Fase 4 | ADR 013 — SVAR React Gantt 2.7.1 |
| Formato final `.chronoproject` | Antes da Fase 6 | `import-export.md` e ADR se necessário |
| Bundle WebView2 e instalador offline | Resolvida na Fase 7 | ADR 017 — NSIS padrão + variante offline |
| Política de atualização sem chaves | Resolvida na Fase 7 | ADR 018 — consulta manual e instalação externa |
| Automação E2E | Resolvida em camadas na Fase 7 | ADR 019 — jornada da aplicação + testes nativos; janela Tauri em diagnóstico |

A implementação pendente e seus critérios objetivos estão em
[Diretrizes de validação do WebView2](webview2-testing.md). O E2E desktop não
deve ser promovido a gate nem motivar troca do runtime antes de cumprir essa
matriz no host, na VM limpa e no CI Windows.

## Histórico de evolução

### 8 de setembro de 2026 — Validação desktop e revisão para release

- Commit `faef024`: isolamento e ciclo de vida E2E desktop consolidados.
- Validações locais: 122 testes regulares, 30 Rust, 3 cenários desktop reais,
  1 jornada em camadas e 2 testes de desempenho aprovados; lint/typecheck/fmt/
  check/Clippy aprovados.
- Workflow diagnóstico manual preparado; duas execuções remotas pendentes.
- Usuário confirmou atualização bem-sucedida para v0.1.4, identificada em Ajuda.
  A menção inicial a v0.1.5 foi corrigida; essa será a próxima release.
  Preservação detalhada dos dados ainda não tem confirmação específica.
- Revisadas descrições de Gantt, updater, portabilidade e estado dos testes.
- Notas e checklist do próximo release em [releases/next.md](releases/next.md).
- Revisão documental ainda não commitada; nenhum artefato regenerado.

### 8 de setembro de 2026 — Preparação da v0.1.5

- Manifests alinhados em `0.1.5`; schema SQLite permanece 4.
- Instaladores NSIS padrão e offline gerados com a chave permanente do updater.
- Assinaturas dos dois pacotes verificadas com a chave pública incorporada.
- `latest.json` usa URL imutável da tag v0.1.5 e a assinatura do pacote padrão.
- Hashes, notas e script de publicação defensivo preparados em
  `.local/distribution/v0.1.5/`.
- Aprovados 122 testes regulares, 30 Rust/SQLite, jornada E2E em camadas,
  2 testes de desempenho e 3 cenários desktop reais; lint, typecheck, build,
  Rust fmt/check/Clippy e auditoria npm sem vulnerabilidades aprovados.
- Publicação e validação da atualização v0.1.4 → v0.1.5 permanecem pendentes.

### 8 de setembro de 2026 — Início da validação de acessibilidade da v0.1.6

- E2E desktop passou em densidades simuladas de 125% e 150%, no viewport mínimo
  de 960 × 640, sem rolagem horizontal global.
- Tabela, Kanban, Gantt, diálogo de atalhos e fechamento por `Esc` permaneceram
  operáveis.
- A árvore WebView2 expôs landmarks e abas com papéis e nomes esperados.
- O controle do Windows não iniciou por falha interna do helper; escala real do
  sistema e experiência auditiva com Narrador continuam pendentes na VM.

### 26 de agosto de 2026 — Estado zero

- Especificação inicial adicionada ao repositório.
- Commit: `c525351` — `Initial project setup`.
- Resultado: baseline recuperável contendo `AGENTS.md`.

### 26–27 de agosto de 2026 — Ambiente e fundação técnica

- Ambiente Windows e pré-requisitos do Tauri inspecionados e documentados.
- Node.js LTS, Rust MSVC, Build Tools e Windows SDK preparados.
- Scaffold Tauri 2 + React + TypeScript + Vite criado.
- Qualidade, testes, CI, logging, SQLite e migration inicial configurados.
- Aplicação vazia compilada e executada com banco e logs locais.
- Validações: ESLint, TypeScript, Vitest, Cargo fmt/check/test, Clippy, auditoria npm e build Tauri aprovados.
- Commit: `7b41a4a` — `chore: bootstrap Chrono Project foundation`.
- Checkpoints: A, B, C, D e Git 1–2 concluídos.
- Resultado: base estável para iniciar o Core, sem funcionalidades de negócio antecipadas.

### 27 de agosto de 2026 — Registro vivo de evolução

- Roadmap executivo, checklists por fase e critérios de saída consolidados neste documento.
- Checkpoints Git e decisões futuras passaram a ter acompanhamento explícito.
- Processo de atualização definido para pessoas e agentes.
- Commit: `não commitado` no momento da criação deste registro.
- Resultado: a evolução futura pode ser acompanhada sem alterar ou duplicar a especificação principal.

### 27 de agosto de 2026 — Primeiro fluxo vertical do Core

- Modelo TypeScript estrito criado para calendários, projetos, tarefas e
  hierarquia, com mensagens destinadas ao usuário em português.
- Migration `0002_core.sql` adicionou calendários configuráveis, projetos,
  tarefas, tags normalizadas, chaves externas e índices.
- Persistência Tauri/SQLite implementada com transações para tags e exclusões.
- Interface em português permite criar, editar, arquivar e excluir projetos,
  além de criar tarefas/subtarefas e editar seus campos na Tabela.
- O calendário padrão usa segunda a sexta; o modelo aceita sábado e domingo sem
  mudança de schema.
- Validações: 16 testes TypeScript/React, 7 testes Rust/SQLite, lint, typecheck,
  build web, Cargo fmt, Clippy e build Tauri release aprovados.
- Reordenação de projetos e tarefas irmãs adicionada com atualização atômica das
  posições; ao trocar de pai, a tarefa recebe posição válida no novo grupo.
- O build real foi reaberto e comprovou a persistência do projeto/tarefa já
  existentes após recompilação e reinício.
- As decisões de interface em português e semana configurável foram registradas
  nos ADRs 007 e 008.
- Commit: `não commitado`.
- Checkpoint: Git 3 pronto para versionar, aguardando autorização do usuário
  para qualquer operação remota.
- Resultado: a Fase 2 está concluída localmente, sem avançar para scheduling.

### 27 de agosto de 2026 — Scheduling FS e calendários

- Funções puras `date-only` e de calendário implementadas com semana
  configurável, feriados, exceções positivas e duração inclusiva.
- Edição da Tabela calcula automaticamente o terceiro campo quando início,
  fim ou duração fornecem informações suficientes.
- Grafo FS implementado com validação, ciclo, ordenação topológica, lag,
  múltiplas predecessoras e propagação reativa do subgrafo afetado.
- Tarefas `AUTO` preservam duração e são deslocadas para a restrição FS mais
  tardia, inclusive quando ela fica anterior; tarefas
  `MANUAL` permanecem fixas e recebem conflito apenas quando uma predecessora
  declarada é violada.
- Calendário opcional por tarefa e calendário integrado **Todos os dias**
  permitem cadeias automáticas em sábado e domingo sem alterar o padrão do projeto.
- Tarefas-resumo passaram a derivar início e fim dos descendentes e bloqueiam
  edição temporal ou dependências diretas.
- Migration `0003_scheduling.sql` criou exceções e dependências com constraints,
  chaves estrangeiras e triggers para repetir as invariantes estruturais.
- `apply_schedule_changes` persiste calendários, dependências, tarefas e resumos
  em uma transação SQLite, com teste de rollback integral.
- Conflitos são reconstruídos ao carregar e recalculados por projeto sem sumir
  quando outra cadeia é editada.
- Validações finais: 48 testes TypeScript/React, 11 testes Rust/SQLite, lint,
  typecheck, build web, Cargo fmt/check, Clippy e build Tauri release aprovados.
- ADRs: 009 (política FS) e 010 (calendário efetivo por tarefa).
- Commit: `não commitado`.
- Checkpoint: Git 4 pronto para versionar após auditoria do usuário.
- Resultado: a Fase 3 está concluída localmente; a Fase 4 não foi iniciada.

### 28 de agosto de 2026 — Ajustes de UX após auditoria da Fase 3

- O painel **Detalhes** deixou de ficar limitado à largura da coluna Tarefa e
  passou a ocupar uma linha própria, com formulário responsivo em duas colunas.
- Alterações de lag deixaram de criar um botão ao lado do campo. O único botão
  **Salvar** da coluna Ações confirma os campos da tarefa e todos os lags
  modificados naquela linha.
- Tarefa, dependências atualizadas e recalculações são enviadas no mesmo
  `ScheduleChangeSet`; lag inválido impede a gravação de toda a linha.
- O campo Código recebeu ajuda contextual acessível, explicando que se trata de
  identificador visual opcional e independente do UUID interno.
- Testes de UI cobrem estrutura do painel, ajuda do código, salvamento único,
  atomicidade e rejeição integral de lag inválido.
- Ao reabrir o app nativo no ambiente visível ao agente, a verificação de
  integridade detectou que somente as mensagens internas de quatro triggers da
  migration 3 haviam sido traduzidas depois de sua primeira aplicação. O
  arquivo publicado foi restaurado byte a byte ao checksum daquele SQLite
  (`1617ADF38E69528743AE170C2D96C1544E5FE4E1C43784C104DAA8F1089FAB098DFF734928DBD6A76663CCB5D3926AA2`),
  preservando aquele banco sem recriação ou edição manual.
- Validações: 51 testes TypeScript/React, 11 testes Rust/SQLite, lint,
  typecheck, build web, Cargo fmt/check, Clippy, build Tauri release e abertura
  nativa com o banco existente aprovados.
- Commit: `não commitado`.
- Resultado: ajustes incorporados ao Checkpoint Git 4, sem iniciar a Fase 4.

### 28 de agosto de 2026 — Compatibilidade segura do release e do banco

- O diagnóstico com redirecionamento de `stderr` mostrou que o release existente
  incorporava a variante traduzida da migration 3, enquanto o banco ativo já
  registrava o checksum canônico. O executável estava desatualizado em relação
  ao arquivo restaurado.
- Um novo build com a migration canônica abriu normalmente e confirmou no log
  que os checksums já estavam atuais; nenhuma linha do banco precisou ser
  alterada e nenhum backup de reparo foi criado nessa execução.
- A migration canônica permaneceu imutável; nenhuma migration nova foi criada,
  pois não há mudança de schema.
- Como salvaguarda para um banco que possa ter sido criado pelo build alternativo,
  uma verificação anterior ao plugin SQL passou a aceitar somente os dois hashes
  conhecidos. Para a variante legada, ela verifica integridade, histórico,
  schema completo e dados estruturais da versão 3.
- Antes de qualquer reparo efetivo é criado um backup consistente em
  `%APPDATA%\io.github.machadojean.chronoproject\backups\`. Uma transação altera somente o
  checksum da migration 3; projetos, tarefas e dependências não entram em
  nenhuma instrução de atualização.
- Checksum, histórico ou schema inesperado falha de forma conservadora e sem
  backup ou escrita.
- Testes Rust cobrem os dois checksums, preservação dos dados no banco e no
  backup, recusa de valor desconhecido e recusa de schema divergente.
- A auditoria visual posterior encontrou o workspace vazio. A inspeção forense
  confirmou zero registros ativos e localizou nos bytes não alocados somente um
  projeto/tarefa anteriores à migration 3; os cinco itens relatados não foram
  encontrados em nenhum SQLite do usuário, da Lixeira ou dos perfis de sistema.
- Uma cópia binária do arquivo foi preservada em `.local/backups/` antes da
  investigação; nenhuma restauração parcial foi feita sem confirmação do usuário.
- ADR: 011 (compatibilidade controlada do checksum da migration 3).
- Commit: `não commitado`.
- Resultado: release volta a abrir e a investigação de recuperação permanece
  separada do Checkpoint Git 4, sem iniciar a Fase 4.

### 28 de agosto de 2026 — Base controlada para auditoria da Fase 3

- Com autorização do usuário, o workspace vazio recebeu o projeto **Auditoria
  do scheduler — Fase 3** com três tarefas-resumo e sete subtarefas.
- O grafo contém oito relações FS e exercita cadeia, lag zero e positivo,
  múltiplas predecessoras, feriado em 07/09, calendário **Todos os dias** e
  conflito informativo de uma tarefa manual.
- Uma cópia byte a byte do banco vazio foi criada antes do seed em
  `.local/backups/chronoproject-pre-phase3-seed-20260828.sqlite`.
- A gravação ocorreu em uma única transação. `quick_check`, chaves estrangeiras,
  contagens, datas calculadas e reabertura do release foram validados.
- Depois da validação de persistência, uma cópia byte a byte do cenário pronto
  foi criada em
  `.local/backups/chronoproject-phase3-audit-baseline-20260828.sqlite`, permitindo
  restaurar o ponto inicial dos testes manuais sem depender de dados versionados.
- O cenário e seus resultados esperados foram registrados em
  `docs/scheduling.md` para orientar auditorias futuras.
- Gates finais aprovados: 51 testes TypeScript/React, 16 testes Rust/SQLite,
  lint, typecheck, build web, Cargo fmt/check e Clippy.
- A base continua local e ignorada pelo Git; código-fonte, migrations e testes
  não dependem dela.
- Commit: `não commitado`.
- Resultado: existe novamente uma base real e reproduzível por descrição para a
  inspeção final do Checkpoint Git 4, sem iniciar a Fase 4.

### 28 de agosto de 2026 — Banco único para desenvolvimento e release local

- A abertura manual do release revelou que as cinco tarefas originais estavam
  preservadas no `AppData` real do usuário.
- O processo iniciado pelo Codex havia recebido a virtualização de `AppData` do
  pacote desktop e, por isso, enxergava uma segunda base com o cenário de
  auditoria. O executável e seu código eram os mesmos; o contexto do Windows era
  diferente.
- Builds debug e o novo release local de teste passaram a compartilhar
  `.local/data/chronoproject.sqlite`. Builds de distribuição continuam usando o
  diretório oficial do perfil.
- A primeira abertura manual preserva o banco recuperado com `VACUUM INTO`,
  verifica origem, backup e cópia, e nunca sobrescreve uma base compartilhada
  existente.
- `npm run tauri:build:test` ativa a feature Cargo `shared-dev-data`; o binário
  resultante é apenas para auditoria no checkout local.
- Validações aprovadas: 51 testes TypeScript/React, 20 testes Rust/SQLite,
  typecheck, lint, build web, Cargo fmt/check, Clippy e build release local com a
  feature compartilhada.
- ADR: 012 (banco compartilhado para desenvolvimento e release local de teste).
- Commit: `não commitado`.
- Resultado: eliminada a divergência de dados entre usuário e agente sem mudar o
  schema ou iniciar a Fase 4.

### 28 de agosto de 2026 — Correção do release local de auditoria

- A primeira versão do script chamou `cargo build` diretamente e gerou o
  binário nativo com a feature correta, mas sem o pipeline do Tauri. Sem o Vite,
  a janela tentou acessar `localhost:1420` e exibiu
  `ERR_CONNECTION_REFUSED`.
- O script passou a usar
  `tauri build --no-bundle --features shared-dev-data`, que executa o build web
  configurado e incorpora `frontendDist` ao executável.
- A primeira abertura havia importado o banco recuperado, não o baseline de
  auditoria. Ele foi preservado em
  `.local/backups/chronoproject-recovered-user-data-before-audit-switch-20260828.sqlite`
  e a base compartilhada recebeu o cenário **Auditoria do scheduler — Fase 3**.
- Hashes, conteúdo das duas bases e reabertura foram conferidos. O novo
  `chrono-project.exe` iniciou sem servidor Vite, permaneceu responsivo e não
  produziu saída de erro.
- Commit: `não commitado`.
- Resultado: release local com frontend incorporado e apontando para a mesma
  base de testes de `tauri dev`, sem perda do banco recuperado.

### 28 de agosto de 2026 — Fase 4: filtros, Kanban e Gantt

- Tabela, Kanban e Gantt passaram a ser três projeções da mesma coleção de
  `Task`; nenhuma view criou tabela, repository ou persistência própria.
- Filtros compartilhados cobrem texto, status, prioridade, conclusão, intervalo
  de datas e tag. Ancestrais são preservados como contexto de hierarquia.
- O Kanban organiza cartões nas cinco colunas de status e permite movimentação
  tanto por drag-and-drop quanto pelo campo acessível **Status**.
- SVAR React Gantt 2.7.1 foi selecionado após avaliação de licença MIT,
  manutenção, React/TypeScript, hierarquia, dependências, desempenho,
  acessibilidade e bundle. A decisão está no ADR 013.
- O Gantt apresenta hierarquia, resumos, progresso, dependências FS, escalas de
  dias/semanas/meses, finais de semana e feriados. O renderer é somente leitura;
  início e duração são editados no painel do Chrono Project e passam pelo scheduler.
- A numeração hierárquica `1.`, `1.1.`, `1.1.1.` passou a ser derivada da árvore
  e aparece nas três views sem alterar títulos nem o banco.
- A projeção temporal passou a converter o fim inclusivo do Chrono Project para o
  limite exclusivo do renderer; resumos que atravessam o fim de semana agora
  ocupam todos os dias civis até a data final.
- Dependências podem ser isoladas por clique na linha ou pelo seletor acessível,
  com realce da predecessora e sucessora; a opção **Todas as dependências**
  restaura a visão completa.
- A janela principal foi configurada para iniciar maximizada no Windows.
- Código e CSS do Gantt são carregados sob demanda. O build final gerou chunks
  de aproximadamente 255 kB para a aplicação e 260 kB para o Gantt, além de CSS
  específico de 148 kB, todos antes de gzip.
- A primeira auditoria nativa encontrou uma tela branca ao abrir o Gantt: folhas
  eram marcadas como abertas na árvore interna da biblioteca. O adapter passou a
  abrir somente pais com filhos projetados, recebeu teste de regressão e a view
  ganhou uma barreira de erro para preservar o restante da aplicação.
- A auditoria final também encontrou o destaque visual sem atualização do
  inspetor ao clicar em uma barra. A seleção passou a ouvir a ação oficial
  `select-task` pela API do Gantt e recebeu teste de regressão de interface.
- Auditoria visual aprovou Kanban, Gantt diário/semanal, filtro de resumo sem
  filhos visíveis e bloqueio de prazo da tarefa-resumo, sem alterar o banco.
- Gates aprovados: 69 testes TypeScript/React, 20 testes Rust/SQLite, lint,
  typecheck, build web, auditoria npm sem vulnerabilidades, Cargo fmt/check,
  Clippy e build Tauri local com a feature de dados compartilhados.
- Nenhuma migration foi criada: a Fase 4 altera somente projeção e interação.
- Release local validado em
  `src-tauri/target/release/chrono-project.exe`, com as dez tarefas do cenário de
  auditoria e sem servidor Vite.
- Commit: `não commitado`.
- Checkpoint: Git 5 pronto para auditoria do usuário e versionamento posterior.
- Resultado: a Fase 4 está concluída localmente; a Fase 5 não foi iniciada.

### 28 de agosto de 2026 — Revisão da propagação regressiva

- A auditoria manual identificou que antecipar o término de uma predecessora
  não liberava suas sucessoras automáticas, devido à política conservadora
  originalmente adotada no ADR 009.
- A política foi revisada explicitamente: tarefas `AUTO` com predecessoras
  agora ficam alinhadas à restrição FS mais tardia e podem ser deslocadas para
  frente ou para trás, preservando duração, calendário e lag.
- A antecipação segue em cascata pela ordem topológica e continua usando a
  restrição mais tardia quando existem múltiplas predecessoras.
- Tarefas `MANUAL` permanecem intocadas. Folgas intencionais pertencem ao lag;
  remover a última predecessora mantém a data atual por falta de nova âncora.
- Regressão de interface comprovada: reduzir o término da origem de 04/09 para
  02/09 antecipou a sucessora para 03/09 e a tarefa seguinte para 04/09 no
  mesmo `ScheduleChangeSet`.
- Nenhuma migration foi necessária; a mudança afeta somente a regra de domínio
  e usa a transação já existente.
- Gates aprovados: 69 testes TypeScript/React, 20 testes Rust/SQLite, lint,
  typecheck, build web, Cargo fmt/check, Clippy e build Tauri local.
- Commit: `não commitado`.
- Resultado: a correção foi incorporada ao Checkpoint Git 5 sem iniciar a Fase 5.

### 28 de agosto de 2026 — Fechamento documental da Fase 4

- README, ambiente, arquitetura, modelo de dados, scheduler, views,
  importação/exportação planejada, roadmap e ADRs foram auditados em conjunto.
- A documentação explicita a fonte única de verdade, numeração derivada, fim
  inclusivo, foco de dependência, início maximizado e propagação `AUTO` nos dois
  sentidos, sem atribuir persistência própria às views.
- Melhorias possíveis de Gantt e Kanban foram registradas como backlog não
  bloqueante; duplicação e templates permanecem exclusivamente na Fase 5.
- Nenhuma migration ou mudança de schema foi necessária; o schema permanece 3.
- Gates finais: 69 testes TypeScript/React, 20 testes Rust/SQLite, lint,
  typecheck, build web, Cargo fmt/check, Clippy e release local aprovados.
- Commit: `não commitado`; nenhuma operação remota foi executada.
- Resultado: Fase 4 concluída e Checkpoint Git 5 pronto para commit do usuário.

### 29 de agosto de 2026 — Fase 5: duplicação e templates

- O domínio puro passou a duplicar tarefa isolada, árvore e projeto por meio de
  mapas de UUID, reconstruindo pais e somente dependências internas.
- A biblioteca global de templates captura árvores, durações, prioridades,
  status inicial, tags e relações FS com lag. Cada aplicação cria entidades
  independentes e usa a data e o projeto de destino escolhidos pelo usuário.
- A migration `0004_reuse.sql` elevou o schema para 4 com tabelas relacionais,
  índices, chaves estrangeiras e triggers para templates.
- Duplicações e templates são persistidos em transações específicas; testes
  cobrem banco novo, upgrade 3→4 preservando dados, rollback e exclusão sem
  afetar tarefas já aplicadas.
- A Tabela ganhou ações de reutilização no painel **Detalhes**, o cabeçalho
  permite duplicar o projeto e a biblioteca **Templates** permite aplicar ou
  excluir estruturas em qualquer projeto.
- A decisão de templates globais no mesmo SQLite foi registrada no ADR 014. Um
  backup integral do banco os preserva; a portabilidade `.chronoproject` pertence
  à Fase 6.
- Auditoria manual: [reuse.md](reuse.md).
- Gates aprovados: 78 testes TypeScript/React, 23 testes Rust/SQLite, lint,
  typecheck, build web, Cargo fmt/check, Clippy, auditoria npm sem vulnerabilidades
  e release Tauri local. A abertura real confirmou schema 4 no banco compartilhado.
- O banco foi copiado antes da migration para um backup de hash idêntico em
  `.local/backups/chronoproject-before-schema4-20260829-1018.sqlite`.
- Nenhuma dependência externa foi adicionada e nenhuma ferramenta global foi
  instalada ou atualizada.
- Commit: `não commitado`; nenhuma operação remota foi executada.
- Resultado: Fase 5 concluída localmente e Checkpoint Git 6 preparado; a Fase 6
  não foi iniciada.

### 29 de agosto de 2026 — Normalização das migrations no CI Windows

- O GitHub Actions expôs uma diferença de ambiente que não aparecia no
  worktree local: `core.autocrlf=true` convertia a migration 3 de `LF` para
  `CRLF` durante o checkout e alterava seu checksum SHA-384.
- `.gitattributes` passou a fixar `LF` exclusivamente para
  `src-tauri/migrations/*.sql`, garantindo bytes idênticos entre máquinas sem
  editar migrations publicadas nem bancos existentes.
- A falha era do teste de integridade do repositório, não do SQLite nem dos
  dados. O checksum canônico da migration 3 permanece inalterado.
- Ao reproduzir todo o CI localmente, o build de distribuição substituiu o
  release de teste no mesmo caminho e exibiu o banco antigo de `AppConfig`. O
  release foi recompilado com `shared-dev-data`, e o log confirmou novamente
  schema 4 em `.local/data/chronoproject.sqlite`. Ambos os bancos foram preservados.
- Commit: `não commitado`; nenhuma nova execução remota foi disparada.

### 29 de agosto de 2026 — Fase 6: portabilidade e recuperação

- O formato `.chronoproject` versão 1 foi implementado como ZIP estrito com
  `manifest.json`, `data.sqlite` e `README.txt`, catálogo verificável e hash
  SHA-256 do snapshot.
- A barra **Dados** permite exportar projeto ou workspace, criar backup,
  inspecionar/importar pacote e restaurar um backup completo usando seletores
  nativos do Windows.
- O backup manual permite escolher pasta e nome pelo seletor do Windows;
  backups automáticos continuam no diretório interno e um acesso discreto em
  **Mais opções** abre essa pasta no Explorador de Arquivos.
- A prévia permite escolher projetos e templates. Projeto com UUID conhecido é
  atualizado integralmente por padrão; **Importar como cópia** remapeia projeto,
  tarefas, pais e dependências internas.
- Projetos não selecionados permanecem intactos. Calendários ausentes são
  importados, equivalentes são reutilizados e colisões semânticas são copiadas
  e remapeadas sem alterar outros projetos locais.
- Pacotes são limitados e validados por caminho, entradas, manifest, schema,
  tamanho, hash, integridade SQLite, chaves estrangeiras, catálogo, hierarquia
  e ciclos antes de qualquer escrita.
- Importação e restauração criam backup verificado automaticamente e gravam em
  transação. Restauração integral permanece separada da importação seletiva.
- O ADR 015 registra a política por agregado e a justificativa para não mesclar
  tarefas campo a campo. [import-export.md](import-export.md) contém formato,
  segurança, política e roteiro de auditoria manual.
- Dependências locais Rust adicionadas: Tauri Dialog 2.7.2, zip 8.6.0 sem
  codecs, sha2 0.11.0, uuid 1.26.0 e chrono 0.4.45. Nenhuma ferramenta global
  ou dependência npm foi adicionada.
- Testes novos cobrem round-trip semântico em workspace vazio, substituição
  seletiva, cópia com relações remapeadas, rejeição de entrada ZIP insegura,
  restauração e seleção pela interface.
- Gates aprovados: 80 testes TypeScript/React, 29 testes Rust/SQLite, lint,
  typecheck, build web, Cargo fmt/check, Clippy, auditoria npm sem
  vulnerabilidades, build Tauri de distribuição e release local de teste.
- Commit: `não commitado`; nenhuma operação remota foi executada.
- Resultado: Fase 6 concluída localmente e Checkpoint Git 7 preparado; a Fase 7
  não foi iniciada.

### 29 de agosto de 2026 — Destino do backup manual e acesso aos automáticos

- O Checkpoint Git 7 foi consolidado no commit `fc26a29`.
- **Criar backup** passou a abrir o seletor nativo para escolha de pasta e nome.
- O snapshot é criado e validado em arquivo temporário antes de substituir um
  destino previamente confirmado, preservando backups existentes em caso de
  falha durante a geração.
- Backups automáticos de importação e restauração continuam no diretório
  interno. **Dados → Mais opções** oferece acesso discreto a essa pasta no
  Explorador de Arquivos.
- Gates aprovados novamente: 80 testes TypeScript/React, 29 testes Rust/SQLite,
  lint, typecheck, Cargo check, Clippy e release local de teste.
- Commit: `não commitado`; nenhuma operação remota foi executada.
- Resultado: refinamento pronto para commit, sem iniciar a Fase 7.

### 29 de agosto de 2026 — Catálogo offline de feriados brasileiros

- O calendário passou a gerar uma prévia de feriados nacionais, estaduais e
  móveis somente para os anos utilizados pelas tarefas do projeto.
- A UF é opcional; feriados municipais permanecem sob controle manual do usuário.
- Feriados oficiais são pré-selecionados. Feriados bancários e pontos
  facultativos são exibidos com sua classificação e exigem seleção consciente.
- Exceções já cadastradas nunca são sobrescritas pela importação.
- `date-holidays` 3.36.0 foi adicionada localmente e carregada sob demanda; o
  código é ISC e os dados são CC BY-SA 3.0, com atribuição em
  `THIRD_PARTY_NOTICES.md`.
- Nenhuma migration foi necessária: as datas escolhidas usam a entidade de
  exceção existente, preservando compatibilidade com backups do schema 4.
- Gates aprovados: 84 testes TypeScript/React, 29 testes Rust/SQLite, lint,
  typecheck, build web, Cargo fmt/check/test/Clippy e auditoria npm sem
  vulnerabilidades conhecidas.
- Commit: `não commitado`; nenhuma operação remota foi executada.

### 30 de agosto de 2026 — Barra de menus compacta

- Dados, ações do projeto, calendário, templates e ajuda foram reunidos em uma
  barra superior logo abaixo da barra nativa da janela e acima do título do
  projeto, seguindo a convenção de aplicativos desktop.
- Os painéis abrem como menus flutuantes e deixam de reservar altura quando
  fechados. Calendário e templates usam a largura útil do workspace para não
  escapar da janela em resoluções menores.
- O cabeçalho do projeto mantém somente nome, descrição, status e salvamento;
  ordenar, duplicar, arquivar e excluir passaram para o menu **Projeto**.
- Apenas um menu principal permanece aberto por vez usando o agrupamento nativo
  de `details`, com foco visível e operação por teclado.
- Atualizações após importação e restauração não desmontam mais a interface nem
  apagam a mensagem de resultado.
- Nenhuma dependência ou migration foi adicionada.
- Gates aprovados: 84 testes TypeScript/React, lint, typecheck e build web. O
  release local de teste foi recompilado e a barra, o calendário e os templates
  foram conferidos na janela Tauri real.
- Commit: `não commitado`; nenhuma operação remota foi executada.

### 30 de agosto de 2026 — Início da Fase 7: distribuição e hardening

- O ADR 017 escolheu NSIS por usuário como instalador principal e uma variante
  separada com o instalador offline do WebView2; MSI fica reservado a uma
  necessidade futura de implantação corporativa.
- Downgrades foram bloqueados. Os instaladores usam português do Brasil com
  inglês como fallback e não alteram a localização do banco no perfil.
- Os dois pacotes x64 foram gerados localmente: padrão com 3.916.872 bytes e
  offline com 265.739.077 bytes; hashes estão em `environment.md`.
- Testes de desempenho reproduzíveis aprovaram o scheduler encadeado com 1.000
  tarefas em 39 ms e a projeção hierárquica de 10.000 tarefas em 5–6 ms neste
  host. Os limites de segurança são executados separadamente e no CI.
- As abas Tabela, Kanban e Gantt receberam foco roving e navegação por setas,
  Home e End, com teste de interface.
- O runner E2E oficial WebdriverIO/Tauri foi avaliado e retirado: a resolução
  atual introduzia 15 alertas altos somente em dependências de desenvolvimento.
  Produção não foi afetada e a auditoria voltou a zero. O E2E nativo permanece
  pendente de uma combinação segura.
- O workflow Windows agora valida os orçamentos de desempenho e gera o NSIS,
  cobrindo o empacotamento em vez de apenas o executável sem bundle.
- A validação de instalação, atualização, desinstalação e operação sem internet
  numa máquina limpa continua pendente e impede concluir a fase.
- Commit: `não commitado`; nenhum push, release ou alteração remota foi feita.

### 30 de agosto de 2026 — Verificação manual de atualização

- A release pública `v0.1.0` confirmou os nomes permanentes dos instaladores
  padrão e offline e o endpoint `releases/latest` do GitHub.
- **Ajuda > Verificar atualizações** consulta a API pública somente após clique,
  valida release estável, SemVer e presença do instalador esperado e compara a
  tag com a versão compilada.
- Quando existe versão superior, o download padrão ou offline é aberto no
  navegador. O aplicativo não baixa, executa ou instala conteúdo remoto.
- CSP e capability foram limitadas à API de releases e aos dois assets do
  repositório. Nenhum dado do workspace é enviado e o restante da aplicação
  continua integralmente offline.
- O plugin oficial Tauri Opener 2.5.4 foi adicionado localmente; a decisão está
  no ADR 018.
- A versão foi sincronizada em `0.1.1`; ela será a primeira release contendo o
  verificador e poderá detectar uma futura `0.1.2`.
- A publicação de backups verificados passou a repetir brevemente a troca
  atômica quando o Windows mantém um handle SQLite transitório. Os 29 testes
  Rust passaram duas vezes consecutivas após a correção.
- Testes cobrem comparação de versão, contrato da release, asset ausente,
  limite da API, versão atual, compilação à frente da release e abertura do
  download. O gate final aprovou 92 testes TypeScript/React, 2 testes de
  desempenho e 29 testes Rust/SQLite.
- Commit: `não commitado`; nenhuma tag, release ou alteração remota foi feita
  pelo agente.

### 31 de agosto de 2026 — Pacote local completo da v0.1.1

- Os instaladores NSIS padrão e offline foram recompilados com a versão
  `0.1.1` e os nomes permanentes usados pelo verificador de atualizações.
- A pasta ignorada `.local/distribution/v0.1.1/` reúne os dois instaladores,
  `SHA256SUMS.txt` e as notas completas para publicação.
- O instalador padrão possui 3.951.599 bytes e SHA-256
  `F172B2EE584E2E6B4AF52B671044BA2BA08BA98327AF4879EB3DE5239E134C5C`.
- O instalador offline possui 265.777.280 bytes e SHA-256
  `58A51FACA3AC7C789CDD29A42EB7B62120BE7ABC57673B674E68793CFCA74E06`.
- Ambos informam versão `0.1.1`; os hashes foram revalidados e a ausência de
  assinatura Authenticode permanece documentada.
- Nenhum commit, tag, push ou release remoto foi executado pelo agente.

### 1º de setembro de 2026 — Fluxo E2E mínimo em camadas

- O runner oficial foi reavaliado sem incorporar a resolução com 15 alertas npm
  altos. O driver externo, o provider incorporado e uma conexão CDP também foram
  ensaiados no executável real.
- O WebView2 151 falhou ao criar a janela automatizada com
  `HRESULT 0x800700AA`, regressão registrada upstream para versões 150+. Não foi
  aplicado downgrade global, patch não publicado ou enfraquecimento do gate.
- `npm run test:e2e` passou a combinar uma jornada completa de React/estado/
  domínio, com repositório isolado, e a suíte Rust real de SQLite, migrations,
  transações e portabilidade.
- A jornada cria projeto, cinco tarefas com subtarefa e A → B → C, comprova
  propagação, alterna Tabela/Kanban/Gantt, duplica árvore, exporta, esvazia,
  importa e compara o resultado semântico.
- O harness desktop foi preservado como `npm run test:e2e:desktop`, isolado em
  `.local/e2e/`, mas permanece diagnóstico e fora do CI até a correção upstream.
- O gate em camadas foi adicionado ao quality gate Windows. O ADR 019 registra
  os limites de cobertura e a decisão de segurança.
- Gates locais aprovados: 92 testes TypeScript/React regulares, 1 jornada E2E,
  2 testes de desempenho, 30 testes Rust/SQLite, lint, typecheck, Cargo
  fmt/check/Clippy, auditoria npm sem vulnerabilidades e build NSIS de produção.
- Commit: `não commitado`; nenhum push ou release foi executado pelo agente.

### 1º de setembro de 2026 — Auditoria final de UX e acessibilidade

- A auditoria consolidada foi registrada em
  [ux-accessibility.md](ux-accessibility.md), com roteiro reproduzível para a VM.
- A aplicação recebeu link de salto, projeto atual identificável, legenda da
  Tabela e estados expandidos para hierarquia e detalhes.
- Menus fecham com `Esc`; diálogos prendem o foco, começam em uma ação segura e
  restauram o foco ao acionador. A restauração destrutiva inicia em **Cancelar**.
- Kanban mantém alternativa de teclado ao arrastar, anuncia salvamento e exibe
  datas localizadas. Textos densos ganharam tamanho e contraste, com suporte a
  cores forçadas e redução de movimento.
- A janela Tauri recompilada teve sua árvore de acessibilidade inspecionada. O
  layout também foi verificado em 1024 × 720 e 960 px sem overflow horizontal
  global; a Tabela conserva sua rolagem interna deliberada.
- Testes regulares passaram de 92 para 94, com cobertura específica dos
  comportamentos de foco e semântica.
- Passaram também a jornada E2E, 30 testes Rust/SQLite, 2 testes de desempenho,
  lint, typecheck, build web, Cargo fmt/check/Clippy, auditoria npm sem
  vulnerabilidades e empacotamento NSIS padrão. O `.exe` compartilhado de teste
  foi recompilado por último.
- Commit: `não commitado`; nenhum push, tag ou release foi executado pelo agente.

### 1º de setembro de 2026 — Preparação local da v0.1.2 e correção do CI

- O run `33470898672` falhou porque a suíte Rust era executada duas vezes no
  mesmo job e o Windows reteve temporariamente o arquivo validado de backup na
  segunda passagem (`os error 32`). As etapas posteriores apareceram como
  ignoradas; não eram jobs independentes com falhas distintas.
- A troca atômica do backup agora repete somente erros transitórios Windows 5 e
  32, com espera limitada. O teste afetado passou cinco vezes consecutivas.
- O quality gate mantém os 30 testes Rust/SQLite na etapa nativa e executa
  apenas a jornada React/domínio na etapa E2E, eliminando trabalho duplicado.
- O gate local equivalente ao CI aprovou 94 testes regulares, 30 testes
  Rust/SQLite, 2 testes de desempenho, 1 jornada E2E, lint, typecheck, Cargo
  fmt/check/Clippy e os builds NSIS padrão e offline.
- Os dois instaladores `v0.1.2`, hashes e notas de release estão em
  `.local/distribution/v0.1.2/`. Nenhum commit, push, tag ou release remoto foi
  executado pelo agente.

### 1º de setembro de 2026 — Compatibilidade UTC e manutenção do instalador

- A validação do domínio passou a aceitar e normalizar o offset UTC `+00:00`
  produzido por versões anteriores da camada Rust, além do formato canônico
  terminado em `Z`.
- Novos timestamps nativos e manifests são gerados diretamente com `Z`. Outros
  fusos continuam rejeitados porque timestamps de auditoria são UTC.
- O instalador em português agora apresenta **Reparar instalação** para a mesma
  versão e identifica **Atualizar sem desinstalar (recomendado)** ao encontrar
  uma versão anterior; downgrade permanece bloqueado.
- O updater oficial Tauri foi incorporado em modo `passive`, com consulta manual,
  download, verificação de assinatura, instalação e reinício. `latest.json` usa
  o instalador padrão permanente da release.
- A chave privada permanente foi gerada em `.local/secrets/`, fora do Git, e a
  chave pública foi incorporada ao aplicativo. A cópia externa segura da chave
  privada continua obrigatória antes da publicação.
- Os instaladores padrão e offline, suas assinaturas, `latest.json`, hashes e
  notas da `v0.1.3` foram gerados em `.local/distribution/v0.1.3/`.

### 1º de setembro de 2026 — Menu de atalhos e fechamento consistente

- **Ajuda > Atalhos de teclado** passou a reunir os comandos de navegação já
  disponíveis, sem anunciar comportamentos ainda inexistentes.
- `Ctrl+/` abre a referência de atalhos de qualquer ponto da aplicação; o
  diálogo mantém foco preso, fecha com `Esc` e restaura o foco ao acionador.
- `Esc` também recolhe os detalhes expandidos de uma tarefa e devolve o foco ao
  botão **Detalhes** da linha correspondente.
- A cobertura regular passou a 97 testes TypeScript/React, incluindo abertura
  pelo menu e teclado, fechamento do diálogo e fechamento dos detalhes.
- O arraste do Kanban foi refeito com uma alça baseada em Pointer Events,
  removendo a dependência do HTML Drag and Drop que exibia o cursor de proibido
  no WebView2. O destino é realçado e **Status** permanece como alternativa.
- O Gantt passou a interceptar movimento, redimensionamento e ligação visual sem
  delegar scheduling ao renderer. Tarefas livres podem mover início/fim;
  tarefas com predecessora aceitam somente mudança do fim; resumos são
  bloqueados; ligações novas são apenas FS com lag zero.
- A cobertura regular passou a 106 testes. `npm run check`, o E2E da aplicação,
  os limites de desempenho, build web, 30 testes Rust, `cargo fmt`, Clippy e o
  build Tauri de teste passaram em 1º de setembro de 2026.
- No executável real, o arraste do Kanban e a borda final do Gantt foram
  persistidos e depois restaurados aos valores originais no banco de teste.
- A integração do Gantt deixou de cancelar o evento final do renderer: movimento,
  término, conclusão e ligação permanecem visíveis enquanto são persistidos. Os
  eventos internos usados pelo SVAR para recalcular resumos são ignorados como
  comandos de usuário, evitando reconstrução prematura da projeção.
- O marcador de conclusão agora persiste percentuais entre 0% e 100%. A
  cobertura regular passou a 108 testes, incluindo a separação entre gesto do
  usuário e recálculo interno de resumo.
- O movimento de tarefas `AUTO` com predecessoras passou a converter a data
  solicitada em lag FS não negativo. Com múltiplas predecessoras, somente a
  controladora aumenta no adiamento e todas as restrições necessárias diminuem
  na antecipação; lag zero define o limite mínimo.
- O Gantt ganhou feedback visível e histórico local de cronograma/conclusão com
  **Desfazer**, **Refazer**, `Ctrl+Z` e `Ctrl+Y`. Cada restauração reutiliza a
  transação do scheduler e recalcula a cascata.
- A cobertura regular passou a 114 testes antes da validação final desta
  entrega. SS, FF e SF não foram introduzidos.
- O Gantt passou a normalizar movimentos em dias não permitidos para a próxima
  data válida do calendário. Um menu de contexto próprio substitui as opções do
  navegador na área do gráfico: tarefas podem receber predecessora FS e linhas
  de dependência podem ser excluídas por alvos maiores. A cobertura regular
  passou a 117 testes.
- A criação de FS foi consolidada no menu de contexto da tarefa, com opções
  limitadas às tarefas que terminam antes dela. A conversão dos identificadores
  codificados pelo renderer para os UUIDs persistidos corrigiu seleção e
  exclusão de linhas no Gantt.
- O foco de dependência passou de filtro para realce: a relação selecionada fica
  evidente, enquanto as demais permanecem visíveis, atenuadas e selecionáveis.
- Commit: `não commitado`; nenhum push, tag ou release foi executado pelo agente.

### 8 de setembro de 2026 — Preparação da v0.1.6

- Manifests alinhados em `0.1.6`; schema SQLite permanece 4.
- A auditoria automatizada da janela desktop passou a cobrir escalas simuladas
  de 125% e 150%, estrutura acessível, atalhos e fechamento com `Esc`.
- Foram aprovados 122 testes regulares, 30 Rust/SQLite, 1 jornada E2E em
  camadas, 2 testes de desempenho e 5 cenários Tauri/WebView2 reais.
- Instaladores padrão e offline assinados foram preparados localmente em
  `.local/distribution/v0.1.6/`; a publicação não foi executada.
- Escala real do Windows e leitura com Narrador continuam como verificações
  manuais da VM, sem serem apresentadas como concluídas.
- Commit: `não commitado`; nenhum push, tag ou release foi executado pelo agente.

### 9 de setembro de 2026 — Relatórios PDF e gate pós-release da v0.1.7

- A versão passou a gerar localmente relatórios PDF em A4 ou A3, nos formatos
  executivo completo, lista de atividades ou cronograma Gantt.
- O relatório preserva hierarquia, datas, progresso, predecessoras, indicadores,
  descrições e o recorte de filtros ou período escolhido pelo usuário.
- A geração foi isolada do domínio React, carregada sob demanda e salva pelo
  seletor nativo do Windows; nenhum dado é enviado para serviços externos.
- A falha do workflow da tag `v0.1.6` foi identificada como retenção transitória
  do arquivo de backup SQLite pelo Windows (`os error 32`). A publicação passa a
  usar uma cópia intermediária independente se a troca atômica continuar
  bloqueada após as tentativas limitadas.
- `AGENTS.md`, o processo de release e um verificador PowerShell agora exigem
  acompanhar especificamente o CI da tag. Um CI verde de `main` não encerra essa
  verificação.
- O Gantt do PDF recebeu cabeçalho diário em português, faixas alternadas,
  finais de semana e linhas FS com indicação para origens fora da página ou do
  período.
- Instaladores padrão e offline assinados, manifesto, hashes, notas e script de
  publicação foram preparados em `.local/distribution/v0.1.7/`.
- Commit: `não commitado`; nenhum push, tag ou release foi executado pelo agente.

### 9 de setembro de 2026 — Consolidação do roadmap pós-MVP

- Fases 8 a 12 organizadas por dependência de domínio: controle do plano,
  análise do cronograma, progresso e marcos, produtividade e interoperabilidade.
- Baseline, desvios, prazos-limite, caminho crítico, folgas, explicação do
  scheduler, marcos, visões salvas, edição em massa, histórico e CSV/XLSX foram
  incorporados ao plano futuro.
- O progresso calculado de tarefas-resumo será ponderado pela duração útil dos
  filhos, sem introduzir esforço em horas.
- Controle de tempo, gestão de recursos, carga de trabalho e esforço em horas
  foram explicitamente retirados do roadmap por decisão de produto.
- O fechamento da Fase 7 e a validação da v0.1.7 continuam precedendo qualquer
  implementação da Fase 8.
- Commit: `não commitado`; alteração exclusivamente documental.

### 10 de setembro de 2026 — Fase 8 pronta para auditoria

- A migration 5 adicionou prazo-limite e linhas de base nomeadas, com uma
  fotografia ativa e histórico preservado por projeto.
- A Tabela compara início e fim planejados ao cronograma corrente, calcula o
  desvio em dias úteis e classifica a saúde do prazo sem alterar o scheduler.
- O Gantt desenha a fotografia ativa atrás das barras correntes e o PDF pode
  incluir plano, atual, desvio, prazo e saúde.
- Exportação, importação seletiva, cópia de projeto, backup e restauração
  preservam os novos dados. Arquivos do schema 4 são lidos por uma cópia
  temporária; um teste por hash comprova que o original não é modificado.
- A versão avançou para `0.1.8` e o schema para 5. A Fase 9 não foi iniciada.
- Commit: `não commitado`; nenhum push, tag ou release foi executado.

### 11 de setembro de 2026 — Identidade visual inserida como próxima fase

- A criação e aplicação de um novo ícone profissional deixou de ser uma ideia
  avulsa e passou a constituir a Fase 9, com critérios de aprovação visual,
  acessibilidade, integração Windows e distribuição.
- As antigas Fases 9 a 12 foram preservadas integralmente e renumeradas como
  Fases 10 a 13; seus checkpoints e versões-alvo sugeridas foram deslocados na
  mesma ordem.
- A Fase 8 permanece em auditoria e nenhuma implementação da nova Fase 9 foi
  iniciada.
- Commit: `não commitado`; alteração exclusivamente documental.

### 12 de setembro de 2026 — Fase 8 concluída e v0.1.8 preparada

- A auditoria foi ampliada para um projeto com 205 tarefas em quatro níveis,
  com datas e predecessoras suficientes para validar Kanban e Gantt.
- A navegação do Gantt foi corrigida na cadeia real de alturas do SVAR: a janela
  permanece em 590 px, o conteúdo completo mantém 8.682 px e a posição vertical
  alcança o limite de 8.092 px até a tarefa `5.4.3.2`.
- A roda do mouse e barras horizontal e vertical foram validadas; a barra
  vertical ocupa uma coluna própria entre o gráfico e o inspetor, sem sobrepor
  conteúdo, com trilho visual de 4 px e área de clique ampliada.
- Gates aprovados: 136 testes TypeScript/React, 37 testes Rust/SQLite, jornada
  E2E em camadas, 2 cenários de desempenho, ESLint, TypeScript, Cargo
  fmt/check/Clippy e auditoria npm sem vulnerabilidades conhecidas.
- O E2E desktop via CDP repetiu a limitação diagnóstica documentada no ADR 019;
  a janela real e a rolagem foram exercitadas separadamente com sucesso.
- Instaladores NSIS padrão e offline foram gerados localmente. Assinaturas do
  updater e `latest.json` aguardam a chave privada externa ao repositório.
- A Fase 8 foi encerrada. A Fase 9 não foi iniciada.
- Commit: `não commitado`; nenhum push, tag ou release foi executado.

### 24 de setembro de 2026 — Identidade visual pronta para release

- Foi aprovado um relógio mecânico original em forma de `C`, com mostrador
  azul-marinho, metal dourado, arco ciano e extensões em 12, 9 e 6 horas.
- A escala recebeu marcadores principais proporcionais, quatro pautas menores
  entre intervalos de cinco minutos e orientação radial coerente.
- A profundidade visual passou a respeitar mostrador, escala, aros, filigranas,
  pontes, rubis e ponteiros nessa ordem.
- O conjunto de ícones do Tauri foi regenerado; a interface passou a usar o
  símbolo no topo, no estado vazio e como controle da barra recolhida.
- O marcador provisório `PF` e a repetição de **Chrono Project** na barra
  lateral foram removidos.
- ESLint, TypeScript, 140 testes e build Vite foram aprovados. A inspeção de 32
  e 128 px confirmou o contorno do `C`.
- ADR 024 e `docs/branding.md` registram decisão, uso, arquivos e critérios.
- Executável, instaladores, atualização e integração Windows ainda precisam do
  gate de distribuição antes do encerramento da fase.
- Commit: `não commitado`; nenhum push, tag ou release foi executado.

### 2 de outubro de 2026 — Edição segura de datas

- A Tabela passou a aceitar somente datas completas e válidas antes de chamar
  o domínio de scheduling. Estados intermediários produzidos pelo controle
  nativo durante a digitação do ano não apagam nem recalculam a tarefa.
- Ao abandonar uma entrada parcial, o campo restaura a última data válida.
- A recuperação visual já aplicada ao Gantt passou a envolver também Tabela e
  Kanban, evitando uma área vazia caso uma renderização futura falhe.
- Foi adicionada regressão automatizada para o ano intermediário `0002`; a
  interface permanece disponível e aceita a data completa digitada em seguida.
- ESLint, TypeScript, 141 testes regulares, jornada E2E da aplicação e build
  Vite foram aprovados. Não houve mudança de schema ou código nativo.
- Commit: `não commitado`; nenhuma operação remota foi executada.

### 2 de outubro de 2026 — Ações rápidas e rolagem permanente

- O botão de confirmação de predecessora passou a usar `+` preto, tooltip
  correto e nome acessível contextual.
- Uma barra horizontal sincronizada e aderente à base visível da Tabela passou
  a controlar as mesmas colunas sem exigir navegação até a última tarefa.
- Um componente reutilizável de menu contextual passou a atender linhas da
  Tabela e cartões do Kanban; o Gantt conserva seu menu especializado existente.
- Tabela oferece detalhes, subtarefa, predecessora, duplicação, template e
  exclusão; Kanban oferece mudança de status, duplicação e exclusão.
- Os menus abrem por clique direito ou botão **Mais ações**, suportam teclado e
  restauram o foco. Campos editáveis continuam usando o menu nativo.
- ESLint, TypeScript, 143 testes regulares, jornada E2E e build Vite foram
  aprovados. Não houve mudança de schema ou regra de scheduling.
- Commit: `não commitado`; nenhuma operação remota foi executada.

### 2 de outubro de 2026 — Salvamento automático da Tabela

- Seleções e datas completas passaram a persistir assim que confirmadas; texto,
  números e campos longos usam pausa de 700 ms e também salvam ao perder foco.
- A troca de visualização captura o rascunho antes de desmontar a Tabela, sem
  bloquear a navegação enquanto a escrita local termina.
- Gravações da mesma tarefa são serializadas. Uma resposta antiga não limpa nem
  sobrescreve uma edição mais recente feita enquanto a primeira estava em curso.
- Cada linha informa **Alterada**, **Salvando…**, **Salva** ou **Erro ao salvar**.
  Em falha, o valor permanece no campo e o botão **Salvar** permite nova tentativa.
- Autosave valida o rascunho antes da escrita; datas parciais e cronogramas
  incompletos permanecem locais até serem corrigidos ou submetidos manualmente.
- ESLint, TypeScript, 149 testes regulares, jornada E2E da aplicação e build
  Vite foram aprovados. Não houve mudança de schema ou código nativo.
- Commit: `não commitado`; nenhuma operação remota foi executada.

### 2 de outubro de 2026 — Trava de datas e predecessoras-resumo

- O modo `AUTO`/`MANUAL` passou a ser apresentado como cadeado aberto/fechado
  na Tabela, nos detalhes e nos menus de contexto da Tabela e do Gantt.
- Tarefas travadas rejeitam movimento e redimensionamento no Gantt com mensagem
  explícita, mas continuam aceitando datas exatas pelos campos acessíveis.
- Tarefas-resumo passaram a ser aceitas como predecessoras FS e continuam
  proibidas como sucessoras; o grafo combina dependências e hierarquia para
  validar ciclos e ordenar a propagação.
- Ao criar a primeira subtarefa, relações de saída podem permanecer no resumo,
  ser transferidas ou removidas. Novas irmãs não deslocam relações diretas de
  folhas e relações de saída de um resumo existente são preservadas.
- O ADR 025 e a migration `0006_summary_predecessors.sql` consolidam a decisão.
  Importação lê schemas 4 e 5 por upgrade temporário e o schema corrente é 6.
- Foram aprovados 157 testes TypeScript/React, 38 testes Rust, `cargo fmt`,
  `cargo check`, Clippy, jornada E2E e build Vite de produção. O teste de
  desempenho reagendou 1.000 tarefas em 31 ms e projetou 10.000 em 6 ms.
- Commit: `não commitado`; nenhuma operação remota foi executada.

### 3 de outubro de 2026 — Prévia de impacto, edição em massa e histórico do Gantt

- Relações com tarefas-resumo passaram a exigir confirmação sobre uma prévia
  determinística das datas alteradas antes de escrever no workspace.
- A Tabela ganhou trava/destrava em massa para folhas selecionadas e o atalho
  `Ctrl+Shift+L`, documentado também na ajuda da aplicação.
- O Gantt passou a persistir, por projeto, até 50 revisões de desfazer/refazer;
  a migration `0007_persistent_gantt_history.sql` elevou o schema para 7.
- Importação aceita schemas 4 a 7 e migra 4 a 6 apenas em cópia temporária. Uma
  cópia do banco instalado pela versão 0.2.1 foi atualizada e verificada sem
  qualquer escrita no arquivo original.
- O E2E desktop encontrou uma corrida ao editar uma predecessora imediatamente
  após criar A → B → C. O estado atual do grafo agora é sincronizado antes da
  próxima interação e o teste compara também o conteúdo persistido no SQLite.
- Commit: `não commitado`; nenhuma operação remota foi executada.

### 3 de outubro de 2026 — Candidato de distribuição 0.2.2

- Versões npm, Cargo e Tauri foram alinhadas em 0.2.2; o schema permanece 7 e
  o formato `.chronoproject` permanece 1.
- Os gates finais aprovaram 161 testes TypeScript/React, 39 testes Rust, lint,
  typecheck, auditoria npm sem vulnerabilidades, Cargo fmt/check/Clippy, jornada
  E2E, cinco cenários Tauri/WebView2 e os dois testes de desempenho.
- Foram gerados o executável avulso, o instalador padrão de 7.319.198 bytes e o
  instalador offline de 222.348.571 bytes. Os dois instaladores estão assinados
  para o updater e seus manifestos e hashes foram aprovados em modo `-VerifyOnly`.
- O instalador padrão atualizou a instalação local em 1,32 s. A aplicação abriu
  e encerrou normalmente, com backup anterior e preservação do banco durante as
  migrations. Commit, push, CI de `main`, tag e publicação não foram executados.

### 5 de outubro de 2026 — Consistência de barras e menus

- A versão 0.2.2 já publicada permaneceu imutável; a correção foi aberta para o
  próximo patch.
- A barra horizontal nativa da Tabela foi eliminada, deixando somente o controle
  fixo e sincronizado. Touchpad e `Shift` + roda continuam percorrendo colunas.
- O clique direito em caixas de texto deixou de abrir o menu escuro do WebView2.
  O menu claro do Chrono oferece recortar, copiar, colar e selecionar tudo antes
  das ações da tarefa.
- Foram auditados `overflow`, menus de contexto e botões em Tabela, Kanban,
  Gantt, projetos e diálogos. Não foram encontradas outras barras concorrentes
  ou superfícies nativas escapando da identidade visual.
- ESLint, TypeScript, 162 testes TypeScript/React, jornada E2E e 39 testes Rust
  foram aprovados. O build desktop também passou; os cinco cenários WebView2
  não chegaram à interface porque o runtime não expôs CDP em 20 segundos. Não
  houve mudança de schema ou dados.
- Commit: `não commitado`; nenhuma operação remota foi executada.
- A revisão crítica adicionou tratamento explícito de falhas do clipboard,
  restauração de foco, cobertura dos demais controles de formulário, seed
  determinístico do cronograma artificial e proteção contra arquivar um
  executável de produção como inspeção. A massa validada contém 205 tarefas,
  119 relações FS, nenhuma violação referencial e nenhum ciclo.

### 5 de outubro de 2026 — Candidato de distribuição 0.2.3

- A conclusão de atividades passou a registrar a data real, exigir confirmação
  nas três visualizações e distinguir conclusão no prazo ou com atraso. Reabrir
  limpa a data real e solicita novo progresso; tarefas-resumo com descendentes
  abertos não podem ser concluídas.
- A migration `0008_task_completion.sql` elevou o schema para 8, normalizou
  conclusões existentes e preservou a importação dos schemas 4 a 7.
- Versões npm, Cargo e Tauri foram alinhadas em 0.2.3. Foram aprovados 171 testes
  TypeScript/React, 39 testes Rust, E2E, desempenho, lint, typecheck, auditoria
  npm, Cargo fmt/check/Clippy e as assinaturas dos dois instaladores.
- O executável, o instalador padrão e o instalador offline foram gerados no
  staging v0.2.3 com hashes documentados. O cache nativo versionado do WebView2
  passou a ser a política oficial para evitar downloads repetidos do mesmo
  redistribuível.
- Commit, push, CI, tag e publicação ainda não foram executados.

### 5 de outubro de 2026 — Candidato de distribuição 0.2.4

- A coluna Tarefa ganhou largura inicial de 380 pixels, redimensionamento por
  arrasto e teclado, persistência local e restauração por duplo clique.
- Prioridade, Progresso, Duração e Prazo-limite foram ampliadas apenas o
  necessário para manter seus botões de informação visíveis.
- O menu de contexto de projeto passou a exportar diretamente um pacote
  `.chronoproject`, reutilizando o mesmo fluxo aceito pela importação.
- `source-map-js` foi atualizado de 1.2.1 para 1.2.2 após uma vulnerabilidade
  alta detectada pela auditoria npm; a repetição retornou zero vulnerabilidades.
- Foram aprovados 173 testes TypeScript/React, 39 testes Rust, E2E, desempenho,
  lint, typecheck, Cargo fmt/check/Clippy e os três binários de distribuição.
- Executável e instaladores padrão/offline v0.2.4 foram gerados, assinados,
  verificados e promovidos para a pasta final. Commit, push, CI, tag e
  publicação permanecem reservados ao usuário.

### 6 de outubro de 2026 — Publicação 0.2.4 e piloto visual Chrono

- A versão 0.2.4 foi publicada no commit `a76e865`, reutilizando com sucesso o
  CI de `main`; a tag não criou uma segunda execução do quality gate.
- A direção visual passou a exigir uma identidade reconhecível mesmo sem o
  logotipo, evitando a composição genérica de dashboards e interfaces geradas
  pela repetição de padrões prontos.
- A primeira etapa criou tokens próprios em tinta, papel, latão e ciano e os
  aplicou ao shell, barra lateral, menus superiores, cabeçalho, filtros, abas e
  Tabela. Cantos, sombras e estados foram contidos para reforçar a sensação de
  instrumento desktop de planejamento.
- Após as inspeções do piloto, a moldura passou a seguir uma aplicação Windows:
  barra compacta com recolhimento, voltar/avançar e menus Arquivo, Editar e
  Exibir; trilho lateral para Tabela, Kanban e Gantt; painel de projetos simples
  entre esse trilho e o conteúdo. Numeração, descrições e ícones ornamentais dos
  menus foram removidos.
- As superfícies laterais e as três visualizações foram harmonizadas com os
  mesmos fundos, bordas, raios, foco e paleta funcional.
- Menus, formulários, diálogos, mensagens e estados passaram pelo mesmo ajuste
  cromático: neutros firmes, ciano-petróleo e dourado, com verde, âmbar e
  vermelho reservados à semântica. A composição evita grandes áreas pastéis.
- A coluna Predecessoras passou a aceitar redimensionamento por arrasto e
  teclado, persistência local e restauração por duplo clique, seguindo o mesmo
  contrato acessível da coluna Tarefa.
- Kanban, Gantt e diálogos permanecem fora deste piloto e serão convertidos
  progressivamente após inspeção com dados reais, largura mínima e escala do
  Windows.
- ESLint, TypeScript, 173 testes e build Vite foram aprovados. Não houve mudança
  de regra de negócio, schema, código nativo ou formato de exportação.
- Commit do piloto: `não commitado`; nenhuma nova operação remota foi executada.

### 6 de outubro de 2026 — Candidato de distribuição 0.2.5

- A composição desktop aprovada foi consolidada em barra superior, trilho de
  visualizações, painel intermediário de projetos e área de trabalho unificada.
- Tarefa e Predecessoras passaram a aceitar larguras persistentes; plano de
  referência e PDF foram integrados ao cabeçalho; a barra horizontal da Tabela
  voltou a permanecer acessível em projetos longos.
- A versão foi sincronizada em 0.2.5 sem mudança de schema, scheduler ou formato
  `.chronoproject`.
- Foram aprovados 173 testes TypeScript/React, 39 testes Rust, E2E, desempenho,
  lint, typecheck, auditoria npm, Cargo fmt/check/Clippy e os três binários de
  distribuição.
- Executável e instaladores padrão/offline foram gerados, assinados, verificados
  e promovidos para `v0.2.5`. Commit, push, CI, tag e publicação permanecem
  reservados ao usuário.

### 6 de outubro de 2026 — Histórico unificado após a publicação 0.2.5

- A versão 0.2.5 permaneceu imutável após sua publicação no commit `8d1e6d3`.
- A próxima correção passou a manter até 50 edições de tarefas por projeto na
  sessão atual, compartilhadas por Tabela, Kanban e Gantt.
- `Ctrl+Z` desfaz e `Ctrl+Shift+Z` refaz prioridades, status, progresso, textos,
  datas e outras edições salvas; campos de texto continuam usando o desfazer
  nativo enquanto estão em edição.
- O histórico registra também todas as tarefas-resumo e sucessoras alteradas
  pelo scheduler, além de mudanças de lag realizadas no mesmo salvamento, e
  restaura o conjunto em uma transação.
- Os botões **Desfazer** e **Refazer** do Gantt foram conectados à mesma pilha,
  eliminando a divergência do antigo histórico exclusivo de gestos do gráfico.
- Naquele incremento, criação, exclusão, reordenação, dependências e importação
  ainda permaneciam fora do histórico; a limitação foi superada parcialmente
  pelo incremento de 7 de outubro descrito abaixo.

### 7 de outubro de 2026 — Seletor hierárquico de predecessoras

- Um projeto real revelou que o seletor usava a ordem bruta do banco e separava
  resumos de seus descendentes, tornando ambíguas tarefas homônimas como
  `1.2.1.3 Comando` e `1.2.2 Comando`.
- As opções passaram a seguir a mesma travessia hierárquica da Tabela: pai,
  descendentes e somente depois a próxima tarefa irmã.
- Candidatas que criariam ciclos, incluindo ancestrais da sucessora, deixaram de
  ser apresentadas; duplicidades e a própria tarefa continuam excluídas.
- Falhas de gravação ou validação concorrente agora aparecem junto ao controle,
  eliminando o clique silencioso no botão `+`.
- O seletor foi evoluído para um diálogo pesquisável por número ou título, com
  checkboxes, indicação de resumo, relações existentes e seleção múltipla.
- A prévia calcula o impacto combinado do lote; uma confirmação grava relações
  e cascata do scheduler em uma única transação.
- `Ctrl+Z`/`Ctrl+Shift+Z` desfaz e refaz o lote completo. O histórico cobre
  também remoção de predecessora, duplicação, exclusão e reordenação de tarefas,
  incluindo restauração de entidades e relações removidas.
- **Editar** mostra Desfazer/Refazer com a descrição da operação, como
  **3 predecessoras adicionadas a 1.2.2.1. Local**.
- Os filtros compartilhados ganharam seleção exata de responsável, preenchida
  pelos nomes existentes no projeto.
- As larguras mínimas das colunas foram revistas para não cortar cabeçalhos.
- Testes de regressão cobrem o lote de três predecessoras como uma operação,
  além de desfazer/refazer reordenação, duplicação e exclusão com dependência.

### 7 de outubro de 2026 — Caminho crítico e produtividade do planejamento

- O domínio passou a calcular caminho crítico e folga total em dias úteis sobre
  tarefas-folha e relações FS, incluindo redes desconectadas e projeção da menor
  folga para tarefas-resumo.
- A Tabela marca tarefas críticas sem criar uma nova coluna; o Gantt usa
  contorno sólido ou tracejado além da cor. O filtro compartilhado permite
  mostrar tarefas críticas ou com até dois dias úteis de folga.
- O filtro de responsáveis aceita múltiplos nomes e tarefas sem responsável.
- Relações existentes podem ser selecionadas para remoção ou alteração de lag
  em massa, preservando transação única e um único `Ctrl+Z`.
- **Editar > Histórico de alterações** apresenta até 12 operações recentes da
  sessão e distingue as que foram desfeitas.
- A hierarquia foi ampliada de quatro para cinco níveis no domínio, templates,
  Tabela e Gantt.
- Avisos globais de erro passaram a aparecer como alerta compacto e descartável,
  sem deslocar toda a área de trabalho.
- Visões salvas continuam como `to-do`; a auditoria de desempenho foi adiada
  até o encerramento dos incrementos funcionais, conforme decisão do usuário.
- Não houve mudança de schema. Commit e operações remotas não foram executados.

### 7 de outubro de 2026 — Massa complementar e comportamento dos menus

- O banco local recebeu o projeto isolado **Auditoria — planejamento avançado**,
  com 15 tarefas, cinco níveis, seis relações FS, uma sucessora com quatro
  predecessoras, predecessora-resumo, lag, quatro responsáveis e três tarefas
  sem responsável.
- O gerador `npm run dev:seed-advanced-audit` é idempotente, recria somente esse
  projeto e valida a integridade do SQLite antes e depois da transação.
- Antes da primeira execução foi criado um backup byte a byte com SHA-256
  idêntico em `.local/backups/chronoproject-before-advanced-audit-20261007-160223.sqlite`.
- Os menus superiores agora fecham ao clicar fora da barra, além do fechamento
  por `Esc` já existente, sem interferir nos controles internos dos painéis.
- O painel **Detalhes** foi reorganizado como inspetor inline de estrutura,
  agenda, conteúdo e reutilização. Ele permanece aberto durante a edição e
  fecha somente pelo comando explícito ou por `Esc`.
- Commit e operações remotas não foram executados.

### 7 de outubro de 2026 — Caminho crítico e margem da meta final

- Cada projeto passou a possuir uma preferência persistente para ativar ou
  desativar a análise do caminho crítico. A meta final é derivada do maior
  prazo-limite entre suas tarefas não canceladas.
- A folga das tarefas é calculada sobre a rede: zero identifica a sequência que
  controla o término e valores positivos mostram quanto um ramo pode atrasar.
- A margem global é calculada separadamente contra o maior prazo-limite: valores
  positivos mostram reserva e valores negativos mostram ultrapassagem prevista.
- Alterar somente um prazo-limite não muda quais tarefas pertencem ao caminho
  crítico.
- Um switch deslizante no cabeçalho, junto ao plano de referência, ativa a
  análise imediatamente e abre a explicação ao ser ligado. Um diálogo informativo
  reúne meta automática, margem e uma rede com bifurcação, convergência, durações
  e alternativa textual. A configuração não altera datas.
- Indicadores e filtro de cronograma ficam ocultos/desabilitados quando a análise
  não está disponível; Tabela e Gantt continuam consumindo a mesma projeção.
- O diálogo mostra, lado a lado, término previsto, meta final e margem global e
  explica o motivo exato quando ainda não existe informação suficiente para o
  cálculo.
- O Gantt associa a criticidade pelo identificador efetivo das barras da
  biblioteca, incluindo seu prefixo interno, para que os contornos crítico e
  quase crítico apareçam na linha do tempo.
- A migration `0009_project_critical_path.sql` preserva projetos existentes com
  o recurso desligado e sem meta. Exportação, importação, backup e duplicação
  carregam os novos campos.
- Pacotes dos schemas 4 a 8 continuam sendo atualizados em cópia temporária antes
  da leitura, sem mutar o arquivo original.
- Commit e operações remotas não foram executados.

### 10 de outubro de 2026 — Revisão integral do candidato 0.2.6

- A entrega acumulada foi revisada em domínio, estado, interface, persistência,
  portabilidade, migrations, testes e documentação; regras duplicadas da moldura
  e do Gantt foram consolidadas.
- A versão foi separada da v0.2.5 publicada e sincronizada como `0.2.6` nos cinco
  manifests. O schema permanece corretamente identificado como `9`.
- A legenda do Gantt foi mantida curta e a folga exata passou a ser validada no
  inspetor da tarefa, conforme o contrato visual aprovado.
- O teste unitário correspondente foi atualizado e a jornada E2E passou a usar
  o seletor pesquisável de predecessoras, eliminando dependência do controle
  inline removido.
- Foram aprovados 191 testes TypeScript/React, 39 testes Rust, 1 jornada E2E,
  2 testes de desempenho, lint, typecheck, build web, Cargo fmt/check/Clippy e
  auditoria npm sem vulnerabilidades.
- O roteiro manual consolidado está em `docs/releases/next.md`. Executável,
  instaladores, assinaturas e hashes serão registrados somente após essa
  validação; commit, push e publicação continuam reservados ao usuário.

### 10 de outubro de 2026 — Candidato 0.2.6 pronto para handoff

- A validação manual final foi aprovada com dados reais, incluindo o intervalo
  individual de cada predecessora e o retorno dos filtros ao arranjo compacto,
  sem o controle redundante de conclusão.
- A bateria final aprovou 191 testes TypeScript/React, a jornada E2E, 39 testes
  Rust com 1 caso histórico ignorado, 2 testes de desempenho, lint, typecheck,
  build web, auditoria npm, Cargo fmt/check/Clippy e build de distribuição.
- O executável foi gerado sem `shared-dev-data`; os instaladores padrão e
  offline foram assinados e verificados contra a chave pública incorporada.
- `latest.json`, `BUILD_RECORD.json`, `SHA256SUMS.txt`, notas e scripts de
  assinatura, verificação e publicação foram promovidos para a distribuição
  local v0.2.6 após duas validações `-VerifyOnly`.
- A política operacional passou a acompanhar gates com progresso por até dois
  minutos antes da pausa; prompts confirmados de assinatura continuam sendo
  comunicados imediatamente.
- Documentação interna e conteúdo externo do GitHub Release devem ser
  atualizados em todo release antes do handoff para commit e push.
- A retenção local manteve v0.2.6, v0.2.5 e v0.2.4; a cópia local da v0.2.3 foi
  removida após a promoção, permanecendo recuperável no GitHub.
- Commit, push, tag e publicação permanecem reservados ao usuário.

### 10 de outubro de 2026 — Apresentação bilíngue do repositório

- O README principal foi condensado como página de produto em PT-BR, usando a
  marca oficial, badges verificáveis, downloads permanentes e acesso rápido à
  documentação técnica.
- `README.en.md` apresenta o mesmo produto em inglês e informa explicitamente
  que a interface do aplicativo ainda está disponível apenas em português do
  Brasil.
- A política de branding passou a registrar o uso da marca, badges, links de
  download e topics no GitHub.
- A apresentação inicial declarou de forma transparente a ausência de licença;
  posteriormente, por decisão explícita do mantenedor, o projeto adotou MIT.

### 10 de outubro de 2026 — Licença aberta e formulários de Issue

- O código autoral passou a usar a licença MIT, registrada em `LICENSE`, nos
  manifestos npm/Cargo e no ADR 030.
- Os READMEs PT-BR e EN passaram a exibir o badge da licença e a orientar que
  contribuições aceitas são distribuídas sob os mesmos termos.
- O GitHub recebeu formulários bilíngues e estruturados para relatos de bugs e
  propostas de melhoria, com proteção explícita contra anexos contendo dados
  pessoais ou confidenciais.
- Issues em branco foram desabilitadas para manter relatos reproduzíveis e
  comparáveis.

### 10 de outubro de 2026 — Governança pública do repositório

- Foram adicionados guias bilíngues de contribuição, segurança, suporte e
  conduta, além do template de Pull Request e da propriedade padrão do código.
- Labels passaram a seguir os prefixos `type:`, `area:`, `priority:` e
  `status:`; o milestone v0.2.7 concentra o próximo incremento planejado.
- GitHub Discussions e o relato privado de vulnerabilidades foram definidos
  como canais próprios, evitando transformar dúvidas ou falhas de segurança em
  Issues comuns.
- Dependabot foi configurado semanalmente e de forma agrupada para npm, Cargo e
  GitHub Actions, sem criar tags ou repetir o fluxo de release.
- Após os primeiros PRs revelarem incompatibilidades reais entre TypeScript e
  ESLint, e entre `sqlx` direto e `tauri-plugin-sql`, os grupos foram reduzidos
  a stacks compatíveis. Majors passaram a ser individuais e os dois intervalos
  incompatíveis ficaram temporariamente bloqueados.
- Foi criado um ativo bilíngue para o Social Preview, preservando o símbolo
  oficial e a linguagem visual de precisão do produto; o upload na configuração
  do GitHub depende de uma sessão autenticada no navegador.

## Regras permanentes de acompanhamento


- Ler `AGENTS.md` e este documento antes de iniciar uma mudança não trivial.
- Confirmar `git status`, branch e histórico antes de editar.
- Trabalhar em um incremento delimitado de uma única fase.
- Não marcar um item como concluído sem evidência proporcional ao risco.
- Atualizar migrations, schema version e testes sempre que o banco mudar.
- Atualizar o histórico na mesma entrega que altera o estado do roadmap.
- Não apagar falhas ou decisões superadas; registrar a resolução em nova entrada.
- Não executar push, merge, tag ou release sem autorização explícita.
- Depois de uma publicação autorizada, confirmar que a tag aponta para o commit
  aprovado pelo CI de `main` e que ela não disparou o quality gate novamente.
- Não avançar automaticamente para a fase seguinte após concluir um checkpoint.
