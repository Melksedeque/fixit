# Checklist de Implementação — Módulo de Chamados

## Status e Fluxo
- [ ] Adicionar statuses WAITING e CLOSED mantendo DONE/CANCELLED
- [ ] Definir regras de transição (OPEN ↔ IN_PROGRESS ↔ WAITING, DONE → CLOSED, CANCELLED final)
- [ ] UI: exibir badges para WAITING e CLOSED
- [ ] Atualizar contadores/métricas para incluir WAITING e CLOSED

## Modelo de Dados (Prisma)
- [ ] Ticket: manter `deadlineForecast`; adicionar `closedAt`, `category`, `slaHours`
- [ ] Ticket: manter `deliveryDate` e `executionTime`
- [ ] TicketHistory: `actionType` (STATUS_CHANGE, ASSIGNMENT, PRIORITY_CHANGE), `oldValue`, `newValue`, `userId`, `createdAt`
- [ ] Relacionamentos e back-relations (Ticket.histories, User.ticketHistories)
- [ ] Índices úteis (status, priority, assignedToId, customerId, deadlineForecast)

## Ações de Servidor (Tickets)
- [ ] Criar/Editar: persistir `assignedToId`, `deadlineForecast`, `priority`
- [ ] Atualizar Status: permitir OPEN/IN_PROGRESS/WAITING/DONE/CLOSED/CANCELLED
- [ ] Fechamento: setar `closedAt` e calcular `executionTime` (minutos)
- [ ] Atribuição: atualizar `assignedToId`
- [ ] Histórico: registrar STATUS_CHANGE, ASSIGNMENT, PRIORITY_CHANGE com usuário e valores
- [ ] Revalidate: rota de lista e detalhe

## Kanban
- [ ] Implementar drag-and-drop entre colunas
- [ ] Persistir status ao soltar (server action)
- [ ] Atualização otimista e fallback
- [ ] Acessibilidade (teclado) e feedback visual

## Detalhe do Chamado
- [ ] Painel de controle (status, prioridade, responsável, SLA)
- [ ] Edição inline de título/descrição
- [ ] Timeline do histórico (TicketHistory)
- [ ] Comentários com tipos (TEXT/IMAGE/VIDEO/AUDIO) e preview

## Métricas e Dashboard
- [ ] Contadores por status incluindo WAITING/CLOSED
- [ ] Tempo médio de resolução (por técnico e geral)
- [ ] SLA médio e chamados fora do SLA
- [ ] Gráficos por status e período

## Permissões
- [ ] ADMIN: criar/editar/atribuir/fechar/cancelar
- [ ] USER: criar/comentar/visualizar próprios chamados
- [ ] Gate nas server actions e filtros coerentes com papel

## Notificações e Tempo Real
- [ ] Websocket para atualização de lista/kanban
- [ ] E-mail para eventos (fechado/cancelado/atribuído)
- [ ] Rate limit e observabilidade mínima

## Migração e Dados
- [ ] Backfill `closedAt` a partir de `deliveryDate` quando aplicável
- [ ] `slaHours` padrão (ex.: 24) quando ausente
- [ ] `category` opcional; validar nomenclaturas futuras

## Qualidade
- [ ] Lint/Typecheck/Build OK
- [ ] Testes de ações (status/assign/history)
- [ ] A11y básico (foco/aria nos componentes)
