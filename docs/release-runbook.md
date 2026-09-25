# Runbook operacional de release

Este documento é o procedimento obrigatório quando o usuário pedir para
**gerar**, **preparar** ou **publicar** um novo release do Chrono Project. Ele
complementa `AGENTS.md` e `docs/release-process.md`.

## 1. Limites de autorização

- **Gerar/preparar o release** autoriza validações, builds e criação de
  artefatos locais sob o repositório e `.local/distribution/`.
- Criar commit, executar push, criar/mover tag ou publicar GitHub Release exige
  autorização explícita para a ação remota.
- Se o usuário disser também **publique o release**, essa frase autoriza tag e
  GitHub Release somente depois de todos os gates locais e do CI de `main`.
- Nunca fazer force-push, mover tag publicada ou substituir release pública sem
  autorização específica.

## 2. Protocolo obrigatório para etapas demoradas

Toda etapa com duração prevista superior a um minuto deve seguir este fluxo:

1. explicar qual comando será iniciado e qual artefato ele produzirá;
2. iniciar o comando em sessão persistente, com retorno rápido;
3. informar ao usuário:
   - ID da sessão;
   - comando independente para acompanhar o status;
   - sinal esperado de sucesso;
   - possível prompt interativo, como `Password:`;
4. encerrar o turno e não consultar a sessão repetidamente;
5. aguardar o usuário dizer **pode continuar**, **terminou** ou equivalente;
6. consultar a sessão uma única vez;
7. validar o artefato antes de avançar;
8. em caso de falha, explicar a causa, corrigir somente o necessário e repetir
   o mesmo protocolo.

Comando geral de acompanhamento no Windows:

```powershell
while ($true) {
    Clear-Host

    $releaseProcesses = @(
        Get-CimInstance Win32_Process |
            Where-Object {
                ($_.Name -match '^(cargo|rustc|makensis)\.exe$') -or
                (
                    $_.Name -match '^(node|cmd)\.exe$' -and
                    $_.CommandLine -match (
                        'npm run (check|test|build|tauri)|' +
                        'tauri build|cargo (build|check|test|clippy)|' +
                        'eslint|typescript.*tsc|vitest'
                    )
                )
            } |
            Select-Object ProcessId, Name, CommandLine
    )

    if ($releaseProcesses.Count -eq 0) {
        Write-Host 'PROCESSO FINALIZADO — avise o agente para validar o resultado.' -ForegroundColor Green
        break
    }

    $releaseProcesses | Format-Table -AutoSize -Wrap

    $hasBuildWorker = @(
        $releaseProcesses |
            Where-Object { $_.Name -match '^(cargo|rustc|makensis)\.exe$' }
    ).Count -gt 0

    $hasTauriHost = @(
        $releaseProcesses |
            Where-Object { $_.CommandLine -match 'tauri build' }
    ).Count -gt 0

    if ($hasTauriHost -and -not $hasBuildWorker) {
        Write-Host ''
        Write-Host 'POSSÍVEL ESPERA INTERATIVA (Password:) — avise o agente para consultar a sessão.' -ForegroundColor Cyan
    }

    Write-Host ''
    Write-Host 'Build em andamento. Nova verificação em 30 segundos; use Ctrl+C para sair.' -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}
```

O loop usa uma lista restrita de executáveis e mostra somente gates npm, Cargo,
Rust, Tauri e NSIS relacionados ao release. A restrição pelo nome do processo é
obrigatória: procurar apenas `tsc` na linha de comando produz falsos positivos
em `msSmartScreenProtection`, exibindo processos normais do WebView2 e do
SmartScreen.

Quando nenhum processo for encontrado, o loop limpa a listagem, exibe a mensagem
final e encerra sozinho. Essa mensagem significa apenas que o processo deixou de
executar; sucesso, falha ou prompt de assinatura ainda devem ser confirmados pelo
agente numa única consulta à sessão. O monitor é executado pelo usuário e não
autoriza polling do agente.

O monitor não consegue ler o texto do terminal persistente. Durante um build
Tauri, se o host continuar ativo mas não houver `cargo`, `rustc` ou `makensis`,
ele exibe **POSSÍVEL ESPERA INTERATIVA (Password:)**. A mensagem é uma heurística,
não uma confirmação: o usuário deve avisar o agente, que consultará a sessão uma
única vez e enviará Enter somente quando a chave sem passphrase estiver
confirmada.

