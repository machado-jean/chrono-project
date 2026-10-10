# Chrono Project — candidato v0.2.6

O candidato `0.2.6` parte da versão publicada `0.2.5` e reúne o novo fluxo de
predecessoras, histórico compartilhado, caminho crítico e os últimos ajustes da
moldura desktop. O schema SQLite avança de `8` para `9`; o formato
`.chronoproject` permanece na versão `1`.

## Escopo confirmado

- seletor pesquisável de predecessoras em ordem hierárquica, com seleção
  múltipla, identificação de tarefas-resumo, relações existentes e ocultação de
  opções inválidas;
- inclusão, alteração de lag e remoção de várias predecessoras em transação
  única, com prévia do impacto e uma única operação de desfazer;
- gerenciamento de predecessoras com um intervalo próprio por relação,
  preservando os demais lags quando apenas uma predecessora é alterada;
- histórico compartilhado por Tabela, Kanban e Gantt, com `Ctrl+Z`,
  `Ctrl+Shift+Z` e descrições no menu **Editar**;
- histórico cobrindo edição, bloqueio de datas, reordenação, dependências,
  duplicação e exclusão/restauração de tarefas e relações durante a sessão;
- filtros compactos com múltiplos responsáveis, tarefas sem responsável e
  criticidade; tarefas concluídas permanecem disponíveis pelo próprio status,
  sem um filtro redundante de conclusão;
- ações em massa para travar ou destravar as datas das tarefas selecionadas;
- hierarquia de tarefas e templates ampliada para cinco níveis;
- caminho crítico opcional por projeto, calculado sobre a rede FS em dias úteis,
  com folga zero, quase crítica em até dois dias e projeção nos resumos;
- margem global calculada separadamente contra o maior prazo-limite das tarefas
  não canceladas;
- explicação visual do CPM, motivo explícito quando a análise não estiver
  disponível e toggle persistente junto ao plano de referência;
- realce acessível na Tabela e no Gantt; o inspetor do Gantt apresenta a folga
  exata da tarefa selecionada;
- espaçamento e altura das barras do Gantt revisados para evitar sobreposição;
- detalhes da tarefa reorganizados e mantidos abertos durante a edição, fechando
  por comando explícito ou `Esc`;
- menus superiores fecham com clique externo ou `Esc`, e erros aparecem em
  alerta compacto sem deslocar o conteúdo;
- barra de título nativa substituída por moldura integrada com minimizar,
  maximizar/restaurar, fechar, arrastar e duplo clique;
- massa idempotente **Auditoria — planejamento avançado** disponível pelo
  comando `npm run dev:seed-advanced-audit`.

## Compatibilidade e dados

- schema SQLite `9`, com a migration aditiva
  `0009_project_critical_path.sql`;
- projetos existentes recebem o caminho crítico desligado por padrão;
- pacotes `.chronoproject` dos schemas 4 a 8 são atualizados em cópia temporária
  antes da leitura; o pacote original não é modificado;
- formato `.chronoproject` permanece em `1`;
- identificador e diretório de dados permanecem `chronoproject`;
- instaladores continuam destinados ao Windows 11 x64.

## Gates automatizados

- [x] versões `0.2.6` consistentes nos cinco manifests;
- [x] `npm ci` e auditoria npm sem vulnerabilidades;
- [x] lint e typecheck;
- [x] 191 testes TypeScript/React;
- [x] build web de produção;
- [x] jornada E2E atualizada para o seletor múltiplo;
- [x] 39 testes Rust; 1 teste histórico dependente de banco externo ignorado;
- [x] 2 testes de desempenho;
- [x] Cargo fmt, check e Clippy;
- [x] migration 9 em banco novo e upgrade das versões anteriores;
- [x] validação manual do candidato com dados reais;
- [x] executável de distribuição sem `shared-dev-data`;
- [x] instalador padrão assinado;
- [x] instalador offline assinado;
- [x] assinaturas, hashes, manifesto e pacote de publicação verificados.

## Roteiro manual final

### Moldura e navegação

1. Abra, minimize, maximize, restaure e feche a janela pelos controles internos.
2. Arraste a janela pela área livre da barra superior e teste o duplo clique.
3. Recolha e reabra o painel de projetos pela marca Chrono.
4. Abra os menus Arquivo, Editar, Exibir, Calendário, Templates e Ajuda; confirme
   fechamento por clique externo e `Esc`.

### Predecessoras e histórico

1. Em uma tarefa, abra **Adicionar predecessoras**, pesquise por número e por
   título e confira a ordem pai-filhos-próximo irmão.
2. Selecione pelo menos três predecessoras, confirme a prévia e grave o lote.
3. Confirme que todas aparecem e que a sucessora respeita a restrição mais
   tardia.
4. Em **Gerenciar**, altere o lag de várias relações e remova uma seleção.
5. Use `Ctrl+Z` uma vez para desfazer cada lote completo e `Ctrl+Shift+Z` para
   refazer; confira as descrições em **Editar > Histórico de alterações**.
6. Repita desfazer/refazer para prioridade, reordenação, duplicação e exclusão de
   uma tarefa com dependência.

### Filtros, hierarquia e detalhes

1. Filtre por dois responsáveis e por **Sem responsável**; combine com texto,
   status, prioridade, datas e tag.
2. Crie ou inspecione uma cadeia com cinco níveis e confirme que um sexto nível
   é recusado com mensagem clara.
3. Selecione várias tarefas e trave/destrave datas em massa.
4. Abra **Detalhes**, edite agenda e conteúdo, clique fora e confirme que o
   painel permanece aberto; feche com `Esc`.

### Caminho crítico

1. Ative o toggle ao lado do plano de referência e confirme que a explicação
   abre automaticamente.
2. Confira o diagrama com caminhos paralelos, o término previsto, a meta derivada
   do maior prazo-limite e a margem global.
3. Sem datas ou sem dependências, confira as duas mensagens específicas de
   análise indisponível.
4. Na Tabela, confirme os indicadores **Crítica** e **Quase crítica** e os
   filtros correspondentes.
5. No Gantt, confirme contorno sólido/tracejado, legenda curta, separação entre
   barras e a folga exata no inspetor da tarefa.
6. Altere somente um prazo-limite: a margem global deve mudar, mas o caminho
   crítico deve permanecer igual.

### Persistência e compatibilidade

1. Feche e reabra o aplicativo; confirme projetos, relações, lags, datas e o
   estado do toggle.
2. Exporte e reimporte um projeto com cinco níveis e múltiplas predecessoras.
3. Gere e restaure um backup de teste.
4. Confirme Tabela, Kanban e Gantt sobre as mesmas tarefas depois da restauração.

Nenhum artefato da v0.2.5 deve ser alterado. Os novos binários pertencem
exclusivamente à v0.2.6.
