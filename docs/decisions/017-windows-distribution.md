# ADR 017 — Distribuição Windows com NSIS e duas estratégias de WebView2

## Estado

Aceita em 2026-08-30 para a Fase 7.

## Contexto

O ProjectFlow precisa ser instalável no Windows 11 x64, funcionar sem Node,
Rust, Git ou Build Tools e oferecer uma alternativa de instalação sem internet.
O aplicativo e seus dados continuam locais; WebView2 é apenas o runtime de
renderização fornecido e atualizado pelo Windows.

O Tauri 2 pode gerar instaladores MSI (WiX) e NSIS. Também oferece os modos
`downloadBootstrapper`, `embedBootstrapper`, `offlineInstaller`, `fixedRuntime`
e `skip` para o WebView2.

## Decisão

Usar NSIS como formato principal da V1, com instalação `currentUser` e idiomas
`PortugueseBR` e `English`. A instalação por usuário evita pedir elevação e usa
o perfil do Windows, coerente com o armazenamento local do ProjectFlow.

Manter dois comandos de build:

- `npm run tauri:build:installer`: instalador compacto, com
  `downloadBootstrapper` como contingência quando WebView2 não estiver
  presente;
- `npm run tauri:build:installer:offline`: instalador maior, com
  `offlineInstaller` incorporado, capaz de preparar uma máquina sem internet.

Bloquear downgrade (`allowDowngrades: false`) para reduzir o risco de instalar
acidentalmente um schema ou binário anterior sobre dados mais novos.

Não usar `fixedRuntime`: além do tamanho superior, ele faria o projeto assumir
a distribuição contínua de correções de segurança do runtime. Não usar `skip`,
pois uma máquina sem WebView2 ficaria com uma instalação que não abre.

Não gerar MSI por padrão. Ele poderá ser acrescentado se surgir uma necessidade
de implantação corporativa por política de domínio. Para o público inicial, o
executável NSIS oferece o fluxo mais simples.

## Segurança e publicação

Os instaladores publicados até v0.1.4 não possuem Authenticode e podem exibir
aviso de editor desconhecido. Desde v0.1.3 possuem assinatura do updater Tauri,
independente de Authenticode, obrigatória para instalação pelo aplicativo.
Um futuro certificado de assinatura de código exige decisão própria; não deve
ser confundido com a chave permanente do updater. Ver ADR 020.

## Consequências

- O instalador padrão é pequeno, mas pode precisar de internet se o WebView2
  estiver ausente ou inadequado.
- O instalador offline cresce significativamente porque incorpora o runtime.
- Ambos instalam o mesmo aplicativo e preservam o banco no perfil do usuário.
- Os dois builds usam o mesmo nome de saída; se ambos precisarem ser guardados,
  o primeiro artefato deve ser copiado para outro diretório antes do segundo.

## Fontes oficiais

- [Tauri — Windows Installer](https://v2.tauri.app/distribute/windows-installer/)
- [Tauri — Webview Versions](https://v2.tauri.app/reference/webview-versions/)
- [Tauri — Distribute](https://v2.tauri.app/distribute/)
