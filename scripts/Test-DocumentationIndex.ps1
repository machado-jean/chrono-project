[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$indexPath = Join-Path $repositoryRoot 'docs\README.md'
$adrIndexPath = Join-Path $repositoryRoot 'docs\decisions\README.md'
$failures = [System.Collections.Generic.List[string]]::new()

function Get-RepositoryRelativePath {
    param([Parameter(Mandatory)][string]$Path)

    return [System.IO.Path]::GetRelativePath($repositoryRoot, $Path).Replace('\', '/')
}

function Get-LocalMarkdownTargets {
    param([Parameter(Mandatory)][string]$DocumentPath)

    $content = Get-Content -LiteralPath $DocumentPath -Raw
    $pattern = [regex]'!?\[[^\]]*\]\((?<target>[^)]+)\)'
    foreach ($match in $pattern.Matches($content)) {
        $target = $match.Groups['target'].Value.Trim().Trim('<', '>')
        if ($target -match '^(?:https?://|mailto:|#)') {
            continue
        }

        $target = $target -replace '#.*$', ''
        if ([string]::IsNullOrWhiteSpace($target)) {
            continue
        }

        [pscustomobject]@{
            Raw = $target
            Resolved = [System.IO.Path]::GetFullPath(
                (Join-Path (Split-Path $DocumentPath) ([uri]::UnescapeDataString($target)))
            )
        }
    }
}

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
    throw 'Índice documental ausente: docs/README.md'
}

$repositoryDocuments = @(git -C $repositoryRoot ls-files --cached --others --exclude-standard -- '*.md' '*.txt')
if ($LASTEXITCODE -ne 0) {
    throw 'Não foi possível obter a lista de documentos do Git.'
}

$repositoryDocuments = @($repositoryDocuments | Where-Object { $_ } | Sort-Object -Unique)
$cataloguedDocuments = @($repositoryDocuments; 'LICENSE') | Sort-Object -Unique
$indexedDocuments = [System.Collections.Generic.HashSet[string]]::new(
    [System.StringComparer]::OrdinalIgnoreCase
)

foreach ($link in Get-LocalMarkdownTargets -DocumentPath $indexPath) {
    if (-not (Test-Path -LiteralPath $link.Resolved)) {
        $failures.Add("docs/README.md aponta para um destino ausente: $($link.Raw)")
        continue
    }

    if (Test-Path -LiteralPath $link.Resolved -PathType Leaf) {
        [void]$indexedDocuments.Add((Get-RepositoryRelativePath -Path $link.Resolved))
    }
}

foreach ($document in $cataloguedDocuments) {
    if (-not $indexedDocuments.Contains($document.Replace('\', '/'))) {
        $failures.Add("Documento fora do índice: $document")
    }
}

$internalLinkCount = 0
foreach ($document in $repositoryDocuments) {
    $documentPath = Join-Path $repositoryRoot $document
    foreach ($link in Get-LocalMarkdownTargets -DocumentPath $documentPath) {
        $internalLinkCount++
        if (-not (Test-Path -LiteralPath $link.Resolved)) {
            $failures.Add("Link interno quebrado em $document`: $($link.Raw)")
        }
    }
}

if (-not (Test-Path -LiteralPath $adrIndexPath -PathType Leaf)) {
    $failures.Add('Catálogo de ADRs ausente: docs/decisions/README.md')
} else {
    $indexedAdrs = [System.Collections.Generic.HashSet[string]]::new(
        [System.StringComparer]::OrdinalIgnoreCase
    )
    foreach ($link in Get-LocalMarkdownTargets -DocumentPath $adrIndexPath) {
        if (Test-Path -LiteralPath $link.Resolved -PathType Leaf) {
            [void]$indexedAdrs.Add((Get-RepositoryRelativePath -Path $link.Resolved))
        }
    }

    $adrDocuments = @($repositoryDocuments | Where-Object { $_ -match '^docs/decisions/\d{3}-.*\.md$' })
    foreach ($adr in $adrDocuments) {
        if (-not $indexedAdrs.Contains($adr.Replace('\', '/'))) {
            $failures.Add("ADR fora do catálogo: $adr")
        }
    }
}

$packageVersion = (Get-Content -LiteralPath (Join-Path $repositoryRoot 'package.json') -Raw | ConvertFrom-Json).version
$tauriVersion = (Get-Content -LiteralPath (Join-Path $repositoryRoot 'src-tauri\tauri.conf.json') -Raw | ConvertFrom-Json).version
$cargoContent = Get-Content -LiteralPath (Join-Path $repositoryRoot 'src-tauri\Cargo.toml') -Raw
$cargoMatch = [regex]::Match($cargoContent, '(?ms)^\[package\].*?^version\s*=\s*"(?<version>[^"]+)"')
$cargoVersion = if ($cargoMatch.Success) { $cargoMatch.Groups['version'].Value } else { $null }

if (-not $cargoVersion) {
    $failures.Add('Não foi possível determinar a versão do pacote em src-tauri/Cargo.toml.')
}

foreach ($versionSource in @(
    [pscustomobject]@{ Name = 'src-tauri/Cargo.toml'; Version = $cargoVersion },
    [pscustomobject]@{ Name = 'src-tauri/tauri.conf.json'; Version = $tauriVersion }
)) {
    if ($versionSource.Version -and $versionSource.Version -ne $packageVersion) {
        $failures.Add("Versão divergente em $($versionSource.Name): $($versionSource.Version) (esperado $packageVersion).")
    }
}

foreach ($readme in @('README.md', 'README.en.md')) {
    $readmeContent = Get-Content -LiteralPath (Join-Path $repositoryRoot $readme) -Raw
    if ($readmeContent -notmatch ([regex]::Escape("/releases/tag/v$packageVersion"))) {
        $failures.Add("$readme não aponta para o release atual v$packageVersion.")
    }
}

$currentReleaseNote = Join-Path $repositoryRoot "docs\releases\v$packageVersion.md"
if (-not (Test-Path -LiteralPath $currentReleaseNote -PathType Leaf)) {
    $failures.Add("Nota da versão atual ausente: docs/releases/v$packageVersion.md")
}

if ($failures.Count -gt 0) {
    Write-Host 'Validação documental reprovada:' -ForegroundColor Red
    foreach ($failure in $failures | Sort-Object -Unique) {
        Write-Host "- $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Output (
    'Documentação aprovada: {0} documentos catalogados, {1} links internos válidos, versão v{2} sincronizada e ADRs catalogados.' -f `
        $cataloguedDocuments.Count, $internalLinkCount, $packageVersion
)
