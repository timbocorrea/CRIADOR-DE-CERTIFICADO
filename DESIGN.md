---
name: CertificaMaster
description: Gerador de Certificados Corporativos e Acadêmicos Duplex
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-deep: "#1e40af"
  secondary: "#f1f5f9"
  secondary-hover: "#e2e8f0"
  accent-gold: "#d97706"
  accent-gold-light: "#f59e0b"
  neutral-dark: "#0f172a"
  neutral-text: "#334155"
  neutral-muted: "#64748b"
  neutral-border: "#e2e8f0"
  neutral-surface: "#ffffff"
  neutral-bg: "#f8fafc"
  status-danger: "#dc2626"
  status-success: "#059669"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  script:
    fontFamily: "Alex Brush, cursive"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.05em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-container:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: CertificaMaster

## Overview

**Creative North Star: "The Solemn Academic Guilloche"**

O CertificaMaster combina a solenidade cerimonial da tradição acadêmica clássica com a precisão minimalista de ferramentas administrativas de alta densidade técnica. A interface operacional equilibra a sobriedade institucional exigida na emissão de documentos oficiais com uma ergonomia de trabalho moderna, dividida em quatro áreas de foco claras.

A superfície do aplicativo opera no modo **Operate**: clareza visual absoluta, alta densidade informacional sem poluição visual, previsibilidade de navegação e controles táteis imediatos. O documento emitido (o Certificado), por sua vez, transita para o modo **Experience**: proporções clássicas A4 paisagem, molduras concêntricas, tipografia de autoridade secular e equilíbrio hierárquico entre assinaturas, selos dourados e corpo de texto.

**Key Characteristics:**
- **Duas Camadas Visuais Coerentes:** Interface do operador utilitária e focada (Slate & Indigo) vs. Canvas do certificado nobre e atemporal (Playfair Display & Ouro).
- **Sobriedade Funcional:** Acentos de cor reservados estritamente para ações primárias, estados ativos e confirmações de integridade.
- **Micro-ritmo Consistente:** Grade espacial modular de 4px/8px em formulários, cards retráteis e modais de diálogo.
- **Acessibilidade Universal:** Contraste elevado de texto (WCAG 2.2 AA) e foco visível demarcado em 100% dos controles.

## Colors

A paleta divide-se entre a camada de aplicação de produtividade (Cool Corporate) e os elementos de chancelaria do certificado oficial (Academic Gold).

### Primary
- **Corporate Blue** (`#2563eb` / hover `#1d4ed8`): Utilizado como a cor de ação principal da interface, acionando fluxos de salvamento, importação e exportação de PDF.
- **Deep Navy** (`#1e40af`): Usado para estados ativos em botões de comando e cabeçalhos de alta ênfase.

### Secondary
- **Slate Accent** (`#f1f5f9` / hover `#e2e8f0`): Superfície de apoio para botões secundários, abas inativas e divisórias funcionais.

### Tertiary
- **Academic Gold** (`#d97706` / light `#f59e0b`): Reservado para insígnias, selos de certificação, bordas nobres do certificado e medalhas de aproveitamento de alunos.

### Neutral
- **Deep Slate Dark** (`#0f172a`): Títulos de seções, textos em ênfase máxima e cabeçalhos de diálogo.
- **Slate Body** (`#334155`): Texto corrente de leitura e legendas de formulários.
- **Muted Slate** (`#64748b`): Placeholders, ícones de apoio e rótulos secundários.
- **Border Slate** (`#e2e8f0`): Bordas de campos de entrada, limites de cards e separadores de linha.
- **Canvas White** (`#ffffff`): Fundo de cards, modais e do documento de certificação.
- **Background Slate** (`#f8fafc`): Fundo geral da aplicação e áreas de trabalho de edição.

### Named Rules
**The Rarity of Gold Rule.** O tom dourado (`#d97706`) é restrito a elementos de chancelaria e selos oficiais no documento emitido. Jamais deve ser utilizado como cor de fundo de botões genéricos de sistema.
**The High-Contrast Slate Rule.** Textos sobre superfícies brancas ou cinzas utilizam invariavelmente Slate 800 (`#1e293b`) ou Slate 900 (`#0f172a`), garantindo contraste mínimo de 7:1 contra o fundo.

## Typography

**Display Font:** Playfair Display (Serif nobre de tradição editorial).  
**Script Font:** Alex Brush (Caligráfica fluida para simulação de assinaturas autênticas).  
**Body/UI Font:** Inter (Sans-serif geométrica para interface, formulários e tabelas acadêmicas).  

**Character:** Contraste dinâmico entre a tradição clássica humanista nas honrarias e a clareza técnica contemporânea na gestão de dados.

### Hierarchy
- **Display Hero** (Playfair Display, Bold 700, 2.25rem / 36px, line-height 1.2): Título principal do certificado ("CERTIFICADO DE CONCLUSÃO").
- **Script Signature** (Alex Brush, Regular 400, 1.75rem / 28px, line-height 1.1): Assinatura caligráfica dos diretores e coordenadores pedagógicos.
- **Section Headline** (Inter, Semi-Bold 600, 1.25rem / 20px, line-height 1.3): Títulos das 4 áreas funcionais e cabeçalhos de modais.
- **Card Title** (Inter, Medium 500, 0.875rem / 14px, line-height 1.4): Título de blocos de formulário e cards retráteis.
- **Body UI** (Inter, Regular 400, 0.875rem / 14px, line-height 1.5): Textos de campos, dados da ementa e tabelas de notas.
- **Label / Helper** (Inter, Medium 500, 0.75rem / 12px, letter-spacing 0.01em): Rótulos de campos de input, badges de status e rodapés de registro.

