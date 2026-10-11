# Política de segurança / Security policy

## Versões suportadas

Correções de segurança são destinadas à versão estável mais recente disponível
em [Releases](https://github.com/machado-jean/chrono-project/releases/latest).
Versões anteriores podem não receber correções retroativas.

| Versão | Suporte |
| --- | --- |
| Release estável mais recente | Sim |
| Versões anteriores | Não garantido |
| Builds de desenvolvimento | Somente para reprodução |

## Relatar uma vulnerabilidade

Não abra uma Issue pública para vulnerabilidades, corrupção ou exposição de
dados. Use o recurso **Report a vulnerability** na aba Security do repositório:

<https://github.com/machado-jean/chrono-project/security/advisories/new>

Inclua, quando possível:

- versão do Chrono Project e do Windows;
- impacto e cenário de ameaça;
- passos mínimos para reprodução;
- indicação se importação, backup, SQLite, updater ou instalador está envolvido;
- evidências sanitizadas.

Não envie bancos, backups ou pacotes `.chronoproject` com dados reais. Crie uma
reprodução mínima artificial e remova nomes, caminhos pessoais, endereços,
credenciais e chaves.

O recebimento será confirmado assim que possível. A validação, severidade,
correção e divulgação coordenada dependerão da complexidade e do impacto. Não
publique detalhes antes de uma correção ou orientação acordada.

## Escopo relevante

São especialmente importantes relatos sobre:

- leitura ou escrita fora dos diretórios esperados;
- path traversal ou pacotes de importação malformados;
- corrupção ou perda silenciosa do SQLite;
- bypass de assinatura ou atualização indevida;
- vazamento não solicitado de dados locais;
- execução de conteúdo importado;
- permissões nativas excessivas.

## English

Security fixes target the latest stable release. Do not open a public Issue for
a vulnerability or potential data exposure. Use GitHub's private
[Report a vulnerability](https://github.com/machado-jean/chrono-project/security/advisories/new)
flow and provide a minimal sanitized reproduction. Never attach real databases,
backups, credentials, personal paths, or customer information.

