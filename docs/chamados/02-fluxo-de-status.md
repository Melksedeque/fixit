# Fluxo de Status

## Status padrão

- OPEN
- IN_PROGRESS
- WAITING
- RESOLVED
- CLOSED
- CANCELED

## Fluxo recomendado

OPEN → IN_PROGRESS → RESOLVED → CLOSED

Pode voltar:

- IN_PROGRESS → WAITING
- WAITING → IN_PROGRESS

## Regras

- CLOSED é estado final
- CANCELED é estado final
- RESOLVED pode ser reaberto