Senhas e chaves nunca devem ser enviadas no chat. Se o assinador solicitar
`Password:` e a chave local for sabidamente sem passphrase, enviar apenas Enter.
Caso contrário, abrir o terminal para entrada direta do usuário.

### Decisão baseada no histórico de duração

Registrar no release corrente as durações informadas pelas próprias ferramentas.
Antes de cada comando, usar a mediana recente daquele mesmo gate como referência:

- mediana abaixo de 45 segundos: executar normalmente, com retorno inicial curto;
- mediana entre 45 e 60 segundos: iniciar em sessão persistente e interromper o
  turno somente se o processo continuar ativo após o retorno inicial;
- mediana acima de 60 segundos, ou etapa sem histórico confiável: iniciar em
  sessão persistente, fornecer o monitor e pausar imediatamente;
- instaladores padrão/offline, assinatura interativa e publicação
  continuam sendo tratados como demorados independentemente do cache local.

Exceção aprovada para o Chrono Project: o gate `npm run test:e2e` pode ser
acompanhado pelo agente até o término quando o cache estiver aquecido e o
histórico recente permanecer próximo de um minuto. Não pausar preventivamente
por causa da execução de 1 min 02 s registrada no release `0.2.1`. Se o gate
ultrapassar 90 segundos, ficar sem progresso aparente ou voltar a durações de
vários minutos, aplicar imediatamente o protocolo de sessão persistente e
entregar o monitor ao usuário.

Uma execução rápida não elimina a regra principal: se houver expectativa razoável
de ultrapassar um minuto, o agente deve pausar. O histórico serve para evitar
pausas desnecessárias em gates comprovadamente curtos, não para acompanhar uma
sessão longa por polling.

As próximas execuções devem registrar também o tempo total de parede do comando,
do início ao código de saída, além dos tempos internos exibidos por Cargo, Vite
ou Vitest. Para instaladores, registrar separadamente build Rust, NSIS, espera
interativa e total. Sem essa medição, não inferir a duração total a partir da
linha `Finished ... profile` do Cargo.

Pausar o turno do agente não reduz CPU, memória ou I/O consumidos pelo comando
já iniciado. A pausa existe para não manter o agente consultando repetidamente
uma etapa longa; decisões de otimização de recursos devem ser baseadas em cache,
paralelismo e medições do build, não na pausa conversacional.

## 3. Artefatos obrigatórios

Cada release `vX.Y.Z` deve terminar em `.local/distribution/vX.Y.Z/` com:

```text
chrono-project.exe
Chrono-Project-Windows-x64-Setup.exe
Chrono-Project-Windows-x64-Setup.exe.sig
Chrono-Project-Windows-x64-Offline-Setup.exe
Chrono-Project-Windows-x64-Offline-Setup.exe.sig
latest.json
SHA256SUMS.txt
RELEASE_NOTES.md
BUILD_RECORD.json
VERIFY_SIGNATURES.mjs
SIGN_AND_FINALIZE.ps1
PUBLISH_RELEASE.ps1
```

`BUILD_RECORD.json` deve registrar versão, commit, branch, data UTC, versões de
Node/npm/Rust/Cargo/Tauri, tamanho e SHA-256 de cada binário. Nenhuma chave ou
senha pode aparecer nesse arquivo.

## 4. Preparação e inspeção

1. Ler `AGENTS.md`, este runbook, `docs/release-process.md` e
   `docs/releases/next.md`.
2. Executar:

   ```powershell
   git status --short
   git branch --show-current
   git log --oneline -n 10
   git remote -v
   ```

3. Confirmar que `main` é a branch pretendida e não há alterações inesperadas.
4. Confirmar a mesma versão em:
   - `package.json`;
   - `package-lock.json`;
   - `src-tauri/Cargo.toml`;
   - pacote `chrono-project` em `src-tauri/Cargo.lock`;
   - `src-tauri/tauri.conf.json`.
5. Verificar, sem exibir conteúdo, a existência de
   `.local/secrets/chronoproject-updater.key`.
