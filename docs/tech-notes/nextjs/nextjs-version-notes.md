# Next.js — Version Notes (Fonte de Verdade)

Este documento define decisões e alertas para evitar APIs depreciadas e padrões errados.
Ele não substitui a documentação oficial: em caso de dúvida, confirmar a versão e consultar docs.

---

## Regra de ouro
1) Sempre confirmar a **versão do Next.js** do projeto (package.json / lockfile).
2) Se houver dúvida, usar Web search e priorizar docs oficiais.
3) Quando houver conflito entre nota local e web, vencerá: **versão do projeto + fonte oficial**.

---

## Convenções e pegadinhas por versão

### Next 16
- Convenção: `proxy.ts` substitui `middleware.ts`.
- Ao trabalhar em projetos Next 16: **não criar `middleware.ts`**.
- Se encontrar `middleware.ts` em projeto Next 16, tratar como legado e migrar conforme orientação oficial.

Fontes oficiais:
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Next.js Documentation](https://nextjs.org/docs)

---

## App Router x Pages Router (decisão rápida)
- Preferir **App Router** em projetos novos.
- Manter **Pages Router** apenas em legado ou quando houver impeditivo real.
- Evitar misturar sem necessidade (se misturar, documentar a decisão).

---

## Server/Client Components (prática segura)
- Por padrão, preferir **Server Components**.
- Usar `"use client"` apenas quando necessário (estado, efeitos, handlers no client, libs que dependem de browser).
- Evitar puxar dependências pesadas para o client sem necessidade (isso inflaciona bundle).

Checklist antes de marcar `use client`:
- realmente precisa de `useState`/`useEffect`?
- é possível mover lógica pro server?
- componente pode ser dividido (UI client + data server)?

---

## Data Fetching e Cache (regra prática)
- Tratar dados como **server-first**.
- Cache/revalidate: sempre documentar a intenção (tempo, quando invalida, por quê).
- Se houver “dado sempre fresco”, deixar explícito e aceitar custo.

---

## Rotas, handlers e validação
- Validação e autorização: sempre no **server**.
- Evitar confiar em payload do client.
- Se usar Route Handlers, isolar regras em `lib/server/*` ou `server/*`.

---

## SEO (mínimo profissional)
- Definir metadata do projeto (title templates, description, og tags).
- Canonical e indexação: decidir por rota (principalmente páginas duplicadas/filtradas).
- Evitar render “vazio” no server e preencher tudo no client (prejudica SEO e UX).

---

## Padrão de pastas recomendado (App Router)
- `src/app` para rotas.
- `src/components` para UI reutilizável.
- `src/features` por domínio.
- `src/lib` utilitários.
- `src/server` para server-only (db, services, actions).
