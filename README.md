# Fixit — Sistema de Chamados

## Visão Geral
- Este repositório contém o produto Fixit (Next.js, Tailwind v4, Radix UI) com Design System dark.
- O desenvolvimento e documentação técnica residem neste repositório e em `/docs`.

## Fluxo de Git e PR
- Sempre trabalhe em branches de feature a partir de `master`.
- Ao finalizar, envie a branch e abra PR no GitHub (Compare: `master...feature`).
- Após aprovação, faça merge em `master` e remova a branch de feature no remoto.
- Mensagens de commit devem seguir as guidelines em `/docs/commit-guidelines.md`.

## Sincronização do Repositório Local
- O problema comum: `git status` listando pastas de outros projetos ocorre quando o terminal está em uma pasta sem `.git` próprio e o Git usa um `.git` de um diretório pai (ex.: `D:/Workspace/.git`).
- Solução no diretório do projeto (Windows PowerShell/Git Bash), dentro de `d:\Workspace\xampp\htdocs\0_-_Projetos\fixit`:

```bash
# Garantir que o repositório local aponta para o remoto correto
git init
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Melksedeque/fixit.git

# Trazer estado da master e alinhar
git fetch origin
git checkout -B master origin/master
git reset --hard origin/master

# Verificação
git status
git remote -v
```

- Dicas:
  - Sempre abra o terminal na pasta do projeto que contém seu próprio `.git`.
  - Evite rodar comandos Git de diretórios pais (ex.: `D:/Workspace`) para não misturar remotos.

## Integração e Verificação
- Lint: `npm run lint` (erros fora do escopo UI não barram PRs de estilo, mas devem ser tratados em tarefas próprias).
- Dev server: `npm run dev` (Next.js Turbopack).
- Ao revisar visuais, utilize os tokens definidos em `src/app/globals.css`.

## Limpeza de Branches
- Após merge no GitHub:

```bash
# Remover branch de feature local
git branch -d feat/minha-feature

# Remover no remoto
git push origin --delete feat/minha-feature
```

## Links Úteis
- Diretrizes de commit: [/docs/commit-guidelines.md](file:///d:/Workspace/xampp/htdocs/0_-_Projetos/fixit/docs/commit-guidelines.md)
- Padrões de engenharia: [/docs/engineering-standards.md](file:///d:/Workspace/xampp/htdocs/0_-_Projetos/fixit/docs/engineering-standards.md)
- Notas de versão Next.js: [/docs/tech-notes/nextjs/nextjs-version-notes.md](file:///d:/Workspace/xampp/htdocs/0_-_Projetos/fixit/docs/tech-notes/nextjs/nextjs-version-notes.md)
- Escopo do produto: [/docs/escopo](file:///d:/Workspace/xampp/htdocs/0_-_Projetos/fixit/docs/escopo)
- Agentes/automação: [/docs/AGENTS.md](file:///d:/Workspace/xampp/htdocs/0_-_Projetos/fixit/docs/AGENTS.md)

---

## Fonte da Verdade

### Prioridade de documentos
1. /docs/AGENTS.md
2. /docs/nextjs-version-notes.md
3. /docs/engineering-standards.md
4. /docs/commit-guidelines.md
5. /docs/escopo/* (escopo do produto)

### Regra
Se existir conflito entre /docs/escopo e os padrões base:
- vence /docs (MCP)
- /docs/escopo deve apenas complementar o que for específico do produto.

