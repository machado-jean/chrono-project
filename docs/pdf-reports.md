# Relatórios PDF

O ProjectFlow gera documentos PDF inteiramente no computador do usuário. Abra
um projeto e selecione **Gerar PDF**, ao lado das visualizações.

## Formatos

- **Relatório completo:** indicadores de quantidade e conclusão, distribuição
  por status e prioridade, lista de atividades e cronograma Gantt.
- **Lista de atividades:** hierarquia, status, prioridade, datas, duração,
  progresso e predecessoras. Descrição, responsável, tags e observações podem
  ser incluídos.
- **Cronograma Gantt:** barras vetoriais para tarefas e resumos, com o progresso
  sobreposto. O cabeçalho apresenta o dia da semana em português na primeira
  linha e o número do dia logo abaixo (`SEG` / `10`). Linhas verticais marcam
  cada data, colunas alternadas facilitam acompanhar muitas linhas e finais de
  semana usam fundo distinto. Dependências FS são desenhadas com cotovelos e
  setas; uma linha tracejada entrando pela borda indica origem fora da página ou
  do período selecionado.

## Opções

- todas as atividades ou somente as visíveis pelos filtros atuais;
- papel A4 ou A3, sempre em paisagem;
- início e fim da janela do cronograma;
- detalhes textuais opcionais.

O intervalo temporal enquadra o gráfico, mas não remove atividades. Itens sem
cronograma ou fora da janela recebem indicação textual. O seletor nativo permite
escolher nome e pasta antes da gravação.

## Conteúdo e privacidade

O relatório usa um retrato do estado atual do projeto. Ele não é um backup,
não pode ser reimportado e não altera os dados. A geração é offline e não usa
telemetria ou serviços remotos.

## Limites desta entrega

- dependências FS também aparecem por nome na tabela; relações entre páginas são
  indicadas na borda, sem uma linha contínua atravessando a quebra física;
- a hierarquia é sempre expandida no documento;
- não há cabeçalho ou logotipo personalizado;
- PDFs acima de 50 MB são rejeitados antes da gravação.

A arquitetura e as referências de produto estão registradas no
[ADR 021](decisions/021-local-pdf-reports.md).
