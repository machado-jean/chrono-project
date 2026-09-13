# ProjectFlow v0.1.8 — pacote de lançamento preparado

A versão `0.1.8` conclui a Fase 8 de controle do plano. Os manifests da
aplicação estão alinhados em `0.1.8` e a migration `0005_plan_control.sql`
eleva o schema SQLite de 4 para 5.

## Entregas

- plano de referência nomeado, fotografia ativa e histórico de revisões;
- datas planejadas versus atuais e desvio em dias úteis na Tabela;
- prazo-limite independente e saúde explicável;
- linha de base no Gantt e comparação opcional no relatório PDF;
- round-trip dos novos dados em projeto, workspace, importação seletiva,
  duplicação, backup e restauração;
- leitura compatível de pacotes e backups do schema 4 sem alterar o original;
- hierarquia validada em no máximo quatro níveis;
- conversão assistida de tarefa relacionada em tarefa-resumo;
- barra de projetos recolhível, ajuda contextual e menu de contexto;
- Gantt legível por nível, com títulos completos sob o ponteiro;
- navegação vertical integral por roda ou barra dedicada e navegação horizontal
  por barra persistente na base.

## Validação concluída

- 136 testes TypeScript/React aprovados;
- 37 testes Rust/SQLite aprovados;
- uma jornada E2E em camadas e dois cenários de desempenho aprovados;
- ESLint, TypeScript, build web, Cargo fmt/check/Clippy aprovados;
- `npm audit --audit-level=high` sem vulnerabilidades conhecidas;
- Gantt exercitado na janela real com 205 tarefas: conteúdo de 8.682 px em uma
  janela de 590 px, alcançando `scrollTop` 8.092 e a tarefa final `5.4.3.2`.

O E2E desktop por CDP não obteve as portas do WebView2 nos cinco cenários. Essa
limitação permanece diagnóstica e não bloqueante conforme o ADR 019; a janela
real e a rolagem completa foram verificadas separadamente.

## Artefatos locais

Diretório: `.local/distribution/v0.1.8/`.

| Arquivo | Tamanho | SHA-256 |
| --- | ---: | --- |
| `ProjectFlow-Windows-x64-Setup.exe` | 5.683.264 bytes | `151535872C85A8487978E587C3F2FF25602DDFF9A7561B6F801E3776E9155B22` |
| `ProjectFlow-Windows-x64-Offline-Setup.exe` | 221.190.643 bytes | `899E15B636F7BCC05A4557AE8764C8351295C8BAA05DCE1B94607DBF4D83DB56` |

Os instaladores foram gerados sem a assinatura do updater. O script
`SIGN_AND_FINALIZE.ps1` procura por padrão a chave permanente em
`.local/secrets/projectflow-updater.key`; apenas a senha, quando existir, deve
ser fornecida por `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Ele produz os arquivos
`.sig`, o `latest.json` e valida todo o pacote. Os executáveis continuam sem
Authenticode, portanto o Windows pode exibir editor desconhecido.

## Publicação

Depois de assinar e validar, faça o commit e o push da versão. Em seguida,
`PUBLISH_RELEASE.ps1` exige a árvore limpa, confirma que `HEAD` corresponde ao
`main` remoto, aguarda o CI de `main`, cria a release `v0.1.8` e aguarda também
o CI disparado pela própria tag.

Nenhum commit, push, tag ou release foi executado pelo agente.
