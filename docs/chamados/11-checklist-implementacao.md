# Checklist de Implementação — Módulo de Chamados

## Status e Fluxo
- [x] Adicionar statuses WAITING e CLOSED mantendo DONE/CANCELLED
- [x] Definir regras de transição (OPEN ↔ IN_PROGRESS ↔ WAITING, DONE → CLOSED, CANCELLED final)
- [x] UI: exibir badges para WAITING e CLOSED
- [x] Atualizar contadores/métricas para incluir WAITING e CLOSED

## Modelo de Dados (Prisma)
- [x] Ticket: manter `deadlineForecast`; adicionar `closedAt`, `category`, `slaHours`
- [x] Ticket: manter `deliveryDate` e `executionTime`
- [x] TicketHistory: `actionType` (STATUS_CHANGE, ASSIGNMENT, PRIORITY_CHANGE), `oldValue`, `newValue`, `userId`, `createdAt`
- [x] Relacionamentos e back-relations (Ticket.histories, User.ticketHistories)
- [ ] Índices úteis (status, priority, assignedToId, customerId, deadlineForecast)

## Ações de Servidor (Tickets)
- [x] Criar/Editar: persistir `assignedToId`, `deadlineForecast`, `priority`
- [x] Atualizar Status: permitir OPEN/IN_PROGRESS/WAITING/DONE/CLOSED/CANCELLED
- [x] Fechamento: setar `closedAt` e calcular `executionTime` (minutos)
- [x] Atribuição: atualizar `assignedToId`
- [x] Histórico: registrar STATUS_CHANGE, ASSIGNMENT, PRIORITY_CHANGE com usuário e valores
- [x] Revalidate: rota de lista e detalhe

## Kanban
- [x] Implementar drag-and-drop entre colunas
- [x] Persistir status ao soltar (server action)
- [x] Atualização otimista e fallback
- [x] Acessibilidade (teclado) e feedback visual
- [x] Borda de prioridade à esquerda (LOW/MEDIUM/HIGH/CRITICAL)
- [x] Indicadores de SLA por prioridade (mês/semana/2 dias/urgente)

## Detalhe do Chamado
- [x] Painel de controle (status, prioridade, responsável)
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
- [x] Lint/Typecheck/Build OK
- [ ] Testes de ações (status/assign/history)
- [ ] A11y básico (foco/aria nos componentes)

## Fluxo de Criação e Responsável
- [x] Mover criação de chamado para modal na página de tickets
- [x] Permitir criação sem responsável
- [x] Filtro “Sem responsável” na caixa de entrada
- [x] Botão “Assumir Chamado” (técnicos/admins)
