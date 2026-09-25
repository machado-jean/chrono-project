[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^v\d+\.\d+\.\d+$')]
    [string]$Tag,

    [string]$Repository = 'machado-jean/chrono-project',

    [ValidateRange(1, 30)]
    [int]$WaitMinutes = 5
)

$ErrorActionPreference = 'Stop'
$reference = gh api "repos/$Repository/git/ref/tags/$Tag" | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or -not $reference) {
    throw "Não foi possível localizar a tag $Tag."
}

$tagCommit = $reference.object.sha
if ($reference.object.type -eq 'tag') {
    $annotatedTag = gh api "repos/$Repository/git/tags/$tagCommit" | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or -not $annotatedTag) {
        throw "Não foi possível resolver a tag anotada $Tag."
    }
    $tagCommit = $annotatedTag.object.sha
}

$deadline = (Get-Date).AddMinutes($WaitMinutes)
$run = $null
do {
    $json = gh run list --repo $Repository --workflow CI --branch main --commit $tagCommit --limit 1 `
        --json databaseId,status,conclusion,headBranch,headSha,url
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível consultar o GitHub Actions.' }
    $run = @($json | ConvertFrom-Json) | Select-Object -First 1
    if (-not $run) { Start-Sleep -Seconds 5 }
} while (-not $run -and (Get-Date) -lt $deadline)

if (-not $run) {
    throw "Nenhum CI de main foi encontrado para o commit $tagCommit apontado por $Tag."
}
if ($run.headSha -ne $tagCommit) {
    throw "O CI encontrado pertence a $($run.headSha), mas a tag aponta para $tagCommit."
}

Write-Host "CI de main reutilizado: $($run.url)"
if ($run.status -ne 'completed') {
    gh run watch $run.databaseId --repo $Repository --exit-status
    if ($LASTEXITCODE -ne 0) {
        throw "O CI de main falhou. Use: gh run view $($run.databaseId) --repo $Repository --log-failed"
    }
} elseif ($run.conclusion -ne 'success') {
    throw "O CI de main terminou como '$($run.conclusion)'."
}

$tagRunsJson = gh run list --repo $Repository --workflow CI --branch $Tag --limit 1 `
    --json databaseId,status,conclusion
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível verificar execuções redundantes da tag.' }
if (@($tagRunsJson | ConvertFrom-Json).Count -gt 0) {
    throw "O workflow CI foi disparado indevidamente pela tag $Tag."
}

Write-Host "Tag $Tag validada no commit $tagCommit, já aprovado pelo CI de main; nenhum CI duplicado foi criado." -ForegroundColor Green
