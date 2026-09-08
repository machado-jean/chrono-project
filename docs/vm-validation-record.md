# Registro de aceite Windows 11

Estado em 08/09/2026: pendente. A conta de execução não conseguiu listar VMs
Hyper-V por falta de permissão do Windows. Preencher com evidências reais.

## Prioridade definida pelo usuário: atualização pelo aplicativo

O objetivo principal da VM é comprovar a atualização instalada. A última
release pública consultada em 08/09/2026 é `v0.1.4`. Usar `v0.1.3` como origem,
pois já inclui o updater assinado; `v0.1.4` instalada não deve oferecer a mesma
versão como atualização.

1. Instalar `v0.1.3` e criar projeto, subtarefa, dependência FS e um calendário
   com exceção. Registrar títulos, datas e progresso e exportar um backup.
2. Em **Ajuda > Verificar atualizações**, confirmar oferta da `0.1.4`.
3. Selecionar **Baixar e instalar atualização** e observar download, fechamento,
   instalação passiva e reinício, sem desinstalação manual.
4. Confirmar versão `0.1.4`, mesmos dados, dependências e calendário.
5. Editar uma tarefa, fechar, reabrir e conferir persistência.
6. Consultar novamente: deve informar versão atual, sem reinstalar.
7. Desconectar a rede, abrir e editar normalmente; uma consulta manual de
   atualização deve falhar de maneira informativa, preservando os dados.

## Verificações locais de 08/09/2026

- Manifesto público `latest.json` informa `0.1.4`, Windows x64 e URL do pacote
  padrão. A assinatura no manifesto corresponde ao `.sig` publicado.
- Testes da interface simulam consulta, instalação/reinício, download
  interrompido e assinatura inválida; estes últimos não devem reiniciar.
  Isso não equivale a verificar criptograficamente o instalador real.
- E2E desktop: cinco aberturas, recuperação após interrupção e jornada completa
  com importação e persistência aprovadas. Não instala atualizações.

Os demais cenários abaixo continuam critérios da distribuição, mas não precisam
anteceder o teste prioritário de atualização.

Registrar: versão do Windows, WebView2, versão/hash dos dois instaladores,
versão anterior usada no upgrade, escala de tela e data da execução.

| Cenário | Resultado | Evidência |
| --- | --- | --- |
| Instalação padrão sem toolchain | Pendente | |
| Instalação offline com rede desabilitada | Pendente | |
| Abertura sem internet e persistência após reiniciar | Pendente | |
| Backup, exportação e importação em workspace vazio | Pendente | |
| Updater de versão anterior preserva projetos/tarefas | Pendente | |
| Reparo da mesma versão preserva dados | Pendente | |
| Desinstalação e reinstalação: registrar destino dos dados | Pendente | |
| Teclado, Esc, foco e Narrador | Pendente | |
| Escala 125% e 150%, largura mínima | Pendente | |
| E2E desktop cinco aberturas e jornada completa | Pendente | |
| Duas execuções do workflow desktop diagnóstico | Pendente | |

Usar apenas dados sintéticos na VM. Os detalhes dos procedimentos estão em
[installation-windows.md](installation-windows.md),
[ux-accessibility.md](ux-accessibility.md) e
[webview2-testing.md](webview2-testing.md).
