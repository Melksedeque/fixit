# React + TypeScript — Version Notes (Fonte de Verdade)

Este documento define regras práticas para consistência, performance e manutenção em React + TS.

---

## Regra de ouro
- Confirmar versões (React, TS, bundler/framework).
- Preferir padrões modernos e evitar hacks.
- Em dúvida sobre API: consultar fonte oficial.

### Documentação
- Consultar React e TS docs sempre que possível.
- Preferir `@types/react` e `@types/react-dom` ao `react-scripts` (quando possível).

Fontes oficiais:
- [React Documentation](https://react.dev/)
- [React Version Notes](https://react.dev/versions)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

## TypeScript (padrões de time)
- Evitar `any`. Se inevitável, usar como “ponte” e isolar.
- Preferir:
  - `unknown` + narrowing
  - tipos utilitários bem definidos
  - `satisfies` quando ajuda a validar shape sem perder inferência
- Tipagem deve ajudar o código, não virar “teatro”.

Regras práticas:
- Component props: sempre tipadas, preferir `type` quando simples.
- Funções: tipar entradas e retornos (principalmente em `services/`).
- Dados externos (API): validar/parsear antes de usar (não confiar em TS puro).

---

## Componentização e responsabilidades
- Componentes pequenos e previsíveis.
- Separar:
  - UI (render)
  - state/efeitos
  - integração (API, storage, analytics)

Padrão saudável:
- `components/` = UI reutilizável
- `features/` = fluxo por domínio
- `services/` = integração externa
- `lib/` = utilitários

---

## Hooks (boas práticas)
- `useEffect`: usar com intenção clara (sincronização de efeitos). Evitar virar “event bus”.
- Dependências: nunca “enganar” deps sem motivo; se precisar, refatorar.
- Preferir `useMemo`/`useCallback` apenas quando:
  - existe custo real
  - ou está evitando rerender em child memoizado
- Se o app está lento, medir primeiro (Profiler / React DevTools).

---

## Performance (checklist rápido)
- Listas grandes: virtualização (quando necessário).
- Evitar criar funções/objetos inline em loops pesados.
- Memoização: aplicar no gargalo, não no projeto inteiro.
- Estado global: só quando fizer sentido; caso contrário, state local + props.
- Suspense/async: usar de forma consciente (não “envelopar tudo”).

---

## Estado (decisão rápida)
- Começar com state local.
- Subir state quando houver compartilhamento real.
- Context: bom para config e estado simples; cuidado com rerender global.
- Se precisar de state server (cache de API): usar ferramenta apropriada (ex.: TanStack Query) — se estiver no stack.

---

## Testes (mínimo)
- Unit/Integration: React Testing Library
- E2E: quando fluxo é crítico
- Testar comportamento, não implementação
