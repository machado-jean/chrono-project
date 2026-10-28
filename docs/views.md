# Visualizações e filtros

Tabela, Kanban e Gantt são projeções do mesmo array de `Task` mantido por
`useWorkspace`. Trocar de view não carrega outra cópia do projeto nem cria
entidades persistidas específicas da interface.

## Filtros compartilhados

Os filtros são controlados pela composição principal e permanecem ativos ao
alternar entre as três views. Esse estado compartilhado também permite que a
exportação em PDF respeite exatamente as atividades visíveis. O conjunto mínimo
cobre:

- texto em título, código, descrição, responsável, tags e observações;
- status;
- prioridade;
- um ou mais responsáveis, incluindo tarefas sem responsável;
- caminho crítico ou tarefas próximas do crítico, com até dois dias úteis de folga total;
- sobreposição com intervalo de datas;
- tag.

Quando uma subtarefa corresponde, seus ancestrais são incluídos como contexto
na Tabela e no Gantt. O contador mostra correspondências reais, sem contar os
ancestrais acrescentados somente para contexto.

## Numeração hierárquica

Tabela, Kanban e Gantt exibem uma numeração derivada da posição na árvore:

```text
1. Tarefa-pai
1.1. Subtarefa
1.1.1. Subtarefa de terceiro nível
1.1.1.1. Subtarefa de quarto nível
1.1.1.1.1. Subtarefa de quinto nível
2. Próxima tarefa-pai
```

Essa numeração não é gravada no título, no código visual nem no SQLite. Ela é
recalculada automaticamente ao reordenar ou mover uma tarefa na hierarquia. Se
um título antigo já começa com o mesmo número, a interface o exibe apenas uma
vez; o conteúdo persistido não é alterado silenciosamente.

A V1 permite no máximo cinco níveis, contando a tarefa-raiz. A interface deixa
de oferecer uma tarefa do quinto nível como pai, e domínio, templates e
importação repetem a validação para que o limite não possa ser contornado.
Ao criar a primeira subtarefa de uma tarefa que participa de uma dependência FS,
a interface solicita uma decisão explícita: manter as relações de saída no novo
resumo, transferir as relações para a nova folha ou removê-las. Manter só é
oferecido quando a tarefa não recebe uma dependência, pois resumos não podem ser
sucessores. A decisão preserva UUIDs e lag e grava a conversão inteira em uma
transação. Acrescentar outra subtarefa a um resumo existente mantém suas
relações de saída e não altera relações ligadas diretamente às folhas.

## Tabela

O comando compacto `+` abre um seletor pesquisável por número ou título, em
ordem hierárquica, com identificação de resumos e seleção de várias tarefas.
Relações existentes aparecem separadamente e candidatas inválidas não são
oferecidas. Uma única barra horizontal sincronizada permanece na base
visível da área da Tabela, sem exigir que o usuário percorra todas as tarefas
para alcançar as colunas finais. A barra horizontal nativa do contêiner é
ocultada; gestos horizontais do touchpad e `Shift` + roda continuam funcionando.

Expandir uma tarefa apenas revela suas linhas; não grava no banco nem recalcula
o cronograma. Para manter essa interação leve em projetos grandes, a validação
completa de candidatas a predecessora e a prévia de impacto são preparadas só
quando o seletor **Adicionar…** é aberto. Os detalhes de cada linha também só
montam as opções de hierarquia quando o usuário os solicita.

O clique direito em qualquer ponto da linha abre ações para detalhes, subtarefa,
predecessora, trava de datas, duplicação, template e exclusão. Em caixas de
texto, o mesmo menu claro começa com **Recortar**, **Copiar**, **Colar** e
**Selecionar tudo**. O botão **Mais ações** oferece o menu operacional por
teclado. Controles de data, número e seleção fora das linhas também substituem
o menu do WebView por uma ação coerente de cópia. Falhas de permissão da área de
transferência são apresentadas em um alerta, e `Esc` devolve o foco ao controle
que abriu o menu.

