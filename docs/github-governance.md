# Organização pública do GitHub

Este documento registra como o repositório apresenta, recebe e organiza
colaboração pública sem alterar o fluxo de qualidade e release.

## Idiomas

- `README.md`: apresentação principal em português do Brasil;
- `README.en.md`: apresentação equivalente em inglês;
- Issues e documentos comunitários: títulos bilíngues e respostas aceitas em
  PT-BR ou inglês;
- interface do aplicativo: PT-BR até que uma internacionalização seja decidida.

## Entrada de trabalho

- bugs e melhorias usam os formulários em `.github/ISSUE_TEMPLATE/`;
- dúvidas de uso usam GitHub Discussions;
- vulnerabilidades usam o canal privado definido em `SECURITY.md`;
- Pull Requests seguem `.github/PULL_REQUEST_TEMPLATE.md`;
- Issues em branco permanecem desabilitadas.

## Labels

| Prefixo | Uso |
| --- | --- |
| `type:` | Natureza do trabalho: bug, feature ou documentação |
| `area:` | Subsistema principal afetado |
| `priority:` | Urgência relativa, sem substituir análise de impacto |
| `status:` | Estado de triagem ou bloqueio |

Uma Issue deve ter no mínimo um tipo e, depois da triagem, uma área e um status.
Não duplicar labels equivalentes sem prefixo.

## Milestones

Milestones representam versões pretendidas, não promessas de data. Itens sem
escopo confirmado permanecem no roadmap ou sem milestone. Fechar o milestone
somente depois de publicar e verificar a release correspondente.

## Dependências

Dependabot consulta npm, Cargo e GitHub Actions semanalmente. Atualizações
patch/minor compatíveis são agrupadas por stack; majors permanecem individuais
para revisão. TypeScript `>= 6.1` fica bloqueado enquanto a cadeia
`typescript-eslint` exigir versão inferior, e `sqlx >= 0.9` fica bloqueado
enquanto `tauri-plugin-sql` permanecer sobre `sqlx 0.8`.

Cada Pull Request executa o CI normal uma única vez. A automação não cria tags,
não publica releases e não substitui revisão de licença, compatibilidade ou
notas de versão. Uma exceção temporária deve registrar o motivo e ser removida
quando a dependência compatível estiver disponível.

## Apresentação

- a descrição e os topics devem refletir recursos existentes;
- o Social Preview usa `docs/assets/github-social-preview.png`;
- o arquivo `LICENSE` é a fonte canônica da licença MIT;
- releases publicadas mantêm instaladores, hashes, assinaturas e notas completas;
- tags não repetem o quality gate já aprovado para o mesmo commit em `main`.

