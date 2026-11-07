# ADR 032 — Localização da interface

- **Status:** Aceito
- **Data:** 29/10/2026

## Contexto

O Chrono Project nasceu com toda a interface em português do Brasil. A aplicação
é distribuída também para usuários que trabalham em inglês; misturar textos
fixos nos componentes tornava essa evolução inconsistente e difícil de testar.

## Decisão

A interface passa a usar um catálogo local de mensagens, inicialmente para
`pt-BR` e `en`. Português do Brasil é o padrão. A escolha fica somente no
navegador local (`chrono-project.language`), é aplicada de imediato e atualiza
o atributo `lang` do documento. Nenhum dado do projeto é traduzido: títulos,
descrições, responsáveis, tags e demais dados escritos pelo usuário permanecem
inalterados.

Na primeira abertura, sem preferência persistida, a aplicação usa o idioma do
sistema exposto pelo WebView2 quando ele for português ou inglês; idiomas ainda
não suportados usam `pt-BR` como fallback. Depois da primeira escolha manual,
a preferência local sempre prevalece.

Não há serviço remoto, telemetria nem download de tradução. Novos textos de UI
devem entrar no catálogo tipado; status, prioridades, estados de projeto e
nomes de visualização usam os mesmos mapeadores para todas as views.

O PDF é uma extensão da interface exportada: ao ser gerado, recebe o idioma
selecionado e traduz seus cabeçalhos, métricas, status, prioridades, legenda do
Gantt, metadados e paginação. Os dados escritos pelo usuário continuam intactos.

## Consequências

- a interface continua totalmente offline;
- a preferência é específica da máquina/perfil e não altera o banco SQLite;
- testes precisam preservar o padrão `pt-BR` e cobrir a troca e restauração do
  idioma;
- o ADR 007 deixa de representar exclusividade de idioma e permanece como
  contexto histórico da escolha inicial.

## Validação

- selecionar English no menu **Idioma** atualiza menus e rótulos sem reiniciar;
- fechar e abrir a aplicação mantém a escolha;
- alternar de volta para Português (Brasil) restaura os textos em PT-BR;
- gerar o PDF em English produz cabeçalhos, legenda e paginação em inglês;
- `npm run typecheck` e os testes de componentes de idioma passam.
