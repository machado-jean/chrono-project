# Processo de release

Este checklist complementa `AGENTS.md`. Publicar os arquivos no GitHub não encerra
o release: a execução de CI associada à **tag** também precisa ficar verde.

## Antes da tag

1. Confirmar versão consistente em `package.json`, `Cargo.toml`, `Cargo.lock` e
   `tauri.conf.json`.
2. Executar todos os gates locais descritos em `docs/releases/next.md`.
3. Validar manualmente a versão de teste com o banco compartilhado de
   desenvolvimento.
4. Criar o commit somente após a aprovação dessa auditoria.

## Depois de publicar

No PowerShell, execute:

```powershell
.\scripts\Check-ReleaseCi.ps1 -Tag v0.1.8
```

O script espera o workflow `CI` da tag aparecer, acompanha a execução e termina
com erro caso algum job falhe. O release somente pode ser registrado como
validado quando o comando terminar com sucesso.

Se houver falha, veja os trechos relevantes com:

```powershell
gh run view <ID_DA_EXECUCAO> --log-failed
```

Não confundir as duas execuções que normalmente compartilham o mesmo commit:
uma pertence a `main`; a outra, à tag. Ambas devem ser informadas, e a tag é o
gate pós-publicação obrigatório.

## Evidência mínima no registro

- tag e commit;
- URL da execução da tag;
- conclusão do workflow;
- instaladores publicados e respectivos hashes;
- resultado do teste de atualização a partir da versão anterior.
