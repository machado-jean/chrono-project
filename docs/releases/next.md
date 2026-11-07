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
- catálogo de feriados brasileiros internalizado, removendo a cadeia de produção
  que incluía `deepmerge` vulnerável;
- `minimatch` atualizado por override para 11.0.4, com auditoria npm sem
  vulnerabilidades conhecidas e gate obrigatório no CI.
- notas de release públicas em Português (Brasil) e English, apresentadas de
  forma bilíngue no GitHub Release.

## Compatibilidade e dados

- sem mudança de schema SQLite;
- formato `.chronoproject` inalterado;
- diretório de dados `chronoproject` inalterado;
- não há migration nem mudança de dados em preparação.

## Gates automatizados

- [x] `npm ci`, lint, typecheck, testes TypeScript/React (202), orçamento de
  desempenho (3) e auditoria npm aprovados;
- [x] jornada E2E e testes nativos Rust aprovados (39 aprovados, 1 histórico
  ignorado);
- [x] Cargo fmt, check e Clippy aprovados;
- [x] executável e instaladores padrão/offline gerados e assinados;
- [x] índice documental padrão validado após o preenchimento da nota de release.
- [x] cobertura documental PT-BR/English completa, validada com
  `Test-DocumentationIndex.ps1 -RequireEnglishPairs` (155 documentos
  catalogados e 494 links internos válidos).

## Auditoria documental do candidato

- [x] README PT-BR/EN, changelog, roadmap, ambiente, processo e runbook
  revisados;
- [x] ADRs 016, 032 e 033, guia do usuário, agendamento e índice documental
  revisados;
- [x] notas de release completas em PT-BR e English com tamanhos e hashes.
- [x] criar e revisar as versões English de todos os documentos aplicáveis,
  incluindo guias, operação e ADRs; notas históricas de release permanecem
  como registros PT-BR imutáveis.

## Validação pública

- [x] idioma do sistema na primeira abertura, troca persistida e PDF no idioma
  selecionado aprovados manualmente;
- [x] feriados nacionais, estaduais, móveis e municipais validados.

## Pendências antes da publicação

- criar o commit final, abrir o Pull Request para `main` e aguardar o Windows
  quality gate, somente depois da cobertura PT-BR/English estar aprovada;
- após o merge, reconstruir os artefatos a partir do commit exato de `main`,
  validar assinaturas e publicar a tag/release conforme o runbook.
