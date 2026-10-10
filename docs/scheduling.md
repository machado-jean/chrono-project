# Scheduling

Este documento descreve o comportamento implementado na Fase 3. As regras vivem em TypeScript puro em `src/domain/calendars/` e `src/domain/scheduling/`, sem React, DOM, Tauri ou SQLite.

## Datas, duração e edição

- datas de cronograma são strings `date-only` em `YYYY-MM-DD`;
- os cálculos usam UTC apenas como mecanismo interno para evitar deslocamento por timezone;
- duração é inclusiva: duração `1` significa início e fim na mesma data;
- ao informar início e duração, o fim é calculado;
- ao informar início e fim, a duração é calculada;
- ao alterar o início de uma tarefa já agendada, a duração é preservada e o fim é recalculado;
- ao alterar o fim, a duração é recalculada;
- uma data não útil digitada em tarefa `MANUAL` é preservada e recebe aviso informativo.

Tarefas sem cronograma mantêm início, fim e duração nulos. Ao persistir, os três campos devem estar todos preenchidos ou todos vazios.

## Calendário de trabalho

Cada calendário define:

- dias úteis de segunda (`1`) a domingo (`7`);
- feriados ou bloqueios por data;
- exceções positivas que liberam uma data normalmente inativa.

O calendário padrão usa segunda a sexta. A migration `0003_scheduling.sql` também cria o calendário integrado **Todos os dias**, com segunda a domingo, destinado a tarefas que devem participar automaticamente do fim de semana.

Uma tarefa usa o calendário do projeto por padrão e pode selecionar outro calendário por `calendar_id`. Nesta fase, a interface permite editar a semana e as exceções do calendário do projeto e escolher **Todos os dias** nos detalhes de uma tarefa.

Calendários são entidades compartilháveis. Alterar dias úteis ou exceções afeta
todos os projetos e tarefas que referenciam aquele calendário; a interface
informa esse alcance antes da edição.

Funções puras disponíveis:

```text
isWorkingDay()
onOrNextWorkingDay()
nextWorkingDay()
addWorkingDays()
workingDaysBetween()
endDateForDuration()
```

Salvar uma alteração de calendário recalcula as tarefas `AUTO` diretamente afetadas, propaga seus sucessores e persiste calendário e tarefas na mesma transação. Tarefas `MANUAL` não são deslocadas.

## Dependência Término para Início

O único tipo aceito na V1 atual é Finish-to-Start (`FS`), apresentado na interface como **Término para Início (TI)**.

Para cada predecessora:

```text
início mínimo da sucessora =
  adicionar_dias_úteis(
    calendário efetivo da sucessora,
    fim da predecessora,
    lag
  )
```

Consequências práticas:

- predecessora termina sexta e lag `0`: sucessora começa na própria sexta;
- predecessora termina sexta, calendário segunda–sexta e lag `1`: sucessora começa segunda;
- predecessora termina sexta, calendário **Todos os dias** e lag `1`: sucessora começa sábado;
- com múltiplas predecessoras, vale a data mínima mais tardia;
- lag é inteiro não negativo: `0` permite iniciar no mesmo dia do fim e `1` usa o próximo dia útil.

Dependências são permitidas somente:

- entre tarefas do mesmo projeto;
- com tarefa-folha no lado sucessor;
- com tarefa-folha ou tarefa-resumo no lado predecessor;
- sem auto-dependência;
- sem relação duplicada;
- quando o grafo permanece acíclico.

Ao criar a primeira subtarefa, uma folha passa a ser resumo. Relações de saída
podem permanecer no novo resumo, ser transferidas à nova subtarefa ou ser
removidas. Relações de entrada não podem permanecer porque resumo não pode ser
sucessor. Ao adicionar outras subtarefas a um resumo existente, suas relações de
saída são mantidas. Domínio e SQLite aplicam a mesma política. Dependências entre
projetos permanecem explicitamente fora do escopo desta fase.

## Propagação e modos

O cálculo usa validação do grafo, ordenação topológica e somente o subgrafo de sucessores afetados.

