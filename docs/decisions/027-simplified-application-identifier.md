# ADR 027 — Identificador simplificado do aplicativo

## Status

Aceito para o próximo release após a versão 0.2.2.

## Contexto

Até a versão 0.2.2, o Tauri usava o identificador
`io.github.machadojean.chronoproject`. No Windows, esse valor também aparecia
nos diretórios de configuração, dados do WebView e logs. A identidade é válida,
mas expõe ao usuário um nome técnico desnecessariamente longo.

O identificador participa da identidade do pacote. Portanto, alterá-lo não é
somente renomear uma pasta: o Windows e o instalador podem reconhecer a próxima
versão como uma aplicação diferente da instalação anterior.

## Decisão

Usar `chronoproject` como identificador Tauri. Os dados de produção passam a ser
resolvidos pelo Tauri em:

```text
%APPDATA%\chronoproject\chronoproject.sqlite
```

Builds de desenvolvimento continuam usando
`.local/data/chronoproject.sqlite`, e E2E continua usando bases descartáveis e
isoladas em `.local/e2e`.

Não haverá migração silenciosa entre os identificadores. Antes da atualização,
o usuário deve criar um backup ou exportar o workspace pela versão anterior e
restaurar os dados depois de instalar a nova versão. Se a instalação anterior
continuar listada separadamente no Windows, ela deve ser desinstalada após o
backup.

## Consequências

- o diretório visível ao usuário fica curto e alinhado ao nome do produto;
- uma instalação nova não acessa nem sobrescreve a base do identificador antigo;
- os dois perfis podem coexistir até que o usuário conclua a restauração e a
  limpeza manual;
- o checklist de release deve testar instalação e atualização como mudança de
  identidade, além dos fluxos normais de banco e updater;
- artefatos publicados até a versão 0.2.2 permanecem inalterados.
