# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Público Primário:** Secretarias acadêmicas, coordenadores pedagógicos, instrutores de centros de treinamento, cursos livres/profissionalizantes e departamentos de RH/T&D corporativos.
- **Situação Operacional:** Necessidade de emitir, validar e exportar lotes de certificados profissionais com anverso e verso oficial (duplex) para centenas de concluintes, sem depender de ferramentas de design gráfico manual (como Canva ou Photoshop) ou processos lentos e sujeitos a erros manuais.

## Product Purpose

- **Objetivo do Produto:** Prover uma plataforma web robusta, rápida e acessível para geração, pré-visualização e exportação de certificados oficiais em lote, garantindo alta fidelidade visual, conformidade com padrões de registro acadêmico e emissão de PDFs vetorizados em alta resolução (A4 Paisagem Duplex).
- **Critério de Sucesso:** Emissão de lotes de certificados com zero distorção visual, dados 100% íntegros (CPF, notas e carga horária validados), paginação duplex estrita (frente e verso emparelhados) e privacidade absoluta dos dados dos alunos.

## Positioning

- **Diferencial Exclusivo:** Diferente de editores gráficos genéricos ou ferramentas baseadas em nuvem fechada, o CertificaMaster oferece um **motor duplex nativo integrado**, arquitetura **offline-first** com persistência local e criptografia com senha (AES-GCM), sanitização estrita de vetores SVG e renderização de PDF vetorial de alta definição diretamente no navegador do cliente, sem expor dados privados a servidores de terceiros.

## Operating Context

- **Fluxo de Trabalho em 4 Áreas Funcionais:**
  1. *Curso & Emissor:* Definição do título do curso, carga horária total, datas de início/conclusão, local, logotipo institucional e assinaturas de instrutores/responsáveis.
  2. *Ementa Curricular:* Gestão das disciplinas do verso, conteúdo programático, instrutor de cada matéria, carga horária e aproveitamento/frequência acadêmica.
  3. *Participantes:* Cadastro manual e importação massiva via planilha CSV com validação algorítmica de CPF (módulo 11) e normalização de nomes.
  4. *Design & Visualização:* Alternância instantânea de faces (Frente e Verso), proporção A4 Paisagem, controle de margens, paleta institucional e modo de pré-visualização final.
- **Ambiente de Uso:** Navegadores desktop modernos (Chrome, Edge, Firefox, Safari) em escritórios administrativos, secretarias de cursos e instituições de ensino. Suporte responsivo para consulta e edição rápida em tablets e smartphones.

## Capabilities and Constraints

- **Capacidades Confirmadas:**
  - Importação de listas de alunos via CSV com parser tolerante a delimitadores.
  - Validação algorítmica rigorosa de CPF (rejeição de sequências inválidas e cálculo de dígitos verificadores).
  - Sanitização de arquivos vetoriais SVG impedindo scripts maliciosos e injeções inline.
  - Alternância de visualização em tempo real entre anverso (Frente) e reverso (Verso).
  - Persistência de projeto completa com exportação e importação em arquivo JSON protegido por criptografia de nível bancário (AES-GCM com PBKDF2).
  - Exportação em lote para PDF consolidado com cancelamento seguro via `AbortController` e barra de progresso em tempo real.
- **Restrições Técnicas:**
  - Formato normatizado: A4 Paisagem (297 x 210 mm).
  - Renderização gráfica em escala 2 (2246 x 1588 pixels por página) para qualidade de impressão gráfica.
  - Zero dependência externa obrigatória no cliente para emissão do lote.

## Brand Commitments

- **Nome Oficial:** CertificaMaster — Gerador de Certificados.
- **Identidade Visual:** Paleta corporativa e acadêmica sóbria:
  - Primário / Fundo Escuro: Slate 900 (`#0F172A`) e Navy (`#1E293B`).
  - Destaque e Ações: Indigo 600 (`#4F46E5`) e Blue 600 (`#2563EB`).
  - Distinção Institucional / Certificação: Dourado / Amber (`#D97706` / `#F59E0B`).
  - Superfícies: Branco puro (`#FFFFFF`) e Cinza neutro Slate 50/100 para leitura confortável.
- **Tipografia:**
  - Títulos Solenes e Cabeçalhos de Destaque: *Playfair Display* (Serif clássica).
  - Assinaturas Cursivas Institucionais: *Alex Brush* (Calligraphic Script).
  - Corpo de Texto, Formulários, Tabelas e Dados Acadêmicos: *Inter* (Sans-serif moderna de alta legibilidade).

## Evidence on Hand

- Componente oficial de certificado homologado e congelado: `src/components/CertificatePreview.tsx` (SHA-256 `76B460...`).
- Suíte de 110 testes automatizados aprovados cobrindo todas as funcionalidades essenciais.
- Amostras de PDF duplex geradas e validadas em disco com até 100 páginas (16.12 MB) sem perdas de qualidade.

## Product Principles

1. **Fidelidade Visual Inegociável:** O certificado exportado em PDF deve ser rigorosamente idêntico à pré-visualização em tela, pixel por pixel.
2. **Privacidade e Soberania dos Dados:** Dados pessoais de alunos (nomes, CPFs, notas) pertencem à instituição e nunca devem ser transmitidos sem consentimento explícito.
3. **Robustez Operacional:** Operações em lote (10, 50 ou 100 certificados) devem ser estáveis, com feedback visual contínuo e cancelamento gracioso sem travamento de navegador.
4. **Ergonomia e Simplicidade:** Dividir a complexidade em áreas funcionais claras para que qualquer operador execute a tarefa de ponta a ponta em minutos.

## Accessibility & Inclusion

- Conformidade com as diretrizes **WCAG 2.2 Nível AA**:
  - Navegação e ativação completa por teclado (`Tab`, `Enter`, `Space`, `Escape`).
  - Regiões dinâmicas anunciadas por leitores de tela (`aria-live="polite"` na barra de progresso).
  - Contraste de cor mínimo de 4.5:1 para texto normal e 3:1 para elementos de interface.
  - Foco visual claramente destacado em todos os controles interativos (`focus-visible:ring-2`).

