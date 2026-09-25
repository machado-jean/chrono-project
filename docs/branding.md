# Identidade visual do Chrono Project

## Símbolo oficial

O símbolo do Chrono Project é um relógio mecânico aberto em forma de `C`. A
construção reúne cronologia, precisão e planejamento sem reproduzir a identidade
de outro produto.

Elementos permanentes:

- aro circular aberto à direita, formando a letra `C`;
- mecanismo aparente com engrenagens, pontes, balanço e rubis;
- dois ponteiros esqueletizados, com hierarquia clara de comprimento;
- mostrador azul-marinho com marcadores dourados a cada cinco minutos e quatro
  pautas brancas intermediárias;
- arco ciano discreto para representar progresso;
- três extensões ornamentais externas, somente em 12, 9 e 6 horas;
- filigranas douradas inspiradas em relojoaria manual;
- fundo transparente.

O símbolo não usa texto, numerais romanos, espada, ponto externo à direita ou
elementos pertencentes à identidade de Chrono Trigger. A referência afetiva ao
tema de tempo foi convertida em uma composição própria para o produto.

## Hierarquia visual

A ordem de profundidade, do fundo para a frente, é:

1. esmalte azul-marinho do mostrador;
2. pautas brancas e marcadores dourados;
3. aros estruturais;
4. filigranas e pontes mecânicas;
5. rubis e ponteiros.

Quando esses elementos se cruzam, a oclusão deve respeitar essa ordem. Os
marcadores não devem parecer aplicados sobre filigranas ou peças mecânicas.

## Uso na interface

- A barra nativa da janela contém o nome **Chrono Project**.
- A barra lateral não repete o nome. Ela mostra o símbolo e o contexto
  **Planejamento local**.
- No estado recolhido, o símbolo funciona como botão **Mostrar projetos**.
- O estado vazio utiliza o mesmo símbolo sem substituir textos acessíveis.
- Imagens decorativas usam `alt=""`; nome e função permanecem expostos pelos
  controles e landmarks da interface.

O antigo marcador provisório `PF`, herdado do nome ProjectFlow, foi removido.

## Arquivos oficiais

| Uso | Arquivo |
| --- | --- |
| fonte raster transparente | `src/assets/chrono-mark.png` |
| ícone mestre Tauri | `src-tauri/icons/icon.png` |
| executável Windows | `src-tauri/icons/icon.ico` |
| bundle Apple mantido pelo Tauri | `src-tauri/icons/icon.icns` |
| tamanhos comuns | `src-tauri/icons/32x32.png`, `128x128.png`, `128x128@2x.png` |
| tiles Windows | `src-tauri/icons/StoreLogo.png` e `Square*Logo.png` |

Os derivados são gerados pelo Tauri CLI a partir da fonte aprovada. Não editar
os tamanhos individualmente, pois isso cria divergência entre instalador,
executável e interface.

## Critérios de qualidade

- preservar transparência e margem óptica;
- manter o contorno do `C` reconhecível em 32 px;
- manter contraste suficiente em fundos claros e escuros;
- não adicionar texto dentro do arquivo de imagem;
- não alterar a contagem ou o ângulo radial das pautas;
- conferir 16, 24, 32, 48, 128 e 256 px antes da publicação;
- conferir barra de título, barra de tarefas, menu Iniciar, atalho, lista de
  aplicativos, instalador e desinstalador no Windows.

## Regeneração

Na raiz do repositório:

```powershell
npm run tauri -- icon src\assets\chrono-mark.png --output src-tauri\icons
```

O comando também pode criar alvos móveis que não pertencem à V1 Windows. Eles
não devem ser adicionados ao repositório enquanto essas plataformas estiverem
fora do escopo.

