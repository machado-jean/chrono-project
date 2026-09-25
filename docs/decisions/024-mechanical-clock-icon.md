# ADR 024 — Relógio mecânico como símbolo visual

## Status

Aceita em 24 de setembro de 2026.

## Contexto

A identidade Chrono Project precisava substituir o marcador provisório `PF` e
os ícones abstratos usados durante o desenvolvimento. O símbolo deveria
comunicar tempo, cronologia e precisão, permanecer reconhecível em tamanhos
pequenos e ser original.

A referência inicial ao tema de relógio de Chrono Trigger foi tratada somente
como memória afetiva e direção conceitual. Copiar tipografia, composição,
ornamentos ou o relógio daquela marca não seria aceitável.

## Decisão

Adotar um relógio mecânico aberto em forma de `C`, com engrenagens aparentes,
dois ponteiros, filigranas e três extensões externas em 12, 9 e 6 horas.

A escala segue a lógica de um relógio analógico: marcadores principais a cada
cinco minutos e quatro pautas menores, radiais e uniformes, entre marcadores
adjacentes. O mostrador usa azul-marinho, metal dourado e um arco ciano de
progresso sobre fundo transparente.

O mesmo símbolo é a fonte de verdade para a interface e para os derivados do
Tauri. A barra lateral exibe **Planejamento local**, sem repetir o nome que já
está na barra nativa da janela.

## Consequências

- o ícone ganha riqueza visual em tamanhos maiores e mantém o contorno do `C`
  como elemento de reconhecimento em tamanhos reduzidos;
- detalhes mecânicos podem se simplificar visualmente em 16–32 px, portanto o
  contorno, os ponteiros e as três extensões têm prioridade;
- qualquer alteração futura deve regenerar todo o conjunto de ícones e repetir
  a inspeção nos pontos de integração do Windows;
- a especificação detalhada e os caminhos dos ativos ficam em
  [`docs/branding.md`](../branding.md).

## Alternativas rejeitadas

- manter `PF`: fazia referência ao nome provisório ProjectFlow;
- símbolo abstrato de dois arcos: não comunicava relógio com clareza;
- logotipo horizontal: não cabe nos pontos de uso de um ícone desktop;
- aproximação visual de Chrono Trigger: reduziria a originalidade e criaria
  associação indevida com outra propriedade intelectual.

