# ADR 025 — Tarefa-resumo como predecessora FS

## Status

Aceita em 2 de outubro de 2026.

## Contexto

Uma relação ligada à última subtarefa de um grupo deixa de representar o grupo
quando uma nova irmã é acrescentada. O usuário precisa poder declarar que uma
atividade depende do término de toda a tarefa-resumo, sem perder a opção mais
específica de depender diretamente de uma folha.

As datas do resumo continuam derivadas dos descendentes. Portanto, aceitar o
resumo em ambos os lados da relação criaria duas fontes de verdade e permitiria
ciclos invisíveis quando dependências e hierarquia fossem analisadas separadamente.

## Decisão

Permitir tarefas-resumo somente como **predecessoras** de relações FS. Uma
tarefa-resumo nunca pode ser sucessora, porque seu início e fim continuam
calculados exclusivamente a partir das subtarefas.

O grafo de scheduling passa a combinar:

- arestas FS da predecessora para a sucessora;
- arestas estruturais de cada descendente direto para sua tarefa-pai.

Validação de ciclos, ordenação topológica e descoberta do subgrafo afetado usam
esse grafo combinado. Quando um descendente muda, seus resumos são recalculados
antes das sucessoras externas que dependem deles.

Ao transformar uma folha com relações em resumo, a interface oferece:

- **manter no novo resumo**, somente quando todas as relações da folha são de saída;
- **transferir para a nova subtarefa**;
- **remover dependências**.

Uma tarefa que já é resumo mantém automaticamente suas relações de saída ao
receber outra subtarefa. Relações diretas de uma folha com tarefas externas não
são realocadas ao acrescentar irmãs.

A migration `0006_summary_predecessors.sql` substitui os triggers antigos e
repete no SQLite a regra “resumo pode ser predecessora, nunca sucessora”. A
mesma política vale para templates.

## Consequências

- depender do resumo acompanha futuras subtarefas e o novo término agregado;
- depender diretamente de uma folha continua isolado de novas irmãs;
- ciclos que combinam hierarquia e dependências são rejeitados antes da escrita;
- duplicação, templates e pacotes portáteis preservam a relação por UUID;
- pacotes dos schemas 4 e 5 são atualizados em cópia temporária durante a importação;
- o schema SQLite avança para a versão 6, sem alterar o formato `.chronoproject`.

## Alternativas rejeitadas

- mover automaticamente toda relação da última folha para o resumo: mudaria a
  intenção de relações específicas já existentes;
- aceitar resumo como sucessora: conflitaria com suas datas derivadas;
- expandir a relação do resumo em várias relações de folhas: criaria ligações
  instáveis e exigiria reescrita sempre que a árvore mudasse.
