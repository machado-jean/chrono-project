# Chrono Project — próxima versão

Este documento é o rascunho vivo das próximas notas de release. Ele deve ser
preenchido durante o desenvolvimento e nunca reutilizar itens de uma versão já
publicada.

## Escopo confirmado

- organização pública do repositório: licença MIT, formulários de Issue,
  contribuição, segurança, suporte, conduta, Pull Requests e Dependabot;
- apresentação bilíngue do GitHub com Social Preview e metadados consistentes;
- política conservadora do Dependabot, com stacks compatíveis, majors
  individuais, volume simultâneo limitado e bloqueios documentados para
  TypeScript, `sqlx` e atualizações coordenadas do Tauri;
- compatibilidade antecipada com o lint atualizado da toolchain de frontend.

## Compatibilidade e dados

- sem mudança de schema SQLite;
- formato `.chronoproject` inalterado;
- diretório de dados `chronoproject` inalterado;
- sem alteração funcional no aplicativo ou nos instaladores.

## Gates automatizados

- [x] arquivos YAML de GitHub validados;
- [x] manifests npm e Cargo validados;
- [x] links internos da documentação conferidos;
- [ ] CI de `main` aprovado no commit do candidato.

## Validação pública

- [ ] GitHub reconhece a licença MIT;
- [ ] formulários de bug e melhoria aparecem em **New issue**;
- [ ] Pull Requests carregam o checklist padrão;
- [ ] Discussions está habilitado;
- [ ] relato privado de vulnerabilidade está habilitado;
- [ ] labels e milestone da próxima versão estão disponíveis;
- [ ] Social Preview aparece nas configurações do repositório;
- [ ] READMEs PT-BR e EN renderizam corretamente.

## Pendências antes da publicação

- definir versão e data somente quando o escopo funcional estiver fechado;
- mover as notas concluídas para `docs/releases/vX.Y.Z.md`;
- atualizar versões, documentação interna e conteúdo do GitHub Release;
- executar o checklist completo de `docs/release-runbook.md`.
