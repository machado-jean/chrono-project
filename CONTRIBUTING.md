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
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings
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

