# ADR 023 — Chrono Project como identidade do produto

## Status

Aceita em 16 de setembro de 2026.

## Contexto

O nome provisório ProjectFlow coincide com diversos produtos de gestão de
projetos. A busca preliminar realizada na base do INPI não encontrou pedidos ou
registros exatos para `CHRONO PROJECT` ou `PROJECT CHRONO`. Existem marcas com o
radical `CHRONO` e um projeto científico internacional chamado Project Chrono,
mas em atividades distintas. O produto permanece independente e não possui
vínculo com esse projeto.

A aplicação ainda está em fase pré-1.0, possui somente dados descartáveis de
teste e não precisa preservar compatibilidade com instalações, bancos ou
pacotes exportados sob a identidade anterior.

## Decisão

A identidade oficial passa a ser:

- nome público: **Chrono Project**;
- nome curto: **Chrono**;
- slug e pacote: `chrono-project`;
- identificador Tauri: `io.github.machadojean.chronoproject`;
- banco local: `chronoproject.sqlite`;
- pacote portátil: extensão `.chronoproject` e formato `chronoproject`;
- variáveis de automação: prefixo `CHRONO_PROJECT_`;
- primeira versão com a nova identidade: `0.2.0`.

ProjectFlow 0.1.x e Chrono Project 0.2.0 são tratados como aplicações distintas.
Os bancos de desenvolvimento, E2E e produção usados nos testes serão recriados,
sem migration de identidade.

## Consequências

- Instaladores, executável, updater, relatórios, logs e documentação usam Chrono
  Project.
- Releases e tags 0.1.x continuam sendo evidência histórica da identidade
  anterior e não devem ser reescritas no GitHub.
- O repositório remoto deve ser renomeado para `machado-jean/chrono-project`
  somente depois de o código 0.2.0 passar pelos gates locais.
- A identidade visual deve ser própria e não pode sugerir associação com o
  Project Chrono de simulação física.
