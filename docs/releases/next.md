# ProjectFlow v0.1.5 — preparação do release

Revisado em 08/09/2026. Este arquivo é versionado; os instaladores e hashes
gerados ficam em `.local/distribution/<versão>/`, fora do Git.

## Identidade confirmada

Manifests locais: `0.1.5`; última release pública durante a preparação: `v0.1.4`. O usuário confirmou que
a atualização testada na VM terminou em `0.1.4`; `0.1.5` ainda não foi lançada.
Próximo release: `v0.1.5`. Instaladores, assinaturas, manifesto e hashes foram
gerados e verificados em `.local/distribution/v0.1.5/`.

## Notas propostas

Esta entrega melhora a confiabilidade dos testes desktop e a cobertura do
atualizador, mantendo o schema SQLite 4 e as funcionalidades de planejamento.

- Testes desktop usam dados isolados por execução, porta dinâmica e perfil
  WebView2 exclusivo por abertura.
- Fechamento controlado e verificação de processos associados ao perfil.
- Cobertura de cinco aberturas consecutivas, rejeição de execução duplicada e
  recuperação após interrupção.
- Jornada real valida planejamento, importação/exportação e persistência após
  reabrir, com comparação semântica do workspace.
- Testes da interface cobrem falhas de download e assinatura sem reiniciar.
- Workflow diagnóstico manual preserva evidências no GitHub Actions.

Validação local: 122 testes regulares, 30 Rust/SQLite, 3 cenários desktop,
1 jornada E2E em camadas e 2 testes de desempenho aprovados; lint, typecheck,
Rust fmt/check/Clippy aprovados. Os testes de updater simulam o plugin; não
substituem a atualização instalada. VM e duas execuções remotas ainda pendentes.

## Antes da publicação

- Confirmar versão e atualizar juntos package.json/package-lock.json,
  Cargo.toml/Cargo.lock e tauri.conf.json, além de expectativas de testes.
- Validar o commit candidato e compilar os dois NSIS sem `e2e` ou
  `shared-dev-data`, usando a chave permanente do updater.
- Copiar cada instalador para a pasta da versão antes de gerar a outra variante.
- Gerar `.sig`, SHA256SUMS.txt e latest.json correspondentes aos arquivos finais.
- Conferir versão interna, hashes, URL Windows x64 e assinatura do manifesto.
- Preferir URL com tag da versão no manifesto para manter download e assinatura
  associados mesmo quando a release mais recente mudar; o endpoint de consulta
  continua sendo `/releases/latest/download/latest.json`.
- Usar estas notas sem apresentar validações pendentes como concluídas.
- Publicar somente após autorização explícita do usuário.

Assets: instalador padrão, instalador offline, dois `.sig`, `latest.json` e
`SHA256SUMS.txt`. Certificado Authenticode continua separado da assinatura Tauri.
