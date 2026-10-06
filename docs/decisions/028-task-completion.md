# ADR 028 — Conclusão factual de atividades

## Contexto

O status `COMPLETED` elevava o progresso para 100%, mas não registrava quando a
atividade havia sido realmente concluída. A saúde também tratava toda atividade
concluída como **No prazo**, mesmo quando a conclusão ocorria depois do
prazo-limite. Reabrir uma atividade podia deixar status, progresso e conclusão
em estados contraditórios.

## Decisão

- `tasks.completed_date` guarda a data real de conclusão em `YYYY-MM-DD`.
- Mudar para `COMPLETED` exige confirmação comum à Tabela, Kanban e Gantt,
  progresso de 100% e uma data de conclusão entre o início da atividade e hoje.
- Uma atividade concluída depois de `deadline_date` recebe a saúde
  `COMPLETED_LATE`; uma cancelada recebe `CANCELLED`, classificação neutra.
- Reabrir remove `completed_date` e solicita um progresso coerente com o novo
  status. `NOT_STARTED` sugere 0%, estados abertos sugerem 99% e `CANCELLED`
  preserva a possibilidade de 100%.
- Uma tarefa-resumo não pode ser concluída enquanto algum descendente estiver
  aberto. Descendentes concluídos ou cancelados são considerados encerrados.
- O domínio rejeita `COMPLETED` sem 100% ou sem data, e rejeita data de conclusão
  em qualquer outro status.

## Migração e compatibilidade

A migration `0008_task_completion.sql` eleva o schema para 8. Conclusões antigas
recebem 100% e usam o fim registrado; sem fim, usam a data de `updated_at`. O
histórico transitório de desfazer/refazer do Gantt é limpo porque suas entradas
JSON anteriores não possuem o novo campo factual. Pacotes dos schemas 4 a 7 são
atualizados somente em uma cópia temporária durante inspeção, importação ou
restauração.

## Consequências

- saúde histórica deixa de depender da data atual depois da conclusão;
- atualizar ou reinstalar preserva a informação no SQLite e nos pacotes;
- 100% não conclui automaticamente uma atividade, evitando mudança de status
  sem confirmação explícita;
- o progresso de uma atividade concluída fica bloqueado até sua reabertura.
