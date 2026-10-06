# Chrono Project — candidato v0.2.4

O candidato `0.2.4` parte da versão publicada `0.2.3` e concentra ajustes de
usabilidade na Tabela e na portabilidade de projetos. Não altera o schema
SQLite, as regras do scheduler nem o formato `.chronoproject`.

## Escopo confirmado

- a coluna **Tarefa** começa com largura mais confortável;
- a borda direita do cabeçalho **Tarefa** permite redimensionamento entre 300 e
  760 pixels por arrasto;
- o redimensionamento também pode ser feito pelas setas do teclado, com
  restauração por duplo clique;
- a largura escolhida é preservada localmente entre execuções;
- os cabeçalhos de **Prioridade**, **Progresso**, **Duração** e
  **Prazo-limite** não cortam o botão de informação;
- o menu de contexto de cada projeto oferece **Exportar projeto…**;
- a exportação pelo clique direito usa o mesmo pacote `.chronoproject` aceito
  por **Arquivo > Importar pacote** e informa o caminho gerado.

## Compatibilidade

- schema SQLite permanece em `8`;
- formato `.chronoproject` permanece na versão `1`;
- identificador e diretório de dados permanecem `chronoproject`;
- a atualização sobre a v0.2.3 preserva projetos, tarefas e preferências;
- instaladores continuam destinados ao Windows 11 x64.

## Gates do candidato

- [x] lint;
- [x] typecheck;
- [x] 173 testes TypeScript/React;
- [x] build web;
- [x] `npm ci` do release;
- [x] jornada E2E;
- [x] testes de desempenho;
- [x] auditoria npm sem vulnerabilidades;
- [x] Cargo fmt/check/test/Clippy;
- [x] executável de distribuição;
- [x] instalador padrão assinado;
- [x] instalador offline assinado;
- [x] assinaturas, hashes, manifesto e pacote de publicação verificados.

## Validação manual recomendada

1. Abra a Tabela com tarefas de títulos longos e confirme que **Tarefa** inicia
   mais larga.
2. Arraste o divisor à direita de **Tarefa**, feche e reabra o aplicativo e
   confirme que a largura foi preservada.
3. Use as setas com foco no divisor e dê duplo clique para restaurar 380 pixels.
4. Confirme que nenhum botão `i` dos cabeçalhos está cortado.
5. Clique com o botão direito em um projeto, escolha **Exportar projeto…** e
   confirme a mensagem com o caminho do pacote.
6. Importe o pacote por **Arquivo > Importar pacote** e valide projetos,
   tarefas, dependências, calendários e linhas de base.

Nenhum artefato da v0.2.3 deve ser alterado. Os novos binários pertencem
exclusivamente à v0.2.4.
