# Estrutura de Dados (Prisma)

## Modelos Principais

- **User:** id, name, email, password, role (ADMIN, TECH, USER).
- **Ticket:** - id, title, description, status (OPEN, IN_PROGRESS, DONE, CANCELLED).
  - priority (LOW, MEDIUM, HIGH, CRITICAL).
  - createdAt, updatedAt.
  - deadlineForecast (Data prevista).
  - deliveryDate (Data real - salva automaticamente no status DONE).
  - executionTime (Diferença em minutos/horas entre início e fim).
- **Message:** id, ticketId, userId, content, type (TEXT, IMAGE, VIDEO, AUDIO), fileUrl.
