# ADR 022 — Linhas de base imutáveis e prazos informativos

## Estado

Aceita em 10/09/2026.

## Contexto

O cronograma corrente precisa ser comparado ao plano aprovado sem interferir
nas regras FS. Também é necessário distinguir a data final calculada de um
compromisso externo, que pode indicar risco sem reprogramar tarefas.

## Decisão

- Uma linha de base é uma fotografia nomeada e imutável das tarefas de um
  projeto: identidade, título, número hierárquico, início, fim, duração e
  progresso.
- Existe somente uma linha ativa por projeto. Criar uma nova desativa a atual,
  registra a substituição e preserva todo o histórico.
- O desvio de fim é calculado em dias úteis pelo calendário efetivo da tarefa.
- `deadline_date` é opcional, usa `YYYY-MM-DD` e não participa do scheduler.
- Uma tarefa aberta fica atrasada depois do prazo; antes disso fica em risco se
  seu fim corrente ultrapassar o prazo. Sem prazo não há classificação.
- Tabela, Gantt e PDF apenas projetam esses dados. O Gantt não é fonte de
  verdade e o relatório não altera a fotografia.

## Consequências

A migration 5 é aditiva. Pacotes e backups do schema 4 continuam legíveis por
uma cópia temporária migrada, sem modificar o arquivo selecionado. Exportação,
importação seletiva, cópia de projeto, backup e restauração incluem as linhas
de base; templates não armazenam prazos absolutos nem fotografias, pois ambos
dependem de um projeto e datas concretas.

O caminho crítico e a folga continuam fora desta decisão e pertencem à Fase 9.
