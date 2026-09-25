# Chrono Project v0.2.1 — candidato a release

A versão `0.2.1` consolida a nova identidade visual do Chrono Project e a
adequação da barra lateral. Não altera o schema SQLite, o formato portátil nem
as regras de scheduling.

## Escopo

- símbolo original de relógio mecânico aberto em forma de `C`;
- conjunto Tauri/Windows regenerado a partir de `src/assets/chrono-mark.png`;
- ícone aplicado à interface, ao executável e aos instaladores;
- remoção do marcador provisório `PF`;
- remoção da repetição de `Chrono Project` na barra lateral;
- navegação recolhida com o novo símbolo;
- política de retenção dos três releases locais mais recentes;
- runbook permanente para releases reproduzíveis e acompanháveis.

As especificações visuais estão em [`docs/branding.md`](../branding.md), e a
decisão está registrada no [ADR 024](../decisions/024-mechanical-clock-icon.md).

## Compatibilidade

Esta é uma atualização direta sobre `0.2.0`. O schema SQLite permanece na
versão 5 e o formato `.chronoproject` permanece na versão 1. A atualização não
deve apagar ou recriar o banco do usuário.

## Evidência já concluída

- [x] símbolo e composição visual aprovados;
- [x] ícones Tauri/Windows regenerados;
- [x] marcador `PF` e título duplicado removidos da interface;
- [x] versões `0.2.1` alinhadas em npm, Cargo e Tauri;
- [x] política de retenção de artefatos locais aplicada;
- [x] processo operacional documentado em
  [`release-runbook.md`](../release-runbook.md).

## Gates locais e artefatos pendentes

- [x] instalação reproduzível com `npm ci`;
- [x] ESLint e typecheck TypeScript;
- [x] 140 testes TypeScript/React;
- [x] build Vite de produção;
- [x] testes de desempenho com 1.000 e 10.000 tarefas;
- [x] `cargo fmt`, `cargo check`, 37 testes Rust e Clippy;
- [x] jornada E2E da aplicação;
- [x] round-trip `.chronoproject` e preservação do schema 5;
- [x] executável de distribuição `0.2.1` gerado e versionado corretamente;
- [x] instalador padrão assinado e copiado para o staging;
- [x] instalador offline assinado e copiado para o staging;
- [x] instalação manual do pacote padrão `0.2.1` concluída com sucesso no
  Windows 11 x64;
- [x] quatro pautas intermediárias entre marcas de cinco minutos conferidas na
  arte aprovada;
- [x] ícone conferido nos pontos de integração do Windows, incluindo janela,
  barra de tarefas e menu Iniciar;
- [x] atualização manual de `0.2.0` para `0.2.1` preservando os dados;
- [x] assinaturas, `latest.json`, tamanhos e SHA-256 registrados;
- [x] `RELEASE_NOTES.md`, `BUILD_RECORD.json`, `VERIFY_SIGNATURES.mjs`,
  `SIGN_AND_FINALIZE.ps1` e `PUBLISH_RELEASE.ps1` gerados e validados;
- [x] documentação interna e texto externo do GitHub Release revisados;
- [x] commit e push executados pelo usuário;
- [x] CI de `main` aprovado para o commit publicado;
- [x] publicação executada pelo usuário com `PUBLISH_RELEASE.ps1`;
- [x] tag `v0.2.1` ligada ao commit aprovado em `main`;
- [x] CI redundante da tag, iniciado ainda pela política anterior, concluído com
  sucesso e registrado; gatilho corrigido no commit posterior `661e5b8`.

## Artefatos locais

Os artefatos finais devem ser preparados em:

```text
.local/distribution/v0.2.1/
```

O staging foi promovido para a pasta final depois que as assinaturas e o script
`PUBLISH_RELEASE.ps1 -VerifyOnly` foram aprovados. Nenhum artefato `0.2.0` foi
renomeado ou reutilizado; os binários foram recompilados com os manifests
`0.2.1`.

As notas destinadas ao GitHub Release estão em
[`v0.2.1.md`](v0.2.1.md). O usuário executará obrigatoriamente as duas últimas
etapas: commit/push e publicação pelo script preparado.
