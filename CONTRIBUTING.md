# Contribuindo com o Chrono Project

[English summary](#english-summary)

Obrigado pelo interesse em melhorar o Chrono Project. O projeto aceita relatos,
propostas, documentação, testes e código sob os termos da licença MIT.

## Antes de começar

- pesquise Issues e Pull Requests existentes;
- para bugs e melhorias, use os formulários em **Issues > New issue**;
- não publique bancos, backups, projetos reais, dados pessoais, segredos ou logs
  sem sanitização;
- mudanças estruturais devem respeitar `AGENTS.md` e os ADRs em
  `docs/decisions/`;
- o catálogo [`docs/README.md`](docs/README.md) indica a finalidade e o gatilho
  de revisão de toda documentação versionada;
- combine antecipadamente mudanças amplas de arquitetura, schema, formato de
  exportação ou identidade visual.

## Ambiente

O alvo principal é Windows 11 x64. Consulte `docs/environment.md` para versões
e pré-requisitos. Depois de clonar o repositório:

```powershell
npm ci
npm run check
```

Para iniciar a aplicação desktop:

```powershell
npm run tauri:dev
```

## Branches e commits

Use uma branch curta e temática, por exemplo:

```text
feat/task-milestones
fix/gantt-spacing
docs/security-policy
```

Prefira commits pequenos no formato convencional:

```text
feat: add task milestones
fix: preserve dependency lag when editing
docs: clarify Windows installation
test: cover scheduling across holidays
```

Não faça force-push em branches compartilhadas nem mova tags publicadas.
A branch `main` é protegida: toda alteração entra por Pull Request, com histórico
linear, conversas resolvidas e o check obrigatório **Windows quality gate**
atualizado e aprovado. Push direto e force-push em `main` não fazem parte do
fluxo de contribuição.

## Fluxo obrigatório de integração

Toda alteração, inclusive documentação e ajustes pequenos, segue o mesmo ciclo:

1. partir de uma `main` limpa e atualizada;
2. criar uma branch temática (`feat/...`, `fix/...`, `docs/...`, `test/...` ou
   `release/vX.Y.Z`);
3. implementar, testar e atualizar a documentação afetada;
4. revisar o diff e criar commits coerentes;
5. fazer push somente da branch temática;
6. abrir Pull Request para `main` e preencher o template;
7. aguardar o **Windows quality gate** atualizado e resolver as conversas;
8. fazer squash merge, preservando um commit linear na `main`;
9. excluir a branch temática local e remota;
10. atualizar a `main` local por fast-forward e confirmar árvore limpa e
    sincronizada com `origin/main`.

Fluxo de terminal recomendado depois das validações locais:

```powershell
git switch -c docs/exemplo
git add --all
git commit -m "docs: describe the change"
git push -u origin docs/exemplo
gh pr create --base main --head docs/exemplo
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main
git fetch --prune origin
git pull --ff-only origin main
git status --short --branch
```

O último comando deve mostrar somente `## main...origin/main`. Divergência,
arquivos modificados ou arquivos não rastreados precisam ser entendidos antes
de iniciar o próximo trabalho. Operações remotas continuam sujeitas às regras
de autorização de `AGENTS.md`.

## Regras de implementação

- regras de domínio e scheduling ficam em TypeScript puro, fora de React;
- SQLite permanece como fonte local de verdade;
- toda mudança de schema recebe uma nova migration; migrations publicadas não
  são editadas;
- datas de cronograma permanecem `date-only` no formato `YYYY-MM-DD`;
- Tabela, Kanban e Gantt projetam a mesma entidade persistida;
- recursos principais devem funcionar offline;
- preserve compatibilidade de importação, atualização e banco do usuário;
- não introduza telemetria, serviços remotos ou novas dependências sem decisão
  explícita e documentação proporcional.

## Verificações

Antes de abrir uma Pull Request, execute:

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:performance
npm run test:e2e:application
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo test --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings
npm run tauri:build:installer:ci
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1
```

Execute também os testes E2E, de desempenho ou empacotamento quando a alteração
atingir esses fluxos. Registre no Pull Request tudo que foi executado e qualquer
gate não aplicável.

## Pull Requests

Uma Pull Request deve:

- explicar problema, solução e impacto;
- apontar a Issue relacionada quando existir;
- incluir testes e evidências visuais quando aplicável;
- atualizar documentação, migrations e release notes na mesma entrega;
- permanecer focada, sem alterações não relacionadas;
- passar pelo CI da `main` antes do merge.

Ao enviar uma contribuição, você concorda que ela seja distribuída sob a mesma
[licença MIT](LICENSE) do projeto.

## English summary

Contributions in English are welcome. Search existing Issues first, use the
structured Issue forms, and never attach real databases, backups, secrets, or
personal data. Set up the project with `npm ci`, run the relevant quality gates,
keep changes focused, document schema and behavior changes, and follow
`AGENTS.md` plus the ADRs under `docs/decisions/`. Contributions accepted into
the repository are distributed under the [MIT License](LICENSE).

