# Chrono Project — candidato v0.2.3

O candidato `0.2.3` parte da versão publicada `0.2.2`. Os manifests, artefatos e
documentos foram alinhados antes do commit final.

## Escopo confirmado

- a Tabela mantém somente uma barra horizontal, fixa na base visível;
- a barra horizontal nativa do contêiner foi removida sem perder touchpad,
  sincronização bidirecional ou `Shift` + roda;
- o clique direito em caixas de texto da Tabela usa o menu claro do Chrono;
- caixas de texto oferecem **Recortar**, **Copiar**, **Colar** e
  **Selecionar tudo**, seguidas pelas ações da tarefa;
- falhas de acesso ao clipboard agora geram feedback textual e o foco retorna
  ao controle que abriu o menu;
- datas, números e seleções fora da Tabela também deixam de expor o menu nativo;
- a digitação segmentada de datas no WebView2 preserva dia e mês enquanto o
  ano ainda está incompleto, sem limpar o cronograma;
- colar texto pelo menu de contexto não altera temporariamente a altura da linha;
- a coluna **Ações** agrupa reordenação e menu em uma faixa compacta e deixa de
  exibir permanentemente o texto **Salva**;
- os títulos do cabeçalho da Tabela e os ícones da coluna **Ações** ficam
  centralizados em suas respectivas colunas;
- o indicador de salvamento funciona como selo sobreposto e não desloca o
  conjunto visível de ações para a esquerda;
- as colunas usam larguras semânticas mais justas e a largura mínima da Tabela
  foi reduzida, preservando datas e controles sem espaço ocioso excessivo;
- colunas de conteúdo previsível mantêm largura fixa mesmo em janelas amplas;
  somente Tarefa, Predecessoras, Responsável e Tags absorvem espaço excedente;
- a saúde considera a data local atual: tarefas abertas ficam **Atrasadas** após
  o prazo mesmo sem cronograma, e **Em risco** no dia do prazo, sem fim previsto
  ou com fim posterior ao limite; a referência muda automaticamente à meia-noite;
- mudar uma atividade para **Concluída** abre uma revisão dos dados já
  preenchidos — atividade, prioridade, início, fim, duração, prazo-limite,
  progresso e responsável — antes de gravar a alteração;
- a confirmação de conclusão é única para Tabela, Kanban e Gantt, eleva o
  progresso para 100%, registra a data real e pode ser cancelada sem exibir um
  falso erro de gravação;
- reabrir solicita o novo progresso e remove a data de conclusão; tarefas-resumo
  não podem ser concluídas enquanto houver descendentes abertos;
- a saúde distingue **Concluída com atraso** pela data real e apresenta
  **Cancelada** como classificação neutra;
- o schema 8 migra conclusões antigas, preserva importação/restauração dos
  schemas 4 a 7 e reforça no domínio a coerência entre status, progresso e data;
- o inspetor do Gantt passa a oferecer também o seletor de status, mantendo a
  mesma proteção de conclusão disponível nas demais visualizações;
- o menu **Ajuda** obtém do executável Tauri a versão realmente instalada, em
  vez de repetir a versão do `package.json` usada durante a compilação web;
- o restante da linha continua oferecendo diretamente as ações operacionais;
- o executável de inspeção usa um único nome fixo e só pode ser atualizado por
  uma nova compilação com `shared-dev-data`;
- a massa de 205 tarefas possui seed determinístico de datas e 119 relações FS,
  sem duplicar o banco SQLite;
- o identificador Tauri passa de `io.github.machadojean.chronoproject` para
  `chronoproject`, simplificando o diretório do perfil para
  `%APPDATA%\chronoproject`;
- a troca de identidade não importa nem sobrescreve automaticamente a base
  anterior: usuários existentes devem criar backup antes da atualização e
  restaurá-lo na nova instalação.

## Auditoria de consistência

- [x] contêineres com `overflow` revisados em Tabela, Kanban, Gantt, diálogos e
  menus;
- [x] menus de contexto revisados em projetos, Tabela, Kanban e Gantt;
- [x] botões repetidos revisados; alternativas de teclado, recuperação de
  salvamento e ações destrutivas explícitas foram mantidas quando intencionais;
- [x] 171 testes TypeScript/React aprovados;
- [x] lint e typecheck aprovados;
- [x] seed determinístico reaplicado com integridade SQLite aprovada;
- [x] jornada E2E da aplicação aprovada;
- [x] 39 testes Rust aprovados, com 1 auditoria local ignorada por exigir banco
  externo específico;
- [x] transição, restauração, persistência, datas, clipboard, Tabela, scheduler,
  Kanban, Gantt e backup validados manualmente no Tauri/WebView2 real com o
  instalador `0.2.3-alpha.2`;
- [x] número da versão e documentação final alinhados;
- [x] executável e instaladores regenerados e assinados.

Nenhum artefato da v0.2.2 foi alterado. A tag e a release publicadas continuam
imutáveis; estes ajustes pertencem exclusivamente ao próximo patch.
