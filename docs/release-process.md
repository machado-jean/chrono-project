# Processo de release

Este checklist complementa `AGENTS.md`. Publicar os arquivos no GitHub não encerra
o release: a execução de CI associada à **tag** também precisa ficar verde.

O procedimento operacional completo, incluindo executável, instaladores,
assinaturas, staging, scripts e protocolo de espera, está em
[`release-runbook.md`](release-runbook.md) e deve ser seguido integralmente.

O agente prepara artefatos, documentação interna e conteúdo do GitHub Release.
O usuário executa pessoalmente as duas etapas finais: commit/push e publicação
por `PUBLISH_RELEASE.ps1`.

As release notes versionadas precisam estar completas antes desse commit, sem
campos `PENDENTE` ou valores destinados a preenchimento pós-publicação. URLs e
identificadores que só existirem depois da publicação devem permanecer no
GitHub Release, no registro de build e no relatório final, sem novo commit.

## Antes da tag

1. Confirmar versão consistente em `package.json`, `Cargo.toml`, `Cargo.lock` e
   `tauri.conf.json`.
2. Executar todos os gates locais descritos em `docs/releases/next.md`.
3. Validar manualmente a versão de teste com o banco compartilhado de
   desenvolvimento.
4. Quando o release altera a identidade visual, executar o roteiro de
   [`branding.md`](branding.md) e conferir o ícone no executável, barra de
   tarefas, menu Iniciar, atalho, lista de aplicativos, instalador e
   desinstalador.
5. Registrar tamanhos e SHA-256 dos dois instaladores em
   [`releases/v0.2.1.md`](releases/v0.2.1.md).
6. Criar o commit somente após a aprovação dessa auditoria.

## Depois de publicar

No PowerShell, execute:

```powershell
.\scripts\Check-ReleaseCi.ps1 -Tag v0.2.1
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
