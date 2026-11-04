# ADR 033 — Catálogo brasileiro interno de feriados

## Status

Aceito em 4 de novembro de 2026.

## Contexto

O catálogo offline anterior dependia de `date-holidays`, cuja árvore continha
`deepmerge` com um alerta de segurança sem versão corrigida disponível. O
Chrono Project precisa continuar oferecendo feriados brasileiros nacionais,
estaduais e móveis sem acesso à rede.

## Decisão

Remover `date-holidays` e calcular no domínio TypeScript as regras nacionais,
estaduais e móveis usadas pela interface. O cálculo gregoriano de Páscoa gera
as regras móveis; a seleção continua limitada ao Brasil e a uma UF opcional.

## Consequências

- remove a cadeia vulnerável de produção e reduz o bundle;
- mantém o funcionamento local e a persistência atual de exceções;
- exige testes explícitos para Páscoa, feriados móveis e vigências legais;
- municípios continuam sendo cadastrados manualmente.
