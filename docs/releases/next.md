# ProjectFlow v0.1.6 — preparação do release

Revisado em 08/09/2026. Este arquivo é versionado; os instaladores e hashes
gerados ficam em `.local/distribution/<versão>/`, fora do Git.

## Identidade confirmada

Os manifests locais estão alinhados em `0.1.6`; o schema SQLite permanece 4.
A última release pública informada pelo usuário é `v0.1.5`. O próximo
pacote preparado localmente é `v0.1.6`. Instaladores, assinaturas, manifesto
e hashes foram gerados e verificados em `.local/distribution/v0.1.6/`.

## Escopo

- Emulação de escala Windows/WebView2 em 125% e 150% no E2E desktop.
- Verificação da estrutura acessível, foco, menu de atalhos e `Esc`.
- Verificação de layout responsivo sem rolagem horizontal global.
- Documentação dos testes manuais ainda necessários com escala real e
  Narrador em VM limpa.

## Evidências locais

- 122 testes regulares aprovados.
- 30 testes Rust/SQLite aprovados.
- 1 jornada E2E da aplicação aprovada.
- 2 testes de desempenho aprovados.
- 5 cenários E2E na janela Tauri real aprovados.
- lint, formatação, typecheck, build web, Cargo check e Clippy aprovados.

## Pacote gerado

- Instaladores padrão e offline assinados com a chave permanente.
- Assinaturas criptográficas, hashes e `latest.json` da mesma versão
  verificados localmente.
- Publicar somente após autorização explícita do usuário.

Assets: instalador padrão, instalador offline, dois `.sig`, `latest.json` e
`SHA256SUMS.txt`. Certificado Authenticode continua separado da assinatura Tauri.