6. Criar uma pasta nova `.local/distribution/vX.Y.Z-staging/`. Não sobrescrever
   a pasta final ou artefatos históricos antes de validar integralmente o novo
   conjunto.

## 5. Gates de qualidade

Executar e registrar:

```powershell
npm ci
npm run check
npm run test:e2e
npm run test:performance
npm audit --audit-level=low
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo test --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
```

Dividir comandos demorados em etapas e aplicar o protocolo da seção 2. Não
marcar um gate como aprovado sem código de saída zero.

## 6. Executável de distribuição

Gerar sem `shared-dev-data`:

```powershell
npm run tauri:build -- --no-bundle
```

Resultado esperado:

```text
src-tauri\target\release\chrono-project.exe
```

Validar versão `X.Y.Z`, tamanho, data, SHA-256 e ausência de processos de build.
Copiar para a pasta de staging. Não confundir com `npm run tauri:build:test`, que
usa o banco do checkout e não pode ser distribuído.

## 7. Instalador padrão

Configurar a chave apenas no processo atual e iniciar:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY =
  (Resolve-Path '.local\secrets\chronoproject-updater.key').Path
npm run tauri:build:installer
```

Resultado temporário esperado:

```text
src-tauri\target\release\bundle\nsis\Chrono Project_X.Y.Z_x64-setup.exe
src-tauri\target\release\bundle\nsis\Chrono Project_X.Y.Z_x64-setup.exe.sig
```

Copiar imediatamente para o staging com o nome permanente
`Chrono-Project-Windows-x64-Setup.exe` e sua `.sig`, pois o build offline reutiliza
o diretório temporário.

## 8. Instalador offline

Iniciar com acesso de rede quando o Tauri precisar baixar o redistribuível
oficial do WebView2:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY =
  (Resolve-Path '.local\secrets\chronoproject-updater.key').Path
npm run tauri:build:installer:offline
```

Se ocorrer `os error 10013`, repetir com a permissão de rede apropriada; não
trocar a fonte do download nem desativar a verificação. Copiar o resultado para
`Chrono-Project-Windows-x64-Offline-Setup.exe` e sua `.sig` no staging.

## 9. Finalização local

1. Gerar ou atualizar `RELEASE_NOTES.md` a partir de
   `docs/releases/vX.Y.Z.md`.
2. Gerar `latest.json` com:
   - versão;
   - notas curtas;
   - `pub_date` UTC;
   - assinatura do instalador padrão;
   - URL imutável da tag no repositório `machado-jean/chrono-project`.
3. Gerar `SHA256SUMS.txt` para executável, instaladores, assinaturas, manifesto,
   notas e scripts distribuídos.
4. Gerar `BUILD_RECORD.json`.
5. Gerar scripts específicos da versão:
   - `VERIFY_SIGNATURES.mjs`: valida as duas assinaturas contra a chave pública
     incorporada;
   - `SIGN_AND_FINALIZE.ps1`: assina os dois instaladores, gera `latest.json`,
     hashes e executa a verificação;
   - `PUBLISH_RELEASE.ps1`: suporta `-VerifyOnly`, valida versão, arquivos,
     hashes, assinaturas, Git limpo, commit remoto e CI de `main` antes de criar
     tag/release; depois chama `scripts/Check-ReleaseCi.ps1`.
6. Executar `PUBLISH_RELEASE.ps1 -VerifyOnly`.
7. Somente depois da aprovação, promover o staging para
   `.local/distribution/vX.Y.Z/` por operação recuperável. Preservar qualquer
   pasta anterior até confirmar o novo conjunto.
8. Depois da promoção e da validação, aplicar a retenção local:

   ```powershell
   npm run releases:status
   npm run releases:clean
   ```

   Preservar os três releases versionados mais recentes. Pastas `-staging` e
   `-new` nunca são removidas por padrão; `-CleanStaging` só pode ser usado após
   confirmar que nenhuma compilação ou finalização está ativa.

## 9.1 Política de espaço local

- preservar os três releases locais versionados mais recentes;
- releases publicados continuam recuperáveis pelo GitHub;
- preservar os três builds de auditoria mais recentes;
- manter `src-tauri/target` para aproveitar compilação incremental;
- apenas alertar quando o cache Cargo alcançar 20 GiB;
- limpar o cache Cargo somente por solicitação explícita e depois de arquivar o
  executável relevante;
