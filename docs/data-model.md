# Modelo de dados

## Versão atual

O schema atual é a versão **5**.

| Migration | Conteúdo |
| --- | --- |
| `0001_initial.sql` | `app_metadata` e `schema_version = 1` |
| `0002_core.sql` | calendários, projetos, tarefas e tags; versão 2 |
| `0003_scheduling.sql` | exceções, calendário por tarefa e dependências FS; versão 3 |
| `0004_reuse.sql` | templates, itens, tags e dependências internas; versão 4 |
| `0005_plan_control.sql` | prazo-limite, linhas de base e fotografias de tarefas; versão 5 |

As tabelas usam modo `STRICT`. Chaves externas são habilitadas em todas as conexões. Migrations são crescentes e não devem ser alteradas depois de publicadas.

## Calendário

`calendars` armazena identidade, nome, indicador de padrão e timestamps. `calendar_working_days` normaliza os dias úteis como números de 1 a 7, de segunda a domingo.

`calendar_exceptions` acrescenta:

- UUID;
- calendário;
- data única por calendário em `YYYY-MM-DD`;
- indicador de dia útil ou não útil;
- nome opcional;
- timestamps.

O calendário padrão contém segunda a sexta. O calendário integrado **Todos os dias** é semeado pela migration 3 com os sete dias úteis.

## Projeto

`projects` possui UUID imutável, nome, descrição opcional, status, calendário, posição, arquivamento e timestamps.

| Código persistido | Rótulo da interface |
| --- | --- |
| `ACTIVE` | Ativo |
| `ON_HOLD` | Em espera |
| `COMPLETED` | Concluído |
| `CANCELLED` | Cancelado |

## Tarefa

`tasks` possui UUID imutável, código opcional, projeto, tarefa-pai, calendário opcional, título, descrição, status, prioridade, progresso, datas, duração, prazo-limite opcional, modo de agendamento, posição, responsável, observações e timestamps.

`deadline_date` é uma data `YYYY-MM-DD` independente do fim calculado. Ela
classifica a saúde da tarefa, mas não desloca o cronograma nem participa das
restrições FS.

`calendar_id` nulo significa herdar `projects.calendar_id`; um UUID preenchido seleciona um calendário específico para a tarefa.

Invariantes principais:

- progresso inteiro de 0 a 100;
- modo `AUTO` ou `MANUAL`;
- cronograma totalmente vazio ou com início, fim e duração juntos;
- datas em `YYYY-MM-DD`, duração inteira maior ou igual a 1 e fim não anterior ao início;
- pai e filho no mesmo projeto;
- sem auto-parentesco ou ciclos de hierarquia;
- no máximo quatro níveis de hierarquia, contando a tarefa-raiz;
- exclusão de uma tarefa remove toda a árvore em transação.

Tags permanecem normalizadas em `tags` e `task_tags`, sem JSON duplicado dentro de `tasks`.

O número hierárquico exibido como `1.`, `1.1.` ou `1.1.1.` é uma projeção
derivada de `parent_id` e `position`. Ele não é uma coluna, não altera o título
ou o código visual e é recalculado quando a árvore muda. Da mesma forma,
seleção, zoom, filtros e dependência em foco pertencem ao estado efêmero das
views e não são dados de negócio persistidos.

## Dependência

`task_dependencies` é uma entidade própria com:

- UUID;
- `project_id`;
- `predecessor_id`;
- `successor_id`;
- `dependency_type`, restrito a `FS` nesta migration;
- `lag_days`, inteiro não negativo;
- timestamps.

Integridade em profundidade:

- chaves estrangeiras compostas `(project_id, task_id)` impedem relações entre projetos;
- `CHECK` impede auto-dependência;
- índice único impede duplicar a mesma relação;
- triggers impedem dependências em tarefas-resumo;
- triggers impedem transformar em resumo uma tarefa que participa de dependências;
- domínio TypeScript rejeita relações ausentes, duplicadas e ciclos antes da escrita;
- exclusão de tarefa/projeto limpa relações por cascade.

## Templates

Templates pertencem ao workspace e são persistidos no mesmo SQLite, sem serem
convertidos em projetos ocultos:

- `task_templates`: identidade, nome, descrição e timestamps;
- `task_template_items`: árvore, duração, prioridade, status inicial e posição;
- `task_template_tags`: associação normalizada com `tags`;
- `task_template_dependencies`: relações FS e lag entre itens-folha do mesmo template.

O banco reforça UUIDs próprios, pai no mesmo template, ausência de
auto-dependência e relações únicas. O domínio TypeScript complementa essas
constraints validando raiz única, hierarquia acíclica, folhas com duração,
grafo FS acíclico e dependências estritamente internas.

## Linhas de base

`project_baselines` registra fotografias nomeadas de um projeto. Apenas uma
linha de base pode estar ativa por projeto; ao criar outra, a anterior recebe
`replaced_at` e permanece disponível no histórico.

`baseline_tasks` preserva, de forma imutável, identidade, título, número
hierárquico, início, fim, duração e progresso de cada tarefa no instante da
fotografia. A referência de tarefa não usa cascade deliberadamente: o
histórico continua legível mesmo se uma tarefa corrente for excluída. Edições
comuns nunca atualizam uma fotografia existente.

Ao excluir o plano de referência de um projeto, todas as suas revisões e
fotografias são removidas por cascade em uma única operação. Projetos, tarefas e
o cronograma corrente não são alterados.

## Integridade e evolução

- `projects.calendar_id` e `tasks.calendar_id` usam `ON DELETE RESTRICT`;
- calendário e exceções usam cascade controlado;
- índices atendem calendário, hierarquia, ordenação, filtros e travessia por predecessor/sucessor;
- banco novo, sequência de migrations e upgrades preservando dados até a versão 5 são testados;
- a única variante conhecida do checksum da migration 3 recebe reparo
  conservador antes da abertura: schema e integridade são validados, uma cópia
  SQLite é criada e somente `_sqlx_migrations.checksum` é atualizado;
- checksum ou schema desconhecido interrompe o reparo sem tocar nos dados de
  negócio;
- persistência de calendário, exceções, override, dependência e recalculações é testada;
- uma falha em qualquer item do `ScheduleChangeSet` reverte a transação inteira;
- persistência e exclusão de templates, duplicação atômica e rollback são testados;
- importação/exportação foi implementada na Fase 6 com validação e transações.

Ao alterar o schema, atualizar `schemaVersion`, criar migration nova, testar banco novo e upgrade, e revisar o impacto no pacote `.projectflow`.

O reparo de checksum não altera o schema nem substitui uma migration. Seu
contrato restrito e o local do backup estão documentados no
[ADR 011](decisions/011-migration-checksum-compatibility.md).