O cadeado da linha representa a política de datas: aberto em tarefas `AUTO` e
fechado em tarefas `MANUAL`. A mesma ação aparece nos detalhes e no menu de
contexto. Travar impede deslocamento pelo scheduler e gestos temporais no Gantt,
mas preserva a edição exata dos campos de data. Tarefas-resumo mantêm modo e
datas derivados e, por isso, não expõem essa alternância.

Com uma ou mais tarefas-folha selecionadas, a barra de ações permite travar ou
destravar todas em uma única transação. `Ctrl+Shift+L` alterna o mesmo estado e
é ignorado enquanto o foco está em um campo editável. Ao adicionar ou remover
uma ou mais predecessoras, a Tabela apresenta primeiro as datas que serão
alteradas e só confirma o lote mediante decisão explícita. Relações e cascata
do scheduler são gravadas na mesma transação.
Quando a tarefa possui duas ou mais predecessoras, **Gerenciar** permite
selecionar várias relações, aplicar um intervalo comum ou removê-las em uma
única transação. A operação produz uma única entrada no histórico e pode ser
desfeita integralmente.

### Salvamento automático na Tabela

Seletores e datas completas são persistidos assim que a alteração é confirmada.
Campos de texto e numéricos usam debounce de 700 ms e são salvos imediatamente
ao perder foco. Ao trocar de visualização, a linha captura o último rascunho
válido antes de ser desmontada; a navegação não fica bloqueada pela escrita.

Cada tarefa possui sua própria fila de gravação. Se uma segunda edição ocorrer
enquanto a primeira está em curso, ela é executada depois e somente a revisão
mais recente pode limpar o estado local. A linha apresenta **Alterada**,
**Salvando…**, **Salva** ou **Erro ao salvar**. Em caso de falha, o conteúdo
digitado permanece visível e o botão **Salvar** funciona como tentativa manual.
Rascunhos inválidos não são enviados silenciosamente pelo autosave; o botão
manual continua disponível para apresentar a validação detalhada.


## Kanban

As cinco colunas iniciais representam os status definidos no domínio. Um cartão
pode mudar de status por arraste com Pointer Events ou pelo campo **Status**.
Ambos chamam o mesmo `onSave` utilizado pela Tabela, portanto a alteração é
validada, persistida e refletida imediatamente em todas as views.

Cada cartão informa caminho hierárquico, prioridade, datas, progresso,
predecessoras, responsável e tags quando disponíveis. Tarefas-resumo aparecem
identificadas, mas continuam sendo a mesma `Task` derivada pelo scheduler.
O clique direito ou o botão **Mais ações** abre comandos contextuais para mudar
de status, duplicar e excluir. O menu reutiliza o padrão da Tabela, fecha com
`Esc` e mantém o seletor **Status** como alternativa permanente.

## Gantt

O Gantt usa SVAR React Gantt 2.7.1 conforme o [ADR 013](decisions/013-svar-react-gantt.md).
A roda do mouse sobre qualquer área do gráfico percorre verticalmente as
atividades. A barra horizontal, mantida visível na base da linha do tempo,
é uma rolagem nativa persistente, sincronizada com o gráfico e equivalente à da
Tabela. Ela permite navegar entre datas sem descer até o fim das atividades nem
deslocar o painel de inspeção.

A altura do gráfico é medida conforme o espaço real abaixo do Gantt. Em janelas
altas, ele ocupa a área livre; com o cabeçalho do projeto visível ou em janela
menor, reduz sem esconder a barra horizontal.

As atualizações visuais internas do Gantt são agrupadas por quadro de desenho:
uma única interação pode alterar diversos elementos do gráfico, mas a medição
da linha do tempo e a aplicação das cores de hierarquia/criticidade não são
repetidas para cada mutação intermediária. O menu de predecessora também monta
suas candidatas somente após a opção ser solicitada.