- permitir um cache verificado do WebView2 sob `.local/tools/webview2/`, com
  tamanho esperado próximo ao instalador offline, para evitar downloads
  repetidos;
- remover staging somente após promoção e validação do release correspondente.

## 10. Documentação antes da publicação

Atualizar:

- `docs/releases/vX.Y.Z.md`: novidades, compatibilidade, instalação, validação,
  tamanhos e hashes;
- `docs/releases/next.md`: marcar somente gates comprovados;
- `docs/environment.md`: versões, comandos e evidências;
- `docs/roadmap.md`: marco e pendências reais;
- `README.md` e documentação funcional quando o comportamento público mudar.

Executar `git diff --check`. Commit e push somente quando autorizados. Depois do
push, confirmar que `HEAD` coincide com `origin/main`.

Antes de entregar ao usuário as etapas finais, o agente deve atualizar os dois
conjuntos de documentação:

### Documentação interna do repositório

- README e documentos funcionais afetados;
- `docs/releases/vX.Y.Z.md`;
- `docs/releases/next.md`;
- `docs/environment.md`;
- `docs/roadmap.md`;
- ADRs e runbooks aplicáveis;
- tamanhos, SHA-256, resultados de testes e pendências reais.

### Conteúdo externo para a tela do GitHub

- `.local/distribution/vX.Y.Z/RELEASE_NOTES.md` completo e pronto para ser
  exibido como corpo do GitHub Release;
- título sugerido `Chrono Project vX.Y.Z`;
- lista final dos assets públicos;
- observações de instalação, atualização, compatibilidade e limitações;
- links e nomes permanentes dos instaladores;
- `latest.json` apontando para a URL imutável da tag correta.

O conteúdo interno e o externo devem descrever a mesma versão e os mesmos
artefatos. Não entregar release notes genéricas ou desatualizadas.

## 11. Publicação remota

As duas últimas etapas pertencem obrigatoriamente ao usuário:

1. revisar as alterações, executar o commit e fazer push;
2. publicar o release executando o `PUBLISH_RELEASE.ps1` preparado pelo agente.

O agente deve parar antes de cada uma delas, fornecer comandos e critérios de
verificação e aguardar a confirmação do usuário. Não executar commit, push ou o
`PUBLISH_RELEASE.ps1` em nome do usuário enquanto esta regra estiver vigente.

Depois que o usuário confirmar commit e push:

1. confirmar que `HEAD` coincide com `origin/main`;
2. confirmar o CI de `main` do commit exato;
3. orientar o usuário a executar `PUBLISH_RELEASE.ps1 -VerifyOnly`;
4. após a validação, orientar o usuário a executar `PUBLISH_RELEASE.ps1`;
5. o script deve aguardar por até cinco minutos o CI do commit aparecer e, se
   estiver `queued` ou `in_progress`, acompanhar a mesma execução com
   `gh run watch --exit-status`; somente `success` libera a publicação;
6. timeout, falha ou cancelamento do CI devem encerrar o script antes da criação
   da tag;
7. o script deve publicar tag `vX.Y.Z` sem movê-la posteriormente;
8. o script deve anexar executáveis, `.sig`, `latest.json` e
   `SHA256SUMS.txt` ao GitHub Release;
9. o script deve usar `RELEASE_NOTES.md` como corpo da release;
10. confirmar que a tag aponta para o mesmo commit aprovado pelo CI de `main`;
11. confirmar que a tag não iniciou uma execução duplicada do workflow `CI` com:

   ```powershell
   .\scripts\Check-ReleaseCi.ps1 -Tag vX.Y.Z
   ```

12. informar a URL do CI de `main` reutilizado e a URL do release.

O workflow principal `CI` não deve responder a tags. Se houver automação por tag,
ela deve usar um workflow dedicado de release e não repetir o quality gate.

## 12. Relatório final

Informar:

- versão, tag e commit;
- caminho local e URL pública;
- tamanho e SHA-256 do executável e dos dois instaladores;
- resultado das assinaturas;
- resultado dos gates locais;
- resultado separado do CI de `main` e da tag;
- teste de atualização e preservação de dados;
- pendências que ainda impedem considerar o release validado.
