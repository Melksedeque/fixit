# Commit Guidelines

Este documento define o **padrão oficial de commits e branches**, baseado em **Conventional Commits**, com mensagens em **português** para facilitar leitura e revisão.

---

## 🌿 Padrão de Branch

Formato: `Type/Nome-Curto`

Exemplos:

- `Feat/Auth-Login`
- `Fix/Carrinho-Quantidade`
- `Refactor/API-Validacao`
- `Chore/Update-Deps`

---

## ✍️ Padrão de Commit

Formato obrigatório: `Type(Scope): Descrição em português`

### Tipos permitidos

- `Feat` – Nova funcionalidade
- `Fix` – Correção de bug
- `Refactor` – Refatoração sem mudar comportamento
- `Perf` – Melhoria de performance
- `Rest` – Testes
- `Docs` – Documentação
- `Chore` – Manutenção
- `CI` – Pipeline/Config

### Regras

- `type` sempre em inglês com a primeira letra maiúscula, mas se for sigla, fica em maiúscula
- `scope` curto, técnico, em kebab-case com a primeira letra de cada palavra em maiúscula
- descrição:
  - em português
  - no imperativo
  - clara e objetiva
  - primeira letra e nomes de funções em maiúscula

### Exemplos corretos

- `Feat(Auth): Adicionar login com link mágico`
- `Fix(Carrinho): Impedir quantidade negativa`
- `Refactor(API): Mover validação para requests`
- `Perf(Lista): Reduzir re-render desnecessário`

### Exemplos incorretos

- `Update stuff`
- `Corrigindo bug`
- `Feat: várias mudanças`
- `WIP`

---

## 📏 Tamanho do Commit

- 1 commit = 1 intenção
- Evitar commits grandes e genéricos
- Commits pequenos facilitam rollback e revisão

---

## 🔐 Segurança em Commits

Nunca versionar:

- `.env`
- chaves de API
- tokens
- credenciais
- dumps de banco

Se algo sensível for detectado:

- parar
- remover do histórico
- avisar

---

## 📌 Nota Final

Commits contam a **história do projeto**.  
Se a história está confusa, o código provavelmente também está.
