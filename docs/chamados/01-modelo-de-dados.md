# Modelo de Dados - Chamados

## Entidade: Ticket

- id (uuid)
- title
- description
- status (enum)
- priority (low | medium | high | urgent)
- requester_id
- assigned_to_id (nullable)
- created_at
- updated_at
- closed_at (nullable)
- due_date (nullable)
- category (nullable)
- sla_hours (nullable)

## Entidade: TicketComment

- id
- ticket_id
- user_id
- message
- created_at

## Entidade: TicketHistory

- id
- ticket_id
- action_type (status_change, assignment, priority_change, etc)
- old_value
- new_value
- user_id
- created_at