A Tabela usa a mesma estrutura do Gantt: uma faixa para os dados e outra para a
barra horizontal, ambas dentro do painel com altura medida. Isso mantém títulos
de colunas e barra junto ao limite inferior da área útil. As transições de
altura são curtas e discretas; a preferência do sistema por reduzir movimento
as desativa.

O cabeçalho compacto mantém escala, histórico, uma legenda resumida e
**Opções** em uma única faixa. **Opções** revela a orientação de rolagem e o
foco de dependência apenas quando necessário.

A Tabela, o Kanban e o Gantt usam áreas roláveis próprias: os títulos de
colunas da Tabela, os títulos de status do Kanban e os cabeçalhos do Gantt
permanecem visíveis enquanto suas tarefas são percorridas.

O cabeçalho do projeto acompanha a rolagem inicial e a barra de filtros se torna
a referência fixa logo abaixo do menu. Isso conserva o contexto essencial em
janelas pequenas sem reservar permanentemente o espaço do cabeçalho.

### Regressão de rolagem

Antes de uma release, reduza a janela e confirme: (1) a barra horizontal do
Gantt aparece logo abaixo da linha do tempo; (2) ao rolar a página, o cabeçalho
do projeto sai de cena e os filtros ficam fixos abaixo do menu; (3) com os
filtros fixos, Tabela, Kanban e Gantt continuam rolando suas tarefas; e (4) na
Tabela, os títulos de colunas ficam imediatamente abaixo dos filtros.
Repita o item 1 tanto com o cabeçalho do projeto visível quanto depois da
rolagem inicial, confirmando que o Gantt usa o espaço livre nas duas posições.
Repita o mesmo teste na Tabela, confirmando transição suave, cabeçalhos fixos e
barra horizontal visível.

Uma barra vertical fina ocupa uma coluna própria entre o gráfico e o painel
**Inspecionar tarefa**. Seu trilho não cobre tarefas ou dependências, possui uma
área de interação ampliada e mantém zero no topo e o fim da lista embaixo. A
altura rolável é derivada de todas as tarefas projetadas, inclusive em árvores
maiores do que a janela visível.
A projeção transitória contém:

- hierarquia e tarefas-resumo abertas quando há filhos visíveis;
- intervalo civil inclusivo de início a fim, duração útil e progresso;
- relações FS com lag;
- escalas de dias, semanas e meses;
- realce de finais de semana e feriados do calendário do projeto;
- seleção no gráfico e por seletor acessível;
- foco de dependência por clique na linha ou por seletor acessível.
- linha de base ativa desenhada atrás das barras correntes, quando existente.

As datas do Chrono Project são inclusivas. Na projeção, o fim é convertido para o
dia civil seguinte porque o renderer usa fim exclusivo. Assim, uma tarefa de
sexta a segunda ocupa corretamente sexta, sábado, domingo e segunda no eixo,
enquanto a coluna **Duração** continua mostrando a quantidade de dias úteis
calculada pelo
calendário do domínio.

Títulos que não cabem na primeira coluna são abreviados visualmente; manter o
ponteiro sobre o texto revela o nome completo sem alterar a largura do gráfico.
As barras acomodam os cinco níveis de hierarquia, mantendo texto e
progresso com contraste e preservando a forma distinta das tarefas-resumo.
Tarefas críticas recebem ainda um contorno sólido e as próximas do crítico um
contorno tracejado, de modo que a informação não dependa somente da cor.

Por padrão todas as relações aparecem. Ao clicar em uma linha, ou escolher uma
relação em **Dependência em foco**, aquela relação recebe destaque,
com predecessor e sucessora realçados. Isso permite seguir dependências longas
sem confundi-las com as demais. As outras relações permanecem visíveis com
menor intensidade e continuam selecionáveis; **Todas as dependências** remove o
realce.

