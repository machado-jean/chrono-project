# Chrono Project — próxima versão

Este documento é o rascunho vivo das próximas notas de release. Ele deve ser
preenchido durante o desenvolvimento e nunca reutilizar itens de uma versão já
publicada.

## Escopo confirmado

- interface localizável em Português (Brasil) e English, com preferência
  persistida apenas no dispositivo;
- tradução dos menus, navegação, controles de janela, views, filtros, ações de
  projeto, PDF, baseline e explicação do caminho crítico;
- dados do usuário e formato do banco preservados sem tradução automática.

## Compatibilidade e dados

- sem mudança de schema SQLite;
- formato `.chronoproject` inalterado;
- diretório de dados `chronoproject` inalterado;
- não há migration nem mudança de dados em preparação.

## Gates automatizados

- [ ] preenchido quando existir um novo candidato.

## Auditoria documental do próximo candidato

Preencher somente durante o próximo checklist de release.

## Validação pública

- [ ] será definida junto ao próximo escopo.

## Pendências antes da publicação

- definir escopo, versão e data quando o próximo incremento estiver fechado;
- executar o checklist completo de `docs/release-runbook.md`.
