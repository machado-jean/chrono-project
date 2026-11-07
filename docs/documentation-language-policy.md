# Política de idiomas da documentação

## Objetivo

O Chrono Project mantém a documentação de produto, operação, contribuição e
governança em Português (Brasil) e English. Os dois idiomas devem comunicar a
mesma informação factual para que pessoas usuárias, contribuidoras e revisoras
consigam operar o projeto sem depender de uma tradução informal.

## Convenção de arquivos

- a fonte em Português (Brasil) usa o nome canônico, por exemplo
  `docs/scheduling.md`;
- a versão English usa o mesmo caminho e o sufixo `.en.md`, por exemplo
  `docs/scheduling.en.md`;
- `README.md` usa a exceção histórica `README.en.md`;
- ambos os arquivos são versionados, catalogados em `docs/README.md` e têm
  links internos válidos.

## Cobertura obrigatória

A exigência alcança guias, documentação técnica e operacional, ADRs, políticas
de comunidade, a nota do release corrente, changelog e instruções de contribuição. A
licença MIT canônica não é traduzida: ela permanece como o texto jurídico
original.

Notas de release históricas permanecem somente em PT-BR como registros
imutáveis. A partir de v0.3.0, cada release novo recebe seu par English durante
o próprio checklist. Documentos históricos preservam data, escopo e fatos do
registro original; uma tradução não pode reescrever o evento nem inventar
informação ausente.

## Processo de atualização

1. Alterar a fonte em PT-BR e a versão English na mesma branch.
2. Conferir títulos, comandos, versões, caminhos, hashes e URLs nos dois
   idiomas.
3. Registrar no índice a finalidade de cada par.
4. Antes do commit final de release, executar:

   ```powershell
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1 -RequireEnglishPairs
   ```

5. Não abrir Pull Request de release enquanto houver qualquer par ausente ou
   divergência factual.

## Limites de tradução

Nomes de arquivos, comandos, chaves de configuração, identificadores, nomes de
produtos e blocos de código não devem ser traduzidos. Textos exibidos na
interface devem corresponder à tradução efetivamente entregue pelo aplicativo.
