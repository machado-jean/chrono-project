# Guia do usuário

Este guia apresenta o fluxo principal do Chrono Project. A aplicação funciona
localmente no Windows e não exige conta ou servidor remoto.

## 1. Instalar e localizar os dados

Baixe o instalador padrão na página de Releases. Em uma máquina sem internet,
use o instalador offline. O executável e os dados ficam separados: atualizar ou
reinstalar não deve apagar o banco do usuário.

Os caminhos, o modo silencioso e os cuidados para versões antigas estão em
[Instalação e manutenção no Windows](installation-windows.md).

## 2. Entender a área de trabalho

A janela possui:

- barra de título integrada e menus **Arquivo**, **Editar**, **Exibir**,
  **Calendário**, **Templates** e **Ajuda**;
- seletor compacto de visualização;
- barra de projetos, que pode ser recolhida;
- cabeçalho do projeto com status, plano de referência, caminho crítico e PDF;
- filtros compartilhados;
- área principal em **Tabela**, **Kanban** ou **Gantt**.

As três visualizações usam as mesmas tarefas. Uma alteração salva em uma delas
aparece nas demais.

## 3. Criar o primeiro projeto

1. Na barra de projetos, use **Novo projeto**.
2. Informe um nome e, se desejar, uma descrição.
3. Defina o calendário em **Calendário**: dias úteis, feriados e exceções.
4. Use a criação rápida acima da Tabela para adicionar a primeira tarefa.

O clique direito sobre um projeto oferece ações como arquivar, excluir e
exportar. A exclusão é destrutiva; prefira criar um backup antes.

## 4. Organizar tarefas e subtarefas

Cada tarefa pode registrar título, descrição, status, prioridade, progresso,
responsável, tags, datas, duração, prazo-limite e observações.

Use **+ Subtarefa** ou o menu de contexto para criar a hierarquia. O limite
atual é de cinco níveis, contando a tarefa-raiz. Tarefas com descendentes viram
resumos: início e fim passam a ser derivados das subtarefas e não são editados
diretamente.

Os campos válidos da Tabela são salvos automaticamente. Um botão **Salvar** só
aparece quando existe rascunho pendente, validação necessária ou nova tentativa
após erro.

## 5. Planejar datas

Preencha duas entre as três informações de cronograma — início, fim e duração —
para que a terceira seja calculada. Duração significa dias úteis inclusivos:
uma tarefa de um dia começa e termina no mesmo dia útil.

O cadeado define o modo:

- aberto: tarefa `AUTO`, que pode ser deslocada pelo scheduler;
- fechado: tarefa `MANUAL`, cujas datas não são movidas automaticamente.

Datas de tarefas-resumo refletem os descendentes. Prazo-limite é uma referência
de saúde e não desloca o cronograma.

## 6. Adicionar predecessoras

Na coluna **Predecessoras**, use `+` para pesquisar por número ou título. É
possível selecionar várias tarefas em uma operação. Relações inválidas,
duplicadas ou cíclicas não são oferecidas.

As relações atuais são do tipo Término–Início (`FS`). O intervalo em dias úteis
é o lag. Antes de confirmar um lote, a aplicação mostra as datas que serão
alteradas. A operação inteira pode ser desfeita com `Ctrl+Z` e refeita com
`Ctrl+Shift+Z`.

Uma tarefa-resumo pode ser predecessora, mas não sucessora. Alterações em seus
descendentes recalculam seu fim e podem propagar a sucessoras automáticas.

## 7. Usar as visualizações

### Tabela

É a superfície principal de edição. Permite edição inline, hierarquia, seleção
múltipla, filtros, predecessoras e redimensionamento das colunas **Tarefa** e
**Predecessoras**.

### Kanban

Agrupa as tarefas por status. Arraste um cartão ou use seu seletor de status. O
menu de contexto oferece as principais ações sem exigir retorno à Tabela.

### Gantt

Apresenta barras, resumos, progresso, calendários e relações. A legenda
resumida permanece no cabeçalho sem ocupar a área do gráfico. Use **Opções**
para abrir a ajuda de rolagem e o seletor de dependências. O painel
**Inspecionar tarefa** é a alternativa acessível aos gestos. Tarefas manuais e
resumos bloqueiam movimentos incompatíveis com suas regras.

A barra horizontal permanece visível na base da linha do tempo. Use-a para
navegar pelas datas sem precisar chegar à última atividade.

## 8. Filtros e análise

Os filtros cobrem texto, status, prioridade, criticidade, responsáveis, datas e
tags. Eles permanecem ativos ao alternar entre as views e podem limitar o
conteúdo do PDF.

Em telas menores, a rolagem permite que o cabeçalho do projeto saia de cena e
mantém a barra de filtros fixada abaixo do menu do aplicativo. Assim, texto,
status e demais critérios continuam disponíveis ao percorrer tarefas.

O caminho crítico é opcional por projeto. Quando ativado, mostra a sequência de
tarefas que controla o término, a folga em dias úteis e as tarefas quase
críticas. A meta final é o maior prazo-limite entre tarefas não canceladas; sua
margem é informativa e não altera quais tarefas são críticas.

## 9. Plano de referência e saúde

**Criar plano de referência** fotografa o planejamento aprovado. Depois, a
Tabela e o Gantt podem comparar o plano com as datas atuais e mostrar desvios.

A saúde usa prazo-limite, estado atual e data real de conclusão para distinguir
itens sem prazo, no prazo, em risco, atrasados, concluídos com atraso ou
cancelados. Ao concluir uma atividade, revise os dados no diálogo comum às três
visualizações.

## 10. Reutilizar e transportar

- **Duplicar tarefa/árvore/projeto** cria novos UUIDs e preserva apenas relações
  internas válidas.
- **Templates** reutilizam árvores, durações, prioridades, tags e relações.
- **Exportar projeto/workspace** cria pacote `.chronoproject`.
- **Criar backup** gera uma cópia SQLite integral para recuperação.
- **Gerar PDF** cria um relatório local, não reimportável.

Importação e restauração são operações diferentes. A restauração substitui o
workspace inteiro; a importação permite selecionar e copiar projetos.

## 11. Atalhos essenciais

| Atalho | Ação |
| --- | --- |
| `Ctrl+Z` | Desfazer a última operação compatível |
| `Ctrl+Shift+Z` | Refazer |
| `Ctrl+Shift+L` | Travar/destravar datas das tarefas selecionadas |
| `Ctrl+/` | Abrir a lista de atalhos |
| `Esc` | Fechar menu/modal permitido ou recolher detalhes |

Campos de texto preservam o desfazer próprio do editor.

## 12. Práticas seguras

- mantenha backups antigo e atual antes de upgrades importantes;
- não edite o SQLite nem arquivos de migration manualmente;
- teste uma restauração antes de depender de um único backup;
- não compartilhe projetos reais, bancos ou logs sem sanitização;
- consulte [Solução de problemas](troubleshooting.md) antes de remover dados.
