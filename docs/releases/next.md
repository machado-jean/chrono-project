# ProjectFlow v0.1.7 - pronta para auditoria e publicação

Iniciado em 08/09/2026. A última release preparada e informada pelo usuário é
`v0.1.6`. Os manifests locais avançaram juntos para `0.1.7`; o schema SQLite
permanece 4.

## Escopo atual

- Gerar relatório PDF completo com indicadores, distribuições, atividades e
  cronograma Gantt.
- Permitir saídas somente de atividades ou somente do Gantt.
- Respeitar hierarquia e oferecer todas as atividades ou a projeção filtrada.
- Identificar cada coluna do Gantt com dia da semana sobre o número da data e
  linhas verticais diárias, destacando finais de semana.
- Alternar suavemente a cor das colunas e desenhar dependências FS com setas,
  incluindo indicação de origem fora do período ou da página atual.
- Configurar A4/A3, intervalo do cronograma e detalhes textuais.
- Salvar pelo seletor nativo do Windows, totalmente offline.
- Tornar a publicação de backups resiliente quando o Windows mantém o SQLite
  validado aberto além da janela normal de tentativas.
- Exigir a verificação do workflow `CI` pertencente à tag depois de cada release.

## Evidências locais

- 127 testes regulares aprovados, incluindo modelo, renderer PDF e diálogo.
- 33 testes Rust/SQLite aprovados, incluindo validação do envelope PDF e da
  publicação intermediária de backup.
- 1 jornada E2E em camadas e 5 cenários na janela Tauri real aprovados.
- O E2E desktop gerou e gravou um PDF real pelo comando nativo.
- 2 testes de desempenho aprovados.
- lint, TypeScript, build web, Cargo check/fmt/Clippy aprovados.
- Amostra de duas páginas renderizada e inspecionada sem cortes ou sobreposições.
- A falha da tag `v0.1.6` foi diagnosticada como `os error 32`: o runner Windows
  reteve o arquivo SQLite validado durante a troca final. O CI de `main` do mesmo
  commit havia terminado com sucesso.

## Limites mantidos visíveis

- Dependências são listadas por nome e desenhadas no Gantt; entre páginas, a
  origem é indicada na borda em vez de atravessar a quebra física.
- O módulo PDF é carregado sob demanda e acrescenta aproximadamente 815 KB
  compactados aos chunks opcionais de código e fontes.
- Os instaladores padrão e offline, assinaturas, hashes, manifesto do updater,
  notas e script de publicação foram gerados em `.local/distribution/v0.1.7/`.

## Fora deste incremento

- setas de dependência atravessando páginas;
- editor de template visual de relatórios;
- logotipo personalizado;
- envio por e-mail ou qualquer serviço remoto.

Nenhum commit, push, tag ou release da `v0.1.7` foi executado pelo agente. Os
artefatos locais estão prontos; a publicação depende do commit do usuário e dos
gates de CI de `main` e da tag.