Os gestos do renderer são interceptados e submetidos ao domínio: mover ajusta
datas ou lag FS, a borda direita altera duração e o marcador altera conclusão.
O menu de contexto permite travar datas e criar ou excluir dependências FS.
Uma tarefa-resumo pode ser origem da ligação, mas nunca destino. Tarefas `MANUAL`
bloqueiam movimento e redimensionamento com uma explicação; tarefas-resumo
mantêm datas derivadas e a seleção de relação não oculta as demais linhas.
O painel **Inspecionar tarefa** permite
alterar status, início e duração apenas quando isso é seguro; tarefas-resumo
exibem a explicação de que suas datas são derivadas. Ao escolher **Concluída**,
o mesmo diálogo usado pela Tabela e pelo Kanban revisa os dados preenchidos
antes de gravar o status, a data real de conclusão e elevar o progresso para
100%. Reabrir solicita um novo progresso e limpa a data factual. Uma
tarefa-resumo com descendentes abertos informa a pendência e não pode ser
concluída. O salvamento usa o
scheduler do Chrono Project e nunca o mecanismo de agendamento da biblioteca.

Tabela, Kanban e Gantt compartilham um único histórico de até 50 edições por
projeto durante a sessão atual. `Ctrl+Z` desfaz e `Ctrl+Shift+Z` refaz; os botões
do Gantt e o menu **Editar** usam a mesma pilha. O histórico restaura
atomicamente a tarefa editada, as sucessoras recalculadas, os resumos afetados e
os lags alterados. Inclusões e remoções de predecessoras, duplicação, exclusão e
reordenação de tarefas também entram como operações únicas, e o menu descreve a
próxima ação. Uma nova edição após desfazer limpa a pilha de refazer. Campos de
texto preservam o desfazer nativo do editor. Criação simples de tarefa e
importação ainda não entram no histórico, que é limpo ao reabrir ou recarregar
o workspace.
O submenu **Editar > Histórico de alterações** apresenta as operações aplicadas
e desfeitas na sessão sem ocupar permanentemente a área de trabalho.

Na Tabela, o seletor pesquisável de predecessoras segue a ordem estrutural completa: cada
tarefa-resumo é seguida imediatamente por seus descendentes antes da próxima
irmã. Relações impossíveis, incluindo a própria tarefa, duplicidades, ancestrais
que produziriam ciclo e demais caminhos cíclicos, não são oferecidas. Se a
validação mudar entre a escolha e a gravação, o motivo é exibido no diálogo em
vez de falhar silenciosamente. A inclusão múltipla forma uma única entrada do
histórico, por exemplo **3 predecessoras adicionadas a 1.2.2.1. Local**.

## Controle do plano de referência

No cabeçalho do projeto, **Criar plano de referência** registra uma fotografia nomeada
do planejamento aprovado. Ela serve apenas para comparar mudanças futuras e
não altera as tarefas atuais. Depois da primeira fotografia, **Atualizar plano
de referência** exige confirmação e mantém as anteriores no histórico. O painel
de histórico permite excluir o plano e todas as revisões, com confirmação; as
tarefas atuais permanecem intactas. Na Tabela, as colunas **Início planejado**,
**Fim planejado** e **Desvio** comparam a fotografia ativa ao cronograma atual em dias
úteis do calendário efetivo da tarefa.
Essas três colunas só aparecem enquanto existir um plano de referência ativo;
projetos que não utilizam o recurso mantêm a Tabela mais compacta.

**Prazo-limite** é editável separadamente da data final. **Saúde** informa
**No prazo**, **Em risco**, **Atrasada** ou **Concluída com atraso**, além de
**Sem prazo** e da classificação neutra **Cancelada**; esses
indicadores são informativos e nunca movimentam tarefas.

### Auditoria manual da Fase 8

