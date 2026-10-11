# Registro de aceite Windows 11

Estado em 11/10/2026: validação em máquina limpa ou VM ainda pendente. A conta
de execução não conseguiu listar VMs Hyper-V por falta de permissão do Windows;
nenhum resultado de VM deve ser inferido dos testes feitos no host principal.

O usuário confirmou historicamente a atualização bem-sucedida para `v0.1.4`,
identificada em Ajuda. Desde então, a versão estável publicada avançou para
`v0.2.7`; o teste prioritário atual deve usar artefatos imutáveis dessa release.

## Prioridade atual: atualização pelo aplicativo

O objetivo principal da VM é comprovar uma atualização instalada preservando
dados reais de teste. Usar `v0.2.6` como origem e `v0.2.7` como destino, pois as
duas releases são públicas e a origem já contém o fluxo de atualização assinado.

1. Instalar `v0.2.6` e criar projeto, subtarefa, dependência FS e um calendário
   com exceção. Registrar títulos, datas e progresso e exportar um backup.
2. Em **Ajuda > Verificar atualizações**, confirmar oferta da `0.2.7`.
3. Selecionar **Baixar e instalar atualização** e observar download, fechamento,
   instalação passiva e reinício, sem desinstalação manual.
4. Confirmar versão `0.2.7`, mesmos dados, dependências e calendário.
5. Editar uma tarefa, fechar, reabrir e conferir persistência.
6. Consultar novamente: deve informar versão atual, sem reinstalar.
7. Desconectar a rede, abrir e editar normalmente; uma consulta manual de
   atualização deve falhar de maneira informativa, preservando os dados.

## Evidência histórica de 08/09/2026

- Naquela data, o manifesto público `latest.json` informava `0.1.4`, Windows x64 e URL do pacote
  padrão. A assinatura no manifesto corresponde ao `.sig` publicado.
- Testes da interface simulam consulta, instalação/reinício, download
  interrompido e assinatura inválida; estes últimos não devem reiniciar.
  Isso não equivale a verificar criptograficamente o instalador real.
- E2E desktop: cinco aberturas, recuperação após interrupção e jornada completa
  com importação e persistência aprovadas. Não instala atualizações.

Essas evidências históricas não substituem a validação atual de `v0.2.6` para
`v0.2.7`. Os demais cenários abaixo continuam critérios da distribuição.

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
| Teclado, Esc, foco e Narrador | Parcial | Estrutura AX e Esc aprovados; síntese do Narrador pendente |
| Escala 125% e 150%, largura mínima | Parcial | Emulação WebView2 aprovada; escala real do Windows pendente |
| E2E desktop cinco aberturas e jornada completa | Pendente | |
| Duas execuções do workflow desktop diagnóstico | Pendente | |

Usar apenas dados sintéticos na VM. Os detalhes dos procedimentos estão em
[installation-windows.md](installation-windows.md),
[ux-accessibility.md](ux-accessibility.md) e
[webview2-testing.md](webview2-testing.md).