Para tarefa `AUTO`:

1. calcular a restrição mais tardia;
2. alinhar o início à restrição, antecipando ou atrasando quando necessário;
3. preservar duração;
4. recalcular fim com o calendário efetivo da sucessora;
5. continuar em cascata.

Uma tarefa `AUTO` com predecessora é controlada pelo grafo. Folgas intencionais
devem ser registradas no lag; para preservar uma data escolhida diretamente,
usar o modo `MANUAL`. Ao remover uma relação, a sucessora é recalculada pelas
predecessoras restantes. Se a última relação for removida, a data atual é
mantida porque não existe outra âncora temporal que indique até onde antecipar.

Para tarefa `MANUAL`:

- datas nunca são deslocadas pelo scheduler;
- o cadeado aparece fechado e bloqueia arrasto ou redimensionamento no Gantt;
- valores exatos ainda podem ser editados nos campos da Tabela ou do inspetor;
- se uma predecessora declarada exigir início posterior, é apresentado um conflito informativo com a data mínima;
- tarefas distintas que apenas coincidem na mesma data não geram conflito;
- sem dependência declarada, não existe restrição a verificar.

Uma tarefa `AUTO` totalmente sem cronograma recebe início e fim pela restrição da predecessora e assume duração inicial de um dia. Se já possui cronograma, sua duração é preservada.

## Tarefas-resumo

Uma tarefa com descendentes tem cronograma derivado:

```text
início = menor início dos descendentes agendados
fim    = maior fim dos descendentes agendados
```

A duração é a quantidade inclusiva de dias úteis no intervalo, conforme o
calendário da tarefa-resumo. Início, fim, duração, modo, calendário e relações
de entrada ficam bloqueados na linha de resumo. O resumo pode ser escolhido
como predecessora de uma tarefa-folha. A ordenação combina arestas de hierarquia
e FS para recalcular o resumo antes de propagar seu término.

## Transação

O domínio calcula primeiro um resultado completo e válido. O caso de uso envia um `ScheduleChangeSet` ao comando nativo `apply_schedule_changes`, que grava em uma única transação SQLite:

- alterações de calendário;
- exclusões de árvores e dependências;
- dependências criadas ou editadas;
- todas as tarefas recalculadas, inclusive resumos;
- tags afetadas.

Na Tabela, campos da tarefa e alterações de lag são rascunhos da mesma linha.
O único botão **Salvar** na coluna Ações envia ambos no mesmo `ScheduleChangeSet`;
nenhuma alteração de lag é persistida enquanto o usuário apenas digita.

Qualquer falha cancela o conjunto inteiro. Existe teste Rust que provoca uma segunda alteração inválida e comprova que a primeira também é revertida.

Na abertura do workspace, o mesmo cálculo reconcilia cadeias automáticas e
resumos de bancos anteriores à Fase 3. Apenas diferenças são persistidas;
tarefas `MANUAL` não são alteradas e seus avisos são reconstruídos.

## Matriz de auditoria

| Caso obrigatório | Evidência automatizada |
| --- | --- |
| A → B, lag zero e preservação da duração | `tests/unit/domain/scheduling.test.ts` |
| A → B → C e propagação | `tests/unit/domain/scheduling.test.ts` |
| A e B → C, restrição mais tardia | `tests/unit/domain/scheduling.test.ts` |
| lag positivo | `tests/unit/domain/scheduling.test.ts` |
| sexta → segunda | testes de calendário, scheduler e UI |
| feriado e exceção positiva | testes de calendário e UI |
| antecipação AUTO, cadeia regressiva, predecessora remanescente e última relação removida | testes de scheduler e UI |
| tarefa MANUAL e conflito informativo | testes de scheduler e UI |
| ciclo, auto-dependência, relação duplicada | testes de scheduler/domínio |
| mesma origem de projeto, resumo predecessor e folha sucessora | testes de scheduler e constraints SQLite |
| resumo | testes de scheduler e UI |
| resultado múltiplo e rollback transacional | testes TypeScript e Rust |
| datas não úteis explícitas | testes de scheduler e UI |
| calendário contínuo no fim de semana | testes de calendário, scheduler e UI |
| grafo recriado com identidades independentes | testes de reutilização, UI e persistência SQLite da Fase 5 |