1. Crie um plano de referência e confirme as barras cinzas no Gantt.
2. Mude a data de uma tarefa e confira o desvio em dias úteis na Tabela.
3. Defina um prazo anterior ao fim atual e confira **Em risco**; use um prazo
   passado em tarefa aberta e confira **Atrasada**.
4. Atualize o plano, confirme a mensagem de substituição e abra o histórico.
5. Exclua o plano, confirme que as tarefas atuais permanecem e crie-o novamente.
6. Feche e reabra o `.exe`; plano, histórico e prazos devem permanecer.
7. Gere um PDF com a comparação marcada e confira plano, atual e desvio.

## Espaço de trabalho e ajuda contextual

A barra lateral de projetos pode ser recolhida pelo botão **Recolher projetos**.
No modo compacto, o botão **Mostrar projetos** restaura a navegação sem sair do
projeto atual. Os cabeçalhos editáveis da Tabela possuem um botão de informação
acessível por mouse e teclado; seu balão é elevado acima das colunas vizinhas.
A coluna **Tarefa** começa mais larga, e ela e **Predecessoras** podem ser
redimensionadas pelo divisor em suas bordas direitas. As preferências são
mantidas localmente entre execuções; as setas ajustam a largura pelo teclado e
um duplo clique restaura o tamanho padrão de cada coluna. As
colunas **Prioridade**, **Progresso**, **Duração** e **Prazo-limite** reservam o
espaço necessário para manter título e botão de informação totalmente visíveis.
O clique direito em um projeto abre ações rápidas para arquivar, restaurar ou
excluir e também permite exportar diretamente o projeto para um pacote
`.chronoproject`. O pacote pode ser recuperado pelo comando **Importar pacote**
do menu **Arquivo**. As mesmas ações de gestão continuam disponíveis no menu
superior **Projeto** como alternativa acessível por teclado.

## Auditoria manual da Fase 4

Prepare o projeto **Auditoria — planejamento avançado** com
`npm run dev:seed-advanced-audit` e confira:

1. alternar Tabela, Kanban e Gantt sem recarregar o projeto;
2. mover uma tarefa no Kanban pelo seletor e confirmar o status na Tabela;
3. repetir por drag-and-drop e confirmar o mesmo resultado;
4. combinar texto, status, prioridade, criticidade, responsáveis, datas e tag,
   observando que os
   filtros permanecem ao trocar de view;
5. no Gantt, alternar Dias, Semanas e Meses;
6. conferir 21 tarefas, seis relações FS, cinco níveis de hierarquia, barras de
   progresso e uma sucessora com quatro predecessoras;
7. conferir a numeração até `1.1.1.1.1.` nas três views;
8. verificar que tarefas-resumo refletem o intervalo completo dos descendentes;
9. clicar em uma dependência distante, conferir o isolamento e voltar para
   **Todas as dependências**;
10. verificar finais de semana e exceções do calendário na escala diária;
11. selecionar uma tarefa-folha predecessora no painel, atrasar seu início,
   salvar e confirmar a propagação para frente nas três views;
12. restaurar a data anterior e confirmar que as sucessoras `AUTO` também são
    antecipadas; **Atividade manual bloqueada** deve permanecer fixa e apenas
    receber aviso quando uma restrição for provocada;
13. selecionar uma tarefa-resumo e confirmar que o prazo não é editável;
14. fechar e reabrir o executável, que deve iniciar maximizado, e confirmar
    persistência.

## Melhorias não bloqueantes

A Fase 4 está concluída sem depender dos itens abaixo. Eles permanecem como
candidatos para uma iteração futura de UX, depois do Checkpoint Git 5:

- ação **Hoje** e enquadramento automático do projeto no Gantt;
- navegação direta entre as duas pontas de uma dependência em foco;
- densidade compacta opcional no Kanban;
- marcos dependem de decisão própria de domínio; o caminho crítico usa o cálculo
  do Chrono Project, nunca um comportamento implícito da biblioteca de Gantt.