### Named Rules
**The Document Sans Prohibition Rule.** Nenhum certificado final emitido pode utilizar fontes Sans-serif nos títulos solenes ou nas assinaturas protocolares. O título principal é imperativamente Serifado e as assinaturas são caligráficas.

## Layout

- **Modelo Espacial do Workspace:** Divisão balanceada entre Painel de Edição (lado esquerdo em desktop / abas móveis em viewport compacto) e Área de Visualização Viva (lado direito com escala adaptativa do documento A4).
- **Grade Modular:** Múltiplos de 4px e 8px:
  - Margens internas de cards: 16px (`p-4`) ou 20px (`p-5`).
  - Gaps entre campos de formulário: 12px (`gap-3`) a 16px (`gap-4`).
  - Espaçamento de blocos de seção: 24px (`space-y-6`).
- **Proporção do Certificado:** A4 Paisagem rigorosa de proporção `1.414:1` (297 mm x 210 mm), renderizada em canvas fora da tela com 2246 x 1588 pixels em escala 2 para exportação impressa.

## Elevation & Depth

O CertificaMaster adota uma filosofia predominantemente plana com camadas tonais sutis (*Tonal Surface Layering*). Bordas sólidas e contrastes suaves delimitam superfícies sem ruído visual.

### Shadow Vocabulary
- **Card Rest** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`): Elevação sutil padrão para cards de dados e formulários agrupados.
- **Modal Dialog** (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`): Elevação acentuada para modais de persistência, opções de exportação e prévia final.
- **Document Drop Shadow** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`): Destaca a folha A4 flutuante contra a mesa de trabalho cinza do editor.

### Named Rules
**The Flat Form Rule.** Campos de input e botões secundários descansam sem sombras; ganham borda destacada e anel de foco visível (`ring-2 ring-blue-100`) apenas quando focados ou ativos.

## Shapes

- **Contornos e Arredondamentos:**
  - Botões de Ação e Inputs: `rounded-lg` (8px de raio) para tato confortável e moderno.
  - Cards e Painéis: `rounded-xl` (12px de raio) para diferenciação das regiões estruturais.
  - Modais de Diálogo: `rounded-2xl` (16px de raio) conferindo maciez e foco ao centro de atenção.
  - Badges e Pílulas: `rounded-full` (9999px) para indicadores de contagem e status de exportação.
- **Geometria do Certificado:** Bordas duplas concêntricas retangulares (borda externa sólida de 2px e interna de 1px com espaçamento de 6px), evocando a gravura clássica de diplomas oficiais.

## Components

### Buttons
- **Shape:** Cantos arredondados (8px / `rounded-lg`).
- **Primary:** Fundo azul vibrante (`#2563eb`), texto branco (`#ffffff`), padding `8px 16px` (médio) ou `10px 20px` (grande), foco visível com anel duplo (`ring-2 ring-blue-600 ring-offset-2`).
- **Secondary:** Fundo cinza claro (`#f1f5f9`), texto Slate 700 (`#334155`), borda fina (`#e2e8f0`).
- **Danger:** Fundo vermelho escuro (`#dc2626`), texto branco, para ações destrutivas (excluir aluno ou disciplina).

### Cards / Containers
- **Corner Style:** 12px de raio (`rounded-xl`).
- **Background:** Branco puro (`#ffffff`), borda perimetral em Slate 200 (`#e2e8f0`).
- **Header:** Cabeçalho com fundo sutil Slate 50 (`#f8fafc`), título em negrito e suporte a colapso retrátil via teclado.

### Inputs / Fields
- **Style:** Borda Slate 200 (`#e2e8f0`), fundo branco, texto Slate 800, padding vertical de 8px e horizontal de 12px.
- **Focus:** Borda primária azul (`#2563eb`) e anel de foco azul claro (`ring-2 ring-blue-100`).
- **Error:** Borda vermelha (`#ef4444`) com mensagem em texto vermelho e ícone de alerta acessível.

### Navigation (4 Áreas Funcionais)
- **Tabs:** Barra horizontal superior e lateral contendo ícones descritivos e contadores de itens.
- **Estado Ativo:** Fundo azul primário com texto branco ou sublinhado sólido com alto contraste.

### Certificate Canvas (Signature Component)
- **Face Anverso (Frente):** Moldura geométrica institucional, logotipo vetorizado no topo, título solene em Playfair Display, parágrafo de outorga dinâmico, campos de data e carga horária, e assinaturas caligráficas com linhas guias.
- **Face Reverso (Verso):** Tabela completa de disciplinas (código, matéria, professor, carga horária e aproveitamento), bloco de registro oficial de cartório escolar (`Livro`, `Folha`, `Registro`, `Data`) e carimbo de autenticidade documental.

## Do's and Don'ts

### Do:
- **Do** preservar a paridade duplex estrita em todas as telas de pré-visualização e geração de PDF (página ímpar = frente, página par = verso).
- **Do** validar algorítmicamente todos os CPFs importados via CSV antes de renderizar as páginas de certificados.
- **Do** manter a tipografia Playfair Display e Alex Brush no canvas do certificado e a fonte Inter na interface de gerenciamento.
- **Do** garantir anéis de foco visíveis (`focus-visible:ring-2`) em todos os elementos interativos para cumprimento integral do padrão WCAG 2.2 AA.

### Don't:
- **Don't** alterar as proporções ou margens do certificado para formatos diferentes de A4 Paisagem sem autorização expressa.
- **Don't** introduzir sombras pesadas ou gradientes agressivos na interface de gerenciamento do operador.
- **Don't** injetar scripts ou atributos de evento inline em SVGs enviados pelo usuário.
- **Don't** permitir que botões de ação destrutiva (como limpar dados) sejam acionados sem modal de confirmação.

