# Processo de release

Este checklist complementa `AGENTS.md`. Publicar os arquivos no GitHub não encerra
o release: o CI de `main` associado ao commit exato apontado pela **tag** também
precisa estar aprovado, sem criar um segundo quality gate para a tag.

O procedimento operacional completo, incluindo executável, instaladores,
assinaturas, staging, scripts e protocolo de espera, está em
[`release-runbook.md`](release-runbook.md) e deve ser seguido integralmente.

O agente prepara artefatos, documentação interna e conteúdo do GitHub Release.
O usuário executa pessoalmente as etapas remotas finais: commit e push em uma
branch temática, abertura/merge do Pull Request e publicação por
`PUBLISH_RELEASE.ps1` depois de atualizar a `main` local.

As release notes versionadas precisam estar completas antes desse commit, sem
campos `PENDENTE` ou valores destinados a preenchimento pós-publicação. URLs e
identificadores que só existirem depois da publicação devem permanecer no
GitHub Release, no registro de build e no relatório final, sem novo commit.

## Antes da tag

1. Confirmar que a `main` continua protegida por Pull Request, pelo check
   `Windows quality gate`, por histórico linear, por resolução de conversas e
   pelos bloqueios de exclusão e `force-push`.
2. Confirmar versão consistente em `package.json`, `Cargo.toml`, `Cargo.lock` e
   `tauri.conf.json`.
3. Ler integralmente [`docs/README.md`](README.md), revisar cada documento do
   índice e executar `scripts/Test-DocumentationIndex.ps1`.
4. Executar todos os gates locais descritos em `docs/releases/next.md`.
5. Validar manualmente a versão de teste com o banco compartilhado de
   desenvolvimento.
6. Quando o release altera a identidade visual, executar o roteiro de
   [`branding.md`](branding.md) e conferir o ícone no executável, barra de
   tarefas, menu Iniciar, atalho, lista de aplicativos, instalador e
   desinstalador.
7. Registrar tamanhos e SHA-256 dos dois instaladores nas notas da versão em
   `docs/releases/vX.Y.Z.md`.
8. Criar o commit somente após a aprovação dessa auditoria, em uma branch
   temática como `release/vX.Y.Z`; nunca tentar enviar o commit diretamente à
   `main` protegida.
9. Fazer push da branch, abrir o Pull Request e aguardar o check obrigatório
   `Windows quality gate` com a branch atualizada em relação à `main`.
10. Resolver todas as conversas e concluir o Pull Request por squash merge.
11. Excluir a branch temática local e remota depois do merge concluído.
12. Atualizar referências com `git fetch --prune`, trocar para `main` e executar
    `git pull --ff-only origin main`.
13. Confirmar com `git status --short --branch` que não existem mudanças locais
    e que a saída é somente `## main...origin/main`; só então executar
    `PUBLISH_RELEASE.ps1`.

## Depois de publicar

No PowerShell, execute:

```powershell
.\scripts\Check-ReleaseCi.ps1 -Tag vX.Y.Z
```

O script resolve o commit apontado pela tag, localiza o workflow `CI` de `main`
já aprovado para esse mesmo commit e confirma que a tag não disparou um CI
redundante. O release somente pode ser registrado como validado quando o comando
terminar com sucesso.

Se houver falha, veja os trechos relevantes com:

```powershell
gh run view <ID_DA_EXECUCAO> --log-failed
```

O workflow principal não responde a tags. Uma futura automação acionada por
`v*` deve ficar em um workflow de release separado e não repetir o quality gate.

## Evidência mínima no registro

- tag e commit;
- URL da execução de `main` reutilizada;
- confirmação de que a tag aponta para o mesmo commit aprovado;
- confirmação de ausência de CI duplicado para a tag;
- instaladores publicados e respectivos hashes;
- resultado do teste de atualização a partir da versão anterior.
