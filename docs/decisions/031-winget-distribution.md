# ADR 031 — Distribuição pública pelo WinGet

## Status

Aceito em 11 de outubro de 2026.

## Contexto

O Chrono Project já publica instaladores NSIS x64 em releases estáveis e
versionadas no GitHub. O catálogo comunitário do Windows Package Manager pode
oferecer uma instalação verificável por linha de comando sem hospedar novamente
o binário.

O identificador do pacote WinGet é público e permanente. Ele não é o mesmo que
o identificador interno do Tauri, usado para dados e configurações locais.

## Decisão

Usar o identificador WinGet:

```text
ChronoProject.ChronoProject
```

Manter `chronoproject` como identificador interno do Tauri e `Jean Machado`
como publisher explícito do bundle Windows. A primeira submissão usará o
instalador NSIS online x64 de uma nova release estável, nunca um asset substituído
sob uma versão já publicada.

O manifesto será multi-arquivo, com `pt-BR` como locale padrão e `en-US` como
localização adicional. O instalador será declarado como `nullsoft`, escopo
`user`, comportamento de upgrade `install` e URL HTTPS específica da versão.

## Consequências

- usuários poderão instalar com
  `winget install --id ChronoProject.ChronoProject --exact`;
- cada release futura exigirá nova versão do manifesto, URL e SHA-256;
- o pacote `.sig` do updater Tauri não substitui assinatura Authenticode;
- a ausência de Authenticode não impede por si só uma submissão comunitária,
  mas pode reduzir a reputação no SmartScreen e deve permanecer explícita;
- instalação, upgrade e desinstalação silenciosos precisam ser testados antes
  de cada Pull Request ao `microsoft/winget-pkgs`.

