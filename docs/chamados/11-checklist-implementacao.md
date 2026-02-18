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
- [x] Índices úteis (status, priority, assignedToId, customerId, deadlineForecast)

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
- [x] Edição inline de título/descrição
- [x] Timeline do histórico (TicketHistory)
- [x] Comentários com tipos (TEXT/IMAGE/VIDEO/AUDIO) e preview

## Métricas e Dashboard
- [x] Contadores por status incluindo WAITING/CLOSED
- [x] Tempo médio de resolução (por técnico e geral)
- [x] SLA médio e chamados fora do SLA
- [x] Gráficos por status e período

## Permissões
- [x] ADMIN: criar/editar/atribuir/fechar/cancelar
- [x] TECHNICIAN: visualizar/atualizar status/atribuir/fechar/cancelar
- [x] USER: criar/comentar/visualizar próprios chamados/atualizar próprios chamados
- [x] Gate nas server actions e filtros coerentes com papel

## Notificações e Tempo Real
- [x] Websocket/SSE para atualização de lista/kanban
- [x] E-mail para eventos (fechado/cancelado/atribuído)
- [x] Rate limit e observabilidade mínima

## Migração e Dados
- [x] Backfill `closedAt` a partir de `deliveryDate` quando aplicável
- [x] `slaHours` padrão (ex.: 24) quando ausente
- [x] `category` opcional; validar nomenclaturas futuras

## Qualidade
- [x] Lint/Typecheck/Build OK

## Fluxo de Criação e Responsável
- [x] Mover criação de chamado para modal na página de tickets
- [x] Permitir criação sem responsável
- [x] Filtro “Sem responsável” na caixa de entrada
- [x] Botão “Assumir Chamado” (técnicos/admins)

## Melhorias de UX
- [x] Campo de Descrição na página de detalhes do chamado precisa interpretar o HTML e renderizar corretamente as tags;
- [x] Opção de editar titulo e descrição apenas no formulário de edição do chamado (modal/dialog) e não na página de detalhes;
- [x] Arquivos anexos devem estar em um card alinhado à direita do card de Informações;
- [x] Badge de Status ao lado da badge de Prioridade que está no topo da página;
- [x] Seção de Comentários deve ter um botão para fazer upload de arquivos (imagens/videos/audio). Este botão pode abrir um modal/dialog para upload com dropzone;
- [x] O campo de texto do comentário deve ocupar todo o espaço disponível, semelhante ao campo de descrição;
- [x] O botão de enviar comentário deve estar alinhado à direita do campo de texto;
- [x] A seção de Histórico deve ser a última da página;
- [x] Remover opção de data de previsão da criação de chamados por parte do usuário, quem define a previsão é o técnico responsável.
