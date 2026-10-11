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

- antes da submissão, o identificador não existia no catálogo público nem em
  outro Pull Request do `microsoft/winget-pkgs`; a primeira solicitação é o
  PR [#450697](https://github.com/microsoft/winget-pkgs/pull/450697);
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
- a v0.2.7 foi publicada no commit aprovado pelo CI, e o digest público do
  instalador padrão coincide com o SHA-256 local;
- os quatro manifests em schema 1.12.0 passaram em `winget validate`;
- o WinGet baixou o asset versionado, confirmou o hash e instalou a aplicação
  silenciosamente a partir do manifesto local;
- desinstalação silenciosa e reinstalação pelo manifesto preservaram os bancos
  de produção e legado byte a byte.

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

- [x] gerar e publicar a v0.2.7 com o publisher corrigido;
- [x] confirmar `ProductName`, `ProductVersion`, `CompanyName` e `Publisher` no
  executável, instalador e registro de desinstalação;
- [x] confirmar o SHA-256 local igual ao digest público do asset;
- [x] instalar como usuário comum com `/S`, sem diálogo ou elevação;
- [x] confirmar preservação do banco existente durante o teste silencioso;
- [ ] instalar a versão sobre a anterior e confirmar upgrade sem duplicidade;
- [x] desinstalar silenciosamente com `/S` e confirmar código de saída zero;
- [x] registrar quais dados do usuário permanecem após a desinstalação;
- [x] verificar o instalador padrão com o Microsoft Defender, sem ameaças;
- [ ] observar o SmartScreen em uma máquina limpa;
- [x] não adquirir certificado comercial; avaliar somente opção gratuita e
  confiável para projeto open source sem bloquear a v0.2.7;
- [x] instalar o WingetCreate oficial 1.12.13.0 neste host;
- [x] gerar os três manifests no schema vigente: version, installer e
  defaultLocale, mais o locale `en-US`;
- [x] usar exclusivamente a URL versionada do instalador online x64;
- [x] validar os manifests com `winget validate --manifest`;
- [x] testar `winget install --manifest` e a desinstalação silenciosa neste
  host, com reinstalação final pelo mesmo manifesto;
- [ ] repetir instalação e desinstalação em máquina limpa ou VM; usar outra
  máquina/VM enquanto o Windows Sandbox não estiver disponível neste host;
- [ ] depois da entrada no catálogo, testar
  `winget uninstall --id ChronoProject.ChronoProject --exact`;
- [ ] depois da entrada no catálogo, adicionar aos READMEs um badge de
  disponibilidade/versão do WinGet ligado a `ChronoProject.ChronoProject`;
- [x] conferir novamente pacote e PR duplicados imediatamente antes do envio;
- [x] enviar um único PR contendo apenas uma versão do pacote;
- [x] aceitar o CLA da Microsoft e acompanhar todos os checks de validação.

Os manifests fonte ficam em:

```text
packaging/winget/manifests/c/ChronoProject/ChronoProject/0.2.7/
```

Esse caminho espelha exatamente a estrutura exigida pelo `winget-pkgs`. O
WingetCreate enviou somente os manifests da versão 0.2.7 ao PR, sem documentação
ou outros arquivos do repositório do Chrono Project.

Evidências do teste local:

| Item | Resultado |
| --- | --- |
| WinGet | `1.29.380` |
| WingetCreate | `1.12.13.0` |
| validação | `Êxito na validação do manifesto` |
| download | URL pública versionada da v0.2.7 |
| SHA-256 verificado | `B298C57927D63AD84CDF663DFA5DEFC487F47B3696C6DB125E591026446EC455` |
| instalação silenciosa | aprovada |
| desinstalação silenciosa | aprovada |
| executável reinstalado | versão 0.2.7, empresa Jean Machado |
| Microsoft Defender | nenhuma ameaça encontrada |
| banco `chronoproject` | `FB95528E5660885AF5D306B1F4066757F9591F1BB3CE36C6A873736E398218B4` |
| banco legado | `C60AE652EDFF278D5FC40BA3765B1DC93A7F54FEE3A288B8EA2FFE90DA796491` |

O primeiro conjunto foi submetido em 11 de outubro de 2026, sem expor token na
linha de comando:

```powershell
wingetcreate submit `
  --prtitle "New package: ChronoProject.ChronoProject version 0.2.7" `
  packaging\winget\manifests\c\ChronoProject\ChronoProject\0.2.7
```

Sem `--token`, o WingetCreate solicitou autenticação segura no GitHub e abriu o
[PR microsoft/winget-pkgs#450697](https://github.com/microsoft/winget-pkgs/pull/450697).
A validação local do manifesto foi aprovada e o CLA da Microsoft foi aceito
com sucesso. As dez etapas técnicas do catálogo também foram aprovadas,
incluindo varredura do instalador, instalação e metadados. O PR permanece
aberto e apto a merge, aguardando somente a aprovação obrigatória de um
moderador voluntário antes da publicação.

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

