## Sustentar sessão de usuário
- [ ] Persistir sessão em cookies (segurança básica)
- [ ] Invalidar sessão ao fazer logout
- [ ] Expiração de sessão (ex.: 1h)
- [ ] Rotas protegidas (server actions)
- [ ] Acessibilidade (leitores de tela)

## Tela de Login
- [ ] Colocar "olho" para visualizar senha digitada

## Sistema de Segurança
- [ ] Diferença de permissões entre técnicos e usuários normais
- [ ] Hash de senhas (bcrypt)
- [ ] Proteção contra CSRF
- [ ] Proteção contra XSS
- [ ] Proteção contra injeção de SQL
- [ ] Proteção contra ataque de força bruta
- [ ] Lista de usuários disponível apenas para ADMIN

## Chamados 
- [ ] Separar em abas os Chamados (Lista/Kanban) do Dashboard (Métricas). Se for usuário tecnico mostrar apenas os seus chamados tanto na Lista quanto no Kanban e os dados dos seus chamados no Dashboard. Se for admin, mostrar Todos os chamados. Se for usuário normal, mostrar apenas os chamados que ele abriu, sem dashboard.