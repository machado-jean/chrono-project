# Visualizações e filtros

Tabela, Kanban e Gantt são projeções do mesmo array de `Task` mantido por
`useWorkspace`. Trocar de view não carrega outra cópia do projeto nem cria
entidades persistidas específicas da interface.

## Filtros compartilhados

Os filtros ficam na composição `ProjectViews` e permanecem ativos ao alternar
entre as três views. O conjunto mínimo cobre:

- texto em título, código, descrição, responsável, tags e observações;
- status;
- prioridade;
- concluída ou não concluída;
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
2. Próxima tarefa-pai
```

Essa numeração não é gravada no título, no código visual nem no SQLite. Ela é
recalculada automaticamente ao reordenar ou mover uma tarefa na hierarquia. Se
um título antigo já começa com o mesmo número, a interface o exibe apenas uma
vez; o conteúdo persistido não é alterado silenciosamente.

A V1 permite no máximo quatro níveis, contando a tarefa-raiz. A interface deixa
de oferecer uma tarefa do quarto nível como pai, e domínio, templates e
importação repetem a validação para que o limite não possa ser contornado.
Ao criar a primeira subtarefa de uma tarefa que participa de uma dependência FS,
a interface solicita uma decisão explícita: transferir as relações para a nova
folha ou removê-las. A opção recomendada preserva os UUIDs e o lag e grava a
conversão inteira em uma transação.


## Kanban

As cinco colunas iniciais representam os status definidos no domínio. Um cartão
pode mudar de status por arraste com Pointer Events ou pelo campo **Status**.
Ambos chamam o mesmo `onSave` utilizado pela Tabela, portanto a alteração é
validada, persistida e refletida imediatamente em todas as views.

Cada cartão informa caminho hierárquico, prioridade, datas, progresso,
predecessoras, responsável e tags quando disponíveis. Tarefas-resumo aparecem
identificadas, mas continuam sendo a mesma `Task` derivada pelo scheduler.

## Gantt

O Gantt usa SVAR React Gantt 2.7.1 conforme o [ADR 013](decisions/013-svar-react-gantt.md).
A roda do mouse sobre qualquer área do gráfico percorre verticalmente as
atividades. A barra horizontal, mantida visível na base da linha do tempo,
permite navegar entre datas sem deslocar o painel de inspeção.
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

As datas do ProjectFlow são inclusivas. Na projeção, o fim é convertido para o
dia civil seguinte porque o renderer usa fim exclusivo. Assim, uma tarefa de
sexta a segunda ocupa corretamente sexta, sábado, domingo e segunda no eixo,
enquanto a coluna **Duração** continua mostrando a quantidade de dias úteis
calculada pelo
calendário do domínio.

Títulos que não cabem na primeira coluna são abreviados visualmente; manter o
ponteiro sobre o texto revela o nome completo sem alterar a largura do gráfico.
As barras usam uma cor própria para cada um dos quatro níveis, mantendo texto e
progresso com contraste e preservando a forma distinta das tarefas-resumo.

Por padrão todas as relações aparecem. Ao clicar em uma linha, ou escolher uma
relação em **Dependência em foco**, aquela relação recebe destaque,
com predecessor e sucessora realçados. Isso permite seguir dependências longas
sem confundi-las com as demais. As outras relações permanecem visíveis com
menor intensidade e continuam selecionáveis; **Todas as dependências** remove o
realce.

Os gestos do renderer são interceptados e submetidos ao domínio: mover ajusta
datas ou lag FS, a borda direita altera duração e o marcador altera conclusão.
O menu de contexto permite criar ou excluir dependências FS. Tarefas-resumo
mantêm datas derivadas; a seleção de relação não oculta as demais linhas.
O painel **Inspecionar tarefa** permite
alterar início e duração apenas quando isso é seguro; tarefas-resumo exibem a
explicação de que suas datas são derivadas. O salvamento usa o scheduler do
ProjectFlow e nunca o mecanismo de agendamento da biblioteca.

## Controle do plano de referência

Acima das views, **Criar plano de referência** registra uma fotografia nomeada
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
**Dentro do prazo**, **Em risco** ou **Atrasada**, além de **Sem prazo**; esses
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
O clique direito em um projeto abre ações rápidas para arquivar, restaurar ou
excluir. As mesmas ações continuam disponíveis no menu superior **Projeto** como
alternativa acessível por teclado.

## Auditoria manual da Fase 4

Use o projeto **Auditoria do scheduler — Fase 3** e confira:

1. alternar Tabela, Kanban e Gantt sem recarregar o projeto;
2. mover uma tarefa no Kanban pelo seletor e confirmar o status na Tabela;
3. repetir por drag-and-drop e confirmar o mesmo resultado;
4. combinar texto, status, prioridade, conclusão, datas e tag, observando que os
   filtros permanecem ao trocar de view;
5. no Gantt, alternar Dias, Semanas e Meses;
6. conferir três tarefas-resumo, sete subtarefas, barras de progresso e oito
   relações FS;
7. conferir a numeração `1.`, `1.1.` e, quando houver, `1.1.1.` nas três views;
8. verificar que a tarefa-resumo de 28/08 a 31/08 ocupa também o dia 31;
9. clicar em uma dependência distante, conferir o isolamento e voltar para
   **Todas as dependências**;
10. verificar final de semana e o feriado de 07/09 na escala diária;
11. selecionar uma tarefa-folha predecessora no painel, atrasar seu início,
   salvar e confirmar a propagação para frente nas três views;
12. restaurar a data anterior e confirmar que as sucessoras `AUTO` também são
   antecipadas; uma sucessora `MANUAL` deve permanecer fixa e apenas receber aviso;
13. selecionar uma tarefa-resumo e confirmar que o prazo não é editável;
14. fechar e reabrir o executável, que deve iniciar maximizado, e confirmar
    persistência.

## Melhorias não bloqueantes

A Fase 4 está concluída sem depender dos itens abaixo. Eles permanecem como
candidatos para uma iteração futura de UX, depois do Checkpoint Git 5:

- ação **Hoje** e enquadramento automático do projeto no Gantt;
- navegação direta entre as duas pontas de uma dependência em foco;
- densidade compacta opcional no Kanban;
- marcos e caminho crítico somente após decisões próprias de domínio
  e scheduler — não como comportamento implícito da biblioteca de Gantt.
