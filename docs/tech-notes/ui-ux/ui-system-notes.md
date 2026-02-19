# UI/UX System & Design Guidelines — Fonte de Verdade

Este documento estabelece os padrões visuais, decisões de UX e diretrizes técnicas obrigatórias para o desenvolvimento de interfaces. Ele serve como referência única para agentes e desenvolvedores.

---

## 🎯 1. Filosofia e Princípios

- **Simplicidade e Clareza:** A interface deve ser moderna, reduzindo a fricção e evitando complexidade desnecessária.
- **Hierarquia sobre Decoração:** Espaçamento e tipografia são mais importantes que efeitos visuais. UI bonita **não é opcional**, mas a clareza vem primeiro.
- **Consistência e Usabilidade:** \* Conflito entre criatividade e consistência? → **Vence a consistência.**
  - Conflito entre estética e usabilidade? → **Vence a usabilidade.**
- **Intencionalidade:** Menos elementos, mais intenção. Componentes devem comunicar estado e fluxo, não apenas layout.

---

## 📐 2. Layout e Hierarquia Visual

### Estrutura Padrão (SaaS)

- **Header:** Fixo ou _sticky_, com título claro da página.
- **Navegação:** Sidebar para sistemas complexos; Menu superior para fluxos simples.
- **Conteúdo:** Área centralizada com `max-width` definido.
- **Agrupamento:** Uso de Cards para separação lógica de contextos.
- **Ações:** Botões e gatilhos bem posicionados e com pesos visuais distintos.

### O que evitar:

- Telas “chapadas” sem profundidade ou hierarquia.
- Muitos botões com o mesmo peso visual (ex: três botões primários lado a lado).
- Alinhamentos inconsistentes.

---

## 🎨 3. Design Tokens (Base)

### Espaçamento (Escala de 4px/8px)

- **xs:** 4px | **sm:** 8px | **md:** 16px | **lg:** 24px | **xl:** 32px | **2xl:** 48px
- _Regra:_ Usar espaçamento para separar contextos, não apenas linhas.

### Tipografia

- **Títulos:** Peso 600 ou 700.
- **Corpo:** Peso 400.
- **Hierarquia:** Título > Subtítulo > Corpo > Hint (legenda).
- **Labels:** Discretos e menores, sempre associados aos inputs.

### Bordas e Sombras

- **Border Radius:** Padrão de **8px**; para cards principais, **12px**.
- **Sombras:** `shadow-sm` para inputs; `shadow-md` para cards. Evitar sombras pesadas ou "sujas".

### Cores

- **Uso funcional:** Cores devem transmitir significado (Sucesso, Erro, Aviso, Informativo).
- **Acessibilidade:** Atenção especial ao contraste (a11y).

---

## 🧩 4. Componentização e Estados

### Regras de Componentes

- **Responsabilidade Única:** Um componente = uma função.
- **Props:** Devem ser explícitas.
- **Lógica:** Evitar lógica de negócio pesada dentro de componentes puramente visuais.

### Estados Obrigatórios (Toda tela/componente deve prever):

1.  **Loading:** Skeleton screens ou spinners discretos.
2.  **Empty State:** Mensagem clara + chamada para ação (CTA).
3.  **Error State:** Mensagem explicativa + opção de tentar novamente (retry).
4.  **Success Feedback:** Toasts ou alertas contextuais.

---

## ♿ 5. Acessibilidade (a11y)

- **Foco Visível:** Essencial para navegação por teclado.
- **Navegação:** Deve ser funcional via teclado (Tab/Enter).
- **Semântica:** Labels associados a inputs e botões com textos claros.
- **Independência de Cor:** Não usar apenas cores para transmitir estados críticos.

---

## 🛠 6. Stack e Organização Técnica

### Tecnologias Preferenciais

- **CSS:** Tailwind CSS (preferencial). Bootstrap é aceitável em projetos legados.
- **Bibliotecas:** Headless UI são encorajadas para garantir acessibilidade.

### Estrutura de Pastas Sugerida

```text
components/
  ui/        (botões, inputs, cards genéricos)
  layout/    (grid, sections, navbar)
  feedback/  (modais, alerts, skeletons)
features/
  <dominio>/ (componentes de regra de negócio)
```

---

## 👩‍🎨 7. Governança

O agente Isis (UI/UX Frontend) é a autoridade máxima para:

- Desenho de layouts e definição de novos componentes.
- Proposição de evolução do Design System.
- Entrega de blueprints e implementação de referência.
- Nota: Todos os outros agentes devem submeter suas propostas de UI às diretrizes da Isis.
