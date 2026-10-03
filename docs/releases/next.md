# Chrono Project v0.2.2 — candidato a release

A versão `0.2.2` melhora a segurança das edições, a produtividade na Tabela e
a previsibilidade do scheduling, além de persistir o histórico do Gantt.

## Escopo

- salvamento automático de campos válidos, com fila e recuperação de falha;
- correção da condição de corrida entre autosave e alterações consecutivas no
  grafo de dependências;
- campos de data protegidos contra anos parciais ou inválidos;
- barra horizontal da Tabela permanentemente acessível;
- menus de contexto próprios na Tabela, Kanban e Gantt;
- trava de datas individual ou em massa, com `Ctrl+Shift+L`;
- tarefa-resumo aceita como predecessora, mas não como sucessora;
- prévia das datas afetadas antes de alterar uma predecessora-resumo;
- histórico persistente de até 50 revisões de desfazer/refazer do Gantt.

## Compatibilidade

- atualização direta sobre `0.2.1`;
- schema SQLite atualizado da versão 5 para 7 pelas migrations aditivas
  `0006_summary_predecessors.sql` e `0007_persistent_gantt_history.sql`;
- banco da versão 0.2.1 validado por upgrade de uma cópia, sem alteração do
  arquivo de origem;
- formato `.chronoproject` permanece na versão 1 e aceita schemas 4 a 7;
- dados continuam locais e a aplicação permanece compatível com Windows 11 x64.

## Gates locais concluídos

- [x] versões `0.2.2` alinhadas em npm, Cargo e Tauri;
- [x] ESLint e typecheck TypeScript;
- [x] 161 testes TypeScript/React;
- [x] 39 testes Rust e auditoria isolada do banco real `0.2.1`;
- [x] `cargo fmt`, `cargo check` e Clippy com `-D warnings`;
- [x] jornada E2E da aplicação;
- [x] cinco cenários Tauri/WebView2 aprovados em duas execuções consecutivas;
- [x] testes de desempenho com 1.000 e 10.000 tarefas;
- [x] build Vite de produção;
- [x] gates reproduzidos após o alinhamento final da versão;
- [x] executável de distribuição gerado;
- [x] instalador padrão assinado;
- [x] instalador offline assinado;
- [x] artefatos, hashes e scripts finais validados;
- [x] instalação sobre `0.2.1`, abertura e migração do banco local validadas;
- [ ] commit e push executados pelo usuário;
- [ ] CI de `main` aprovado para o commit final;
- [ ] publicação executada pelo usuário com `PUBLISH_RELEASE.ps1`.

## Destino local

Os artefatos foram preparados e validados em
`.local/distribution/v0.2.2-staging/` e promovidos para
`.local/distribution/v0.2.2/` após o teste local de instalação e atualização.
Commit, push e publicação permanecem como etapas obrigatórias do usuário.

## Artefatos validados

| Arquivo | Tamanho | SHA-256 |
| --- | ---: | --- |
| `chrono-project.exe` | 21.526.016 bytes | `47946256BDECB1ABC17EBB5F8E8F92771051A9D40DCBE73E6E1A042CDA4EFF0E` |
| `Chrono-Project-Windows-x64-Setup.exe` | 7.319.198 bytes | `B20C8370C09713723E689493C8C0CDA42EAE3BFCBDA366EF612D3A31E5A5D9FD` |
| `Chrono-Project-Windows-x64-Offline-Setup.exe` | 222.348.571 bytes | `7C7DFC02CF84A52B805A67306D608FF6655DC10F98B75906FED9E1D7A05CC126` |

As assinaturas dos dois instaladores têm 428 bytes e foram aprovadas contra a
chave pública incorporada. `latest.json`, `BUILD_RECORD.json` e
`SHA256SUMS.txt` também foram regenerados e verificados.
