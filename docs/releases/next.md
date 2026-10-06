# Chrono Project — candidato v0.2.5

O candidato `0.2.5` parte da versão publicada `0.2.4` e consolida a primeira
etapa da identidade desktop Chrono. Não altera o schema SQLite, o scheduler nem
o formato `.chronoproject`.

## Escopo confirmado

- barra de menus e navegação com composição semelhante a um aplicativo Windows;
- trilho compacto para alternar Tabela, Kanban e Gantt;
- painel de projetos intermediário, recolhível pela marca Chrono;
- superfícies e cores claras unificadas entre cabeçalho, filtros e views;
- coluna **Predecessoras** redimensionável e persistente, seguindo o contrato da
  coluna **Tarefa**;
- plano de referência e PDF integrados ao cabeçalho do projeto;
- barra horizontal da Tabela fixa na área visível durante a rolagem vertical;
- dimensões e alinhamento dos controles do cabeçalho padronizados.

## Compatibilidade

- schema SQLite permanece em `8`;
- formato `.chronoproject` permanece na versão `1`;
- identificador e diretório de dados permanecem `chronoproject`;
- a atualização sobre a v0.2.4 preserva projetos, tarefas e preferências;
- instaladores continuam destinados ao Windows 11 x64.

## Gates do candidato

- [x] lint;
- [x] typecheck;
- [x] 173 testes TypeScript/React;
- [x] build web;
- [x] `npm ci` do release;
- [x] jornada E2E;
- [x] dois testes de desempenho;
- [x] auditoria npm sem vulnerabilidades;
- [x] Cargo fmt/check/test/Clippy;
- [x] executável de distribuição;
- [x] instalador padrão assinado;
- [x] instalador offline assinado;
- [x] assinaturas, hashes, manifesto e pacote de publicação verificados.

## Validação manual recomendada

1. Confirme a barra superior, o trilho de visualizações e o painel de projetos
   em janela maximizada e na largura mínima suportada.
2. Recolha e reabra o painel de projetos usando a marca Chrono.
3. Alterne Tabela, Kanban e Gantt e confirme que tarefas e filtros permanecem
   coerentes.
4. Redimensione Tarefa e Predecessoras por arrasto e teclado; reinicie o
   aplicativo e confirme a persistência.
5. Percorra um projeto longo e confirme que a barra horizontal da Tabela fica
   acessível sem chegar à última tarefa.
6. Confirme o alinhamento e as dimensões de Estado, Plano de referência e Gerar
   PDF no cabeçalho.
7. Gere um PDF com e sem filtros ativos e confira o conjunto exportado.

Nenhum artefato da v0.2.4 deve ser alterado. Os novos binários pertencem
exclusivamente à v0.2.5.
