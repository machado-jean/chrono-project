# ADR 021 - Relatórios PDF locais e vetoriais

## Status

Aceita em 8 de setembro de 2026.

## Contexto

O Chrono Project precisa compartilhar atividades e gráficos sem exigir que o
destinatário instale o aplicativo. A saída deve continuar offline, respeitar a
hierarquia e os filtros e usar o seletor nativo do Windows.

Ferramentas consolidadas orientaram o desenho:

- o OpenProject oferece PDF em formatos de tabela, relatório e Gantt, com
  configuração de papel e escala;
- o Smartsheet permite escolher todas as linhas ou a seleção visível, intervalo
  do Gantt, orientação, papel e ajuste;
- o Microsoft Project trata a linha do tempo como uma visão executiva adequada
  para impressão.

Referências oficiais:

- [OpenProject - exportar pacotes de trabalho](https://www.openproject.org/docs/user-guide/work-packages/exporting/)
- [Smartsheet - opções de PDF](https://help.smartsheet.com/articles/2482464-pdf-print-options)
- [Microsoft Project - imprimir a linha do tempo](https://support.microsoft.com/en-US/project/print-the-timeline-in-project)

## Decisão

Usar `pdfmake` 0.3.11 e `@types/pdfmake` 0.3.3, ambos MIT e locais ao projeto.
A biblioteca gera tabelas e vetores no WebView2 sem servidor, executável
externo ou conexão. O frontend monta uma projeção imutável do projeto; Rust
somente valida o envelope PDF, limita o arquivo a 50 MB, abre o seletor nativo e
grava os bytes escolhidos pelo usuário.

Três formatos são oferecidos:

1. relatório completo: indicadores, gráficos, tabela e Gantt;
2. lista de atividades: tabela hierárquica e detalhes opcionais;
3. cronograma Gantt: linha do tempo vetorial estática.

O escopo pode usar todas as atividades ou a projeção visível pelos filtros.
Papel A4/A3 em paisagem e intervalo temporal configurável evitam capturas de
tela e mantêm texto selecionável.

## Consequências

- Nenhum dado é enviado para serviços externos.
- O PDF não faz parte de backup nem altera o schema SQLite.
- A biblioteca e as fontes incorporadas aumentam o bundle; o módulo é carregado
  somente quando o usuário gera um PDF.
- O Gantt PDF é uma projeção estática, não um segundo renderer interativo.
- Ligações FS aparecem textualmente na tabela. Desenhar setas entre páginas e
  exportar somente uma seleção arbitrária ficam para evoluções posteriores.