## Cenário manual de auditoria

O banco local de desenvolvimento contém o projeto **Auditoria do scheduler —
Fase 3**. Ele não é versionado; uma cópia consistente fica em
`.local/backups/`. O cenário possui três tarefas-resumo, sete subtarefas e oito
dependências FS.

| Tarefa | Relação principal | Resultado esperado |
| --- | --- | --- |
| Mapear requisitos | origem da cadeia | 28/08/2026, sexta-feira |
| Definir arquitetura | requisitos, lag 0 | 31/08/2026, segunda-feira |
| Desenvolver domínio | arquitetura, lag 1 | 02–03/09/2026 |
| Integrar persistência | arquitetura e domínio, lag 0 | 04/09/2026; vence a restrição de domínio |
| Executar testes integrados | domínio lag 0 e persistência lag 1 | 09–11/09/2026; respeita o feriado de 07/09 |
| Executar validação no fim de semana | testes, lag 0, calendário Todos os dias | 12–13/09/2026, sábado e domingo |
| Revisar marco manual | persistência, lag 1 | permanece em 04/09 e informa início mínimo em 09/09 |

As tarefas-resumo devem apresentar, respectivamente, 28–31/08, 02–04/09 e
04–13/09. Fechar e reabrir o release deve preservar as dez tarefas, as oito
relações, o feriado e o conflito manual.

Para auditar a propagação nos dois sentidos, primeiro atrase **Mapear
requisitos** e confirme o deslocamento da cadeia. Depois restaure sua data
anterior: as sucessoras `AUTO` devem retornar para as restrições FS recalculadas,
preservando duração e lag. **Revisar marco manual** não deve ser deslocada em
nenhum dos sentidos; quando sua data viola a relação, deve apenas exibir o aviso.

## Edição direta no Gantt

O Gantt é uma superfície de comando, não uma segunda fonte de cronograma:

- a linha do tempo inclui sete dias antes do primeiro início e um mês após
  o último fim do projeto, permitindo rolar e arrastar tarefas para fora da janela
  originalmente ocupada;

- tarefa executável sem predecessora pode ser movida e ter as duas bordas
  redimensionadas;
- mover preserva a duração útil; redimensionar recalcula a duração pelo
  calendário efetivo;
- ao soltar uma barra em dia não permitido, o Gantt normaliza o início para o
  próximo dia útil ou exceção permitida pelo calendário efetivo;
- a borda esquerda de tarefa com predecessora continua bloqueada, mas mover a
  barra inteira ajusta automaticamente o lag FS em dias úteis;
- ao mover uma tarefa `AUTO` para depois, somente a relação controladora recebe
  o aumento necessário; ao antecipar, todas as relações que ainda limitariam a
  data têm seus lags reduzidos, nunca abaixo de zero;
- se a data solicitada violar uma predecessora com lag zero, o movimento para na
  primeira data FS válida e informa a limitação;
- ao ampliar o fim, os sucessores `AUTO` são propagados para frente; ao reduzir,
  são antecipados quando a restrição FS permitir;
- tarefa com cadeado fechado (`MANUAL`) recebe conflito em vez de deslocamento
  automático e não aceita arrasto ou redimensionamento;
- tarefa-resumo nunca aceita edição temporal direta;
- o marcador interno da barra altera a conclusão entre 0% e 100% sem executar
  recálculo temporal;
- o botão direito na tarefa abre **Adicionar predecessora** e apresenta somente
  tarefas executáveis cujo fim é anterior ao início da sucessora. A nova
  relação é FS com lag zero; duplicidade e ciclos continuam validados;
- o botão direito na linha abre **Excluir dependência**. O menu genérico do
  WebView2 é suprimido dentro do gráfico, e os identificadores visuais da
  biblioteca são convertidos de volta aos UUIDs persistidos;
