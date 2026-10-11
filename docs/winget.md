# Publicação no WinGet

## Identidade permanente

| Campo | Valor |
| --- | --- |
| PackageIdentifier | `ChronoProject.ChronoProject` |
| PackageName | `Chrono Project` |
| Publisher | `Jean Machado` |
| License | `MIT` |
| DefaultLocale | `pt-BR` |
| Locale adicional | `en-US` |
| Architecture | `x64` |
| InstallerType | `nullsoft` |
| Scope | `user` |
| UpgradeBehavior | `install` |

O `PackageIdentifier` do WinGet não altera o identificador Tauri
`chronoproject`, o diretório de dados ou o formato `.chronoproject`.

## Estado da auditoria inicial

Confirmado em 11 de outubro de 2026:

- o identificador não existe no catálogo público nem em Pull Requests do
  `microsoft/winget-pkgs`;
- o GitHub Release oferece URL HTTPS pública, oficial, específica da versão e
  com SHA-256 verificável;
- o pacote padrão é um NSIS x64 `currentUser`, sem elevação no fluxo normal;
- o NSIS produzido pelo Tauri aceita `/S` para instalação silenciosa;
- licença, código-fonte, release notes e downloads estão publicamente
  acessíveis;
- `Jean Machado` foi definido explicitamente como publisher do próximo bundle;
- um build NSIS de validação confirmou `MANUFACTURER = Jean Machado`,
  `CompanyName = Jean Machado` no aplicativo e copyright correspondente;
- os artefatos atuais possuem assinatura do updater Tauri, mas não assinatura
  Authenticode reconhecida pelo Windows.

O release v0.2.6 não deve ser usado para a primeira submissão porque foi gerado
antes da correção explícita do publisher. Não substituir seu instalador: gerar
uma nova versão preserva a imutabilidade da URL e do hash.

## Certificado de código

A v0.2.7 não usa Authenticode. O
[Azure Artifact Signing](https://azure.microsoft.com/pt-br/products/artifact-signing)
não atende à regra de custo zero: o plano básico oficial custa USD 9,99 por
mês. A alternativa
gratuita identificada é a [SignPath Foundation](https://signpath.org/), que
oferece assinatura sem custo para projetos open source elegíveis. A aprovação
não é automática: o projeto precisa atender às
[condições da fundação](https://signpath.org/terms.html), integrar seu processo
de build verificável e aceitar que a SignPath Foundation figure como publisher
do certificado.

Portanto, a candidatura à SignPath fica como incremento separado e não bloqueia
este release. Certificado comercial não será comprado, e certificado
autoassinado não será usado como substituto porque outros computadores não o
reconheceriam como confiável.

## Gate antes da primeira submissão

- [x] gerar localmente o candidato v0.2.7 com o publisher corrigido;
- [x] confirmar `ProductName`, `ProductVersion`, `CompanyName` e `Publisher` no
  executável, instalador e registro de desinstalação;
- [ ] publicar a v0.2.7 e confirmar o SHA-256 local igual ao digest do asset;
- [x] instalar como usuário comum com `/S`, sem diálogo ou elevação;
- [x] confirmar preservação do banco existente durante o teste silencioso;
- [ ] instalar a versão sobre a anterior e confirmar upgrade sem duplicidade;
- [x] desinstalar silenciosamente com `/S` e confirmar código de saída zero;
- [x] registrar quais dados do usuário permanecem após a desinstalação;
- [ ] executar verificação do Microsoft Defender e observar o SmartScreen;
- [x] não adquirir certificado comercial; avaliar somente opção gratuita e
  confiável para projeto open source sem bloquear a v0.2.7;
- [ ] instalar o WingetCreate oficial ou preparar as ferramentas do
  `microsoft/winget-pkgs`; ele ainda não está instalado neste host;
- [ ] gerar os três manifests no schema vigente: version, installer e
  defaultLocale, mais o locale `en-US`;
- [ ] usar exclusivamente a URL versionada do instalador online x64;
- [ ] validar os manifests com `winget validate --manifest`;
- [ ] testar `winget install --manifest` e `winget uninstall --manifest` em
  ambiente limpo; usar outra máquina/VM enquanto o Windows Sandbox não estiver
  disponível neste host;
- [ ] conferir novamente pacote e PR duplicados imediatamente antes do envio;
- [ ] enviar um único PR contendo apenas uma versão do pacote;
- [ ] aceitar o CLA da Microsoft e acompanhar todos os checks de validação.

## Campos previstos do instalador

```yaml
PackageIdentifier: ChronoProject.ChronoProject
PackageVersion: <versão sem o prefixo v>
InstallerType: nullsoft
Scope: user
UpgradeBehavior: install
InstallModes:
  - interactive
  - silent
  - silentWithProgress
Installers:
  - Architecture: x64
    InstallerUrl: https://github.com/machado-jean/chrono-project/releases/download/v<versão>/Chrono-Project-Windows-x64-Setup.exe
    InstallerSha256: <SHA-256 do asset publicado>
```

Não publicar o instalador offline no manifesto inicial: o pacote padrão é muito
menor, e o WebView2 já integra o Windows 11. O offline continua disponível como
download manual para ambientes isolados.

## Atualizações futuras

Nunca reutilizar URL mutável `releases/latest`, substituir um asset publicado ou
mover uma tag. Cada versão recebe diretório próprio no `winget-pkgs`, hash novo,
release notes correspondentes e validação completa. A atualização do manifesto
ocorre somente depois que o CI de `main`, a tag e o GitHub Release estiverem
coerentes entre si.

