# Chrono Project — próxima versão

Este documento é o rascunho vivo das próximas notas de release. Ele deve ser
preenchido durante o desenvolvimento e nunca reutilizar itens de uma versão já
publicada.

## Escopo confirmado

- manifests WinGet multi-arquivo da v0.2.7 mantidos no repositório como fonte
  reproduzível para a primeira submissão pública;
- documentação sincronizada com o schema 9, os filtros atuais, a barra de título
  integrada, o fluxo protegido de `main` e o estado da submissão ao WinGet;
- guia do usuário, solução de problemas, política de privacidade, changelog e
  catálogo de ADRs adicionados como pontos permanentes de manutenção;
- gate documental ampliado para conferir catálogo, links internos, versões e
  cobertura dos ADRs automaticamente;
- badge público com o total de downloads dos assets de Releases no GitHub;
- fluxo protegido documentado de ponta a ponta, incluindo squash merge,
  exclusão da branch e confirmação final da `main` limpa e sincronizada;
- novas mudanças do aplicativo devem ser registradas aqui antes do próximo
  ciclo de release.

## Compatibilidade e dados

- sem mudança de schema SQLite;
- formato `.chronoproject` inalterado;
- diretório de dados `chronoproject` inalterado;
- sem alteração de aplicativo confirmada após a v0.2.7; as mudanças correntes
  são exclusivamente documentais e de governança.

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
