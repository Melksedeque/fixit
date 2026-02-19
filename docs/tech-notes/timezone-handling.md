# Timezone Handling & Date Storage Strategy

## Visão Geral

Este documento descreve a estratégia adotada para resolver problemas de conversão de datas (UTC vs Local Time) no Sistema Fixit. O objetivo é garantir que datas como "01/01/2024" sejam armazenadas e exibidas corretamente, independentemente da localização geográfica do usuário ou do servidor, respeitando o fuso horário configurado para a instituição.

## Problema Original

O sistema armazenava datas em campos `DateTime` do PostgreSQL (que opera em UTC). Ao inserir "2024-01-01" através de um navegador em fuso GMT-3 (Brasília):

1. O navegador/JS convertia para UTC: "2024-01-01 00:00 GMT-3" -> "2024-01-01 03:00 UTC".
2. Ou, pior, ao usar `new Date("2024-01-01")` (ISO date-only), o JS interpreta como UTC Midnight ("2024-01-01 00:00 UTC").
3. Ao exibir essa data em GMT-3, ela virava "2023-12-31 21:00", resultando em um "retrocesso" de 1 dia na interface.

## Solução Implementada

### 1. Configuração de Timezone

Adicionamos o campo `timezone` ao modelo.

- Padrão: `"America/Sao_Paulo"`
- Configurável via `/app/settings`.

### 2. Utilitários de Data (`src/lib/date-utils.ts`)

Utilizamos a biblioteca `date-fns-tz` para manipular as conversões de forma explícita.

- **`parseDateFromInput(dateString, timezone)`**:
  - Recebe "YYYY-MM-DD" e o timezone.
  - Cria um objeto Date UTC que representa a **Meia-noite (00:00:00)** naquele timezone.
  - Exemplo (SP): "2024-01-01" -> "2024-01-01 00:00:00 -03:00" -> Armazenado como `2024-01-01 03:00:00 UTC`.

- **`formatDateForInput(date, timezone)`**:
  - Recebe o objeto Date UTC do banco.
  - Converte para o Zoned Time.
  - Formata como "YYYY-MM-DD" ignorando o fuso do servidor/navegador.
  - Exemplo: `2024-01-01 03:00:00 UTC` em SP -> `2024-01-01 00:00:00` -> Retorna "2024-01-01".

### 3. Fluxo de Dados

#### Salvamento (Action)

1. Recebe string "YYYY-MM-DD" do formulário.
2. Busca o `timezone` (`getTimezone()`).
3. Converte string -> Date UTC usando `parseDateFromInput`.
4. Salva no banco.

#### Leitura/Edição (Page/Form)

1. Busca Date UTC do banco.
2. Busca o `timezone` (`getTimezone()`).
3. Converte Date UTC -> string "YYYY-MM-DD" usando `formatDateForInput`.
4. Passa a string para o `value` do input `type="date"`.

### 4. Migração de Dados Existentes

Criamos um script (`scripts/fix-academic-years.ts`) para corrigir datas que foram armazenadas incorretamente (com deslocamento negativo).

- Uso: `npx tsx scripts/fix-academic-years.ts --fix`
- Ele adiciona 1 dia às datas existentes, assumindo que o erro foi o retrocesso padrão de fuso.

## Como Adicionar Novos Timezones

Para suportar novas regiões, basta adicionar as strings de timezone IANA (ex: "Europe/London", "Asia/Tokyo") na lista de opções em `src/app/(system)/app/settings/form.tsx`. O backend já suporta qualquer string válida IANA.

## Testes

Testes unitários foram criados em `scripts/test-dates.ts` para validar o "round-trip" (conversão de ida e volta) em diferentes fusos horários, garantindo integridade dos dados.
