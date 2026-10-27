# Chrono Project — próxima versão

Este documento é o rascunho vivo das próximas notas de release. Ele deve ser
preenchido durante o desenvolvimento e nunca reutilizar itens de uma versão já
publicada.

## Escopo confirmado

- barra horizontal nativa e persistente no Gantt, sincronizada com a linha do
  tempo e acessível sem percorrer as atividades até o fim;
- legenda resumida sempre visível no cabeçalho do Gantt e cabeçalhos mantidos
  durante a rolagem de Tabela, Kanban e Gantt;
- filtros fixados abaixo do menu depois da rolagem inicial do cabeçalho do
  projeto, para preservar critérios de busca em telas menores;
- altura do Gantt ajustada ao espaço visível abaixo do gráfico, preservando a
  barra horizontal em janelas altas e reduzidas;
- altura dinâmica também na Tabela, com transições discretas e respeito à
  preferência do sistema por reduzir movimento;
- análise de caminho crítico indexada para evitar percursos repetidos da árvore
  ao salvar ou editar tarefas; o orçamento reproduzível cobre 1.000 tarefas;
- expansão da Tabela otimizada: detalhes e validação de candidatas a
  predecessora são calculados sob demanda, sem trabalho de scheduler ou banco
  ao abrir e recolher uma hierarquia;
- observadores internos do Gantt agrupados por quadro de desenho e lista de
  predecessoras do menu contextual adiada até sua abertura, evitando reações
  repetidas a uma mesma atualização visual;
- novas mudanças do aplicativo devem ser registradas aqui antes do próximo
  ciclo de release.

## Compatibilidade e dados

- sem mudança de schema SQLite;
- formato `.chronoproject` inalterado;
- diretório de dados `chronoproject` inalterado;
- as mudanças correntes incluem interface e desempenho, sem alterar o formato
  de dados ou a compatibilidade dos projetos existentes.

## Gates automatizados

- [ ] índice `docs/README.md` percorrido integralmente e
  `scripts/Test-DocumentationIndex.ps1` aprovado;
- [ ] gates serão preenchidos quando existir um novo candidato.

## Auditoria documental do próximo candidato

Preencher durante o checklist de release; não antecipar resultados:

- total catalogado: —;
- atualizados: —;
- revisados sem mudança: —;
- não aplicáveis/históricos: —;
- arquivos atualizados: —.

A soma das três categorias deve ser igual ao total emitido por
`scripts/Test-DocumentationIndex.ps1`.

## Validação pública

- [ ] validação pública será definida junto ao próximo escopo.

## Pendências antes da publicação

- definir versão e data quando o próximo escopo funcional estiver fechado;
- mover as notas concluídas para `docs/releases/vX.Y.Z.md`;
- atualizar versões, documentação interna e conteúdo do GitHub Release;
- executar o checklist completo de `docs/release-runbook.md`.

As mudanças concluídas até a v0.2.7 estão registradas em
[`v0.2.7.md`](v0.2.7.md).