- edições salvas na Tabela, no Kanban e no Gantt podem ser desfeitas/refeitas
  por `Ctrl+Z`/`Ctrl+Shift+Z`; os botões do Gantt usam o mesmo histórico. A
  restauração inclui exatamente a cascata já calculada e é persistida em uma
  única transação.
- a Tabela pode criar várias relações FS para a mesma sucessora em um lote; a
  prévia executa o scheduler sobre o conjunto completo e a confirmação persiste
  relações e datas uma única vez. `Ctrl+Z` remove o lote inteiro e
  `Ctrl+Shift+Z` o restaura.
- duas ou mais predecessoras podem ser gerenciadas em lote: um intervalo comum
  ou a remoção do conjunto é persistido com a cascata em uma transação e forma
  uma única operação reversível.

## Caminho crítico e folga total

O caminho crítico é uma análise pura, sem alterar datas. Quando habilitado no
projeto, ele considera tarefas-folha programadas, dependências FS e o calendário
efetivo de cada tarefa. A passagem reversa parte do **término previsto da rede**
e calcula a folga total em dias úteis. Tarefas com folga zero pertencem ao
caminho crítico; folgas entre um e dois dias úteis são classificadas como
próximas do crítico.

Redes desconectadas são comparadas ao mesmo término previsto, portanto uma cadeia
que termina antes recebe folga. Separadamente, a **meta final do projeto** é o
maior prazo-limite entre as tarefas não canceladas. A diferença entre o término
previsto e a meta é apresentada como margem global positiva, nula ou negativa,
sem alterar a criticidade das tarefas. Tarefas-resumo recebem a menor folga encontrada
entre suas folhas somente para fins de apresentação. Tarefas canceladas e itens
sem cronograma completo não entram no cálculo. Quando não existe ao menos uma
relação FS entre tarefas programadas, a interface explica que a rede é
insuficiente em vez de produzir um resultado enganoso.

A Tabela apresenta um marcador junto ao título. O Gantt usa contorno vermelho
contínuo nas barras críticas e violeta mineral tracejado nas quase críticas,
ambos com espessura reforçada e uma
legenda textual que informa também as respectivas faixas de folga. O filtro
compartilhado oferece **Caminho crítico** e **Próximas do crítico**. O cálculo
está coberto por `tests/unit/domain/critical-path.test.ts`.
O diálogo de explicação reúne **Término previsto**, **Meta final** e **Margem
global**. Se a análise estiver indisponível, ele não exibe apenas um estado
genérico: informa se faltam datas, dependências programadas ou um calendário
utilizado pelo projeto.

Todo gesto final passa por validação, scheduler e persistência transacional. Em
falha, a projeção é reconstruída a partir do estado persistido. Eventos internos
do renderer, como a atualização visual de uma barra-resumo, não são tratados
como edições do usuário.

## Fora do escopo do scheduler básico e do Gantt da Fase 4

- dependências SS, FF e SF;
- dependências entre projetos;
- inferência de uma data anterior após remover a última predecessora;
- nivelamento de recursos continua fora do escopo;
- mover árvores completas de tarefas-resumo permanece fora do escopo.

## Importação de feriados oficiais

O editor de calendário oferece uma prévia offline de feriados brasileiros para
os anos que aparecem nas datas do projeto. É possível escolher somente o âmbito
nacional ou uma UF. Feriados classificados como `public` vêm selecionados;
feriados bancários e pontos facultativos ficam disponíveis, mas exigem seleção
explícita. Datas que já possuem uma exceção são bloqueadas na prévia e nunca são
sobrescritas.

Feriados municipais continuam sendo exceções manuais, pois dependem do município
do usuário e não têm cobertura nacional uniforme na fonte adotada. A integração
usa `date-holidays` 3.36.0 sob demanda, sem acesso à internet. Código e dados
possuem as atribuições registradas em `THIRD_PARTY_NOTICES.md`.
