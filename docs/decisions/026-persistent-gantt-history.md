# ADR 026 — Histórico persistente de edição do Gantt

## Status

Aceita em 3 de outubro de 2026.

## Contexto

O Gantt já oferecia desfazer e refazer, mas as pilhas existiam somente na
instância montada do componente. Trocar de view ou reabrir o aplicativo apagava
uma proteção importante contra gestos temporais acidentais. Linha de base não é
substituto: ela registra um plano aprovado, enquanto desfazer/refazer registra
uma sequência curta de edição local.

## Decisão

Persistir no SQLite uma pilha `undo` e uma pilha `redo` por projeto na tabela
`gantt_history_state`. Cada entrada contém somente o estado anterior e posterior
necessário para reverter uma edição temporal realizada pelo Gantt.

As pilhas:

- mantêm no máximo 50 revisões cada;
- são validadas na fronteira TypeScript e novamente na camada nativa;
- possuem limite conjunto de 1 MiB;
- são excluídas por cascade junto com o projeto;
- são carregadas ao montar o Gantt e gravadas após editar, desfazer ou refazer;
- têm `redo` limpo quando uma nova edição sucede um desfazer.

O escopo inclui datas, duração, progresso e lag alterados pelos gestos do Gantt.
Operações estruturais, importação, exclusão de tarefas e alterações externas à
view não entram nessas pilhas. O histórico não é exportado como intenção de
negócio nem funciona como auditoria multiusuário.

A migration `0007_persistent_gantt_history.sql` eleva o schema para 7. Pacotes
dos schemas 4, 5 e 6 são migrados apenas em uma cópia temporária durante a
inspeção/importação.

## Consequências

- desfazer/refazer sobrevive à troca de view e à reabertura da aplicação;
- o crescimento é limitado e previsível;
- tarefas e dependências continuam sendo a fonte de verdade do cronograma;
- uma revisão inválida ou excessiva é rejeitada antes da escrita;
- o recurso não promete reverter mutações feitas fora do Gantt.

## Alternativas rejeitadas

- manter somente em memória: perde a proteção justamente ao navegar ou reabrir;
- armazenar snapshots completos do workspace: amplia custo, risco e escopo de
  reversão sem necessidade;
- reutilizar linhas de base: mistura plano aprovado com histórico transitório;
- criar uma auditoria global nesta etapa: exigiria semântica própria para todas
  as operações e pertence a um incremento futuro.
