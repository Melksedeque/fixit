# WordPress (Plugins) — Version Notes (Fonte de Verdade)

Este documento define padrões para desenvolvimento de plugins com foco em segurança, compatibilidade e publicação.

---

## Regra de ouro

- Confirmar versões (WP, PHP, WooCommerce se houver).
- Priorizar Plugin Developer Handbook e docs oficiais.
- Evitar “atalhos” que quebram compatibilidade.

Fontes oficiais:

- [Plugin Developer Handbook](https://developer.wordpress.org/plugins/)
- [WordPress Codex](https://codex.wordpress.org/)
- [WordPress Docs](https://wordpress.org/documentation/)

---

## Segurança (não negociável)

- Capabilities: `current_user_can()` antes de ações sensíveis.
- Nonces: em forms/actions/requests.
- Sanitização na entrada e escaping na saída:
  - sanitize\_\* no input
  - esc\_\* no output
- Nunca confiar em dados do request.

---

## Performance (checklist rápido)

- Não rodar lógica pesada em hooks globais sem necessidade.
- Evitar queries repetidas.
- Cache quando fizer sentido (transients/objetos).
- Carregar assets (CSS/JS) apenas nas páginas necessárias.

---

## Estrutura recomendada (plugins)

- Bootstrap pequeno (arquivo principal)
- Código em pastas: `includes/`, `admin/`, `public/`
- Separar:
  - registro de hooks
  - lógica de negócio
  - UI/admin

---

## Padrões de qualidade

- Seguir WordPress Coding Standards (WPCS).
- i18n: strings com domínio de texto do plugin.
- Compatibilidade: evitar recursos PHP fora da versão mínima suportada.

---

## WooCommerce (se aplicável)

- Estender via hooks e APIs oficiais.
- Evitar sobrescrever templates sem necessidade.
- Quando sobrescrever, documentar e versionar bem.
