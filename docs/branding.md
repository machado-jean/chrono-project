# Identidade visual do Chrono Project

## Apresentação no GitHub

O `README.md` usa a marca oficial transparente em `src/assets/chrono-mark.png`
centralizada e reduzida, sem criar uma variante paralela do símbolo. A página
principal é mantida em português do Brasil e aponta para `README.en.md`, que
oferece uma apresentação equivalente em inglês e informa que a interface do
aplicativo ainda é PT-BR.

Badges no README devem representar somente estados verificáveis: última release,
CI da branch `main`, plataforma Windows, operação offline e Tauri. Downloads
devem usar as URLs permanentes de `releases/latest/download`, preservando os
nomes estáveis dos instaladores padrão e offline.

Os topics do repositório descrevem tecnologia e domínio, nunca qualidades não
comprovadas. Não usar `open-source` antes da definição e publicação de uma
licença do projeto.

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

## Identidade da interface

A identidade do Chrono Project não termina no ícone. Tabela, Kanban, Gantt,
menus, diálogos, filtros e estados devem formar um sistema visual próprio e
reconhecível, relacionado a tempo, precisão e mecanismo.

O objetivo é evitar a aparência genérica observada em muitos dashboards e em
aplicações construídas pela repetição de padrões visuais associados a geradores
de interface: cartões arredondados em excesso, grandes vazios, gradientes sem
função, sombras difusas, `pills` para todo conteúdo e a mesma composição de
sidebar, cabeçalho e blocos intercambiáveis entre produtos.

### Princípios

- **Instrumento, não vitrine:** a aplicação deve lembrar uma ferramenta de
  planejamento desktop, não uma landing page ou painel promocional.
- **Densidade intencional:** aproveitar a tela sem comprimir leitura, foco ou
  alvos interativos.
- **Tempo como estrutura:** usar ritmo, escala, divisores, progressão e detalhes
  mecânicos sutis; não espalhar relógios e engrenagens como decoração.
- **Personalidade funcional:** bordas, cores, ícones e movimentos devem ajudar
  a distinguir hierarquia, estado, dependência e impacto temporal.
- **Consistência própria:** uma mesma função deve conservar aparência e
  comportamento em Tabela, Kanban e Gantt.
- **Originalidade sem cópia:** referências podem orientar atmosfera e
  acabamento, nunca reproduzir a composição de outro software ou franquia.

### Processo para uma revisão ampla

1. inventariar componentes, densidades, cores, raios, sombras e inconsistências;
2. definir tokens e duas ou três telas-piloto com dados densos;
3. aprovar a direção antes de expandi-la para toda a aplicação;
4. criar ou adaptar componentes compartilhados, evitando correções isoladas;
5. validar teclado, contraste, redução de movimento, 125%/150% e largura mínima;
6. comparar o resultado sem o logotipo: a interface ainda deve parecer Chrono.

A diferenciação visual nunca deve reduzir produtividade, acessibilidade ou
clareza do cronograma.

### Implementação progressiva

A primeira etapa do sistema visual está concentrada no shell, barra lateral,
menus superiores, cabeçalho, filtros, abas e Tabela. Ela estabelece as cores de
tinta, papel, latão e ciano, tipografia técnica de títulos e uma geometria mais
precisa. Kanban, Gantt e diálogos devem adotar os mesmos tokens em etapas
posteriores, depois da inspeção do piloto com dados densos.

A navegação estrutural segue a lógica de uma aplicação desktop: uma barra de
menu compacta reúne navegação, Arquivo, Editar e Exibir; um trilho estreito troca
Tabela, Kanban e Gantt; e um painel adjacente mantém os projetos. As duas laterais
usam a mesma superfície e hierarquia, sem numeração decorativa, descrições
redundantes ou ícones nos menus textuais do Windows.

Tabela, Kanban e Gantt compartilham o mesmo vocabulário de fundos, bordas, raios,
foco e cores de estado. Diferenças visuais entre elas devem representar a função
da visualização, e não parecer que cada área pertence a um produto diferente.
O cabeçalho da Tabela pertence à composição clara e usa peso, separadores e
contraste de texto para estabelecer hierarquia; faixas escuras ficam reservadas
a contextos em que tenham função real, não como recurso automático de destaque.

### Sistema cromático da aplicação

- neutros frios e firmes estruturam janela, painéis, tabelas e formulários;
- ciano-petróleo identifica ação primária, foco, seleção e navegação;
- dourado identifica a marca e pontos de atenção ligados ao planejamento;
- verde, âmbar e vermelho são reservados a sucesso, risco e erro;
- cores claras de apoio nunca podem ser o único sinal de estado: texto, borda ou
  ícone devem manter a leitura;
- grandes superfícies evitam cores açucaradas ou excessivamente pastéis; cores
  mais saturadas aparecem de forma controlada em ações e estados.

A composição geral usa apenas três níveis recorrentes: moldura da aplicação,
conteúdo e painéis editáveis. Cabeçalho, laterais e fundo das visualizações
compartilham a mesma moldura; branco fica reservado a tabelas, cartões, menus e
diálogos. Não criar uma nova faixa de cor para cada grupo de comandos.

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

