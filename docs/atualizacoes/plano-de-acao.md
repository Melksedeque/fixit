# Plano de ação com checklist para tirar placeholders e preparar para dados reais

Abaixo um plano objetivo, organizado por áreas (Dashboard, Chamados, Usuários), focado em remover placeholders e garantir consistência com ambiente real.

## 1. Dashboard

[ ] Rever textos de crescimento (“+0% em relação ao mês passado”)

- Implementar cálculo real:
  - Contar tickets do mês atual vs mês anterior.
  - Calcular porcentagem de crescimento/queda.
- Em caso de poucos tickets, como vamos começar o uso agora, simplesmente deixe os textos ocultos.

[ ] Confirmar escopo de contagem para cada papel

- ADMIN:
  - totalTickets = todos os tickets.
- TECH:
  - totalTickets = tickets com assignedToId = tech.id .
- USER:
  - totalTickets = tickets com customerId = user.id .
- Validar se essa regra é exatamente o esperado de negócio; se não, ajustar ticketScope em dashboard/page.tsx .

[ ] Ajustar card de “Usuários Ativos”

- Hoje: prisma.user.count() (todos usuários).
- Decisão de negócio:
  - Se houver campo active / status na tabela, passar a usar apenas ativos.
  - Se não houver, definir se “ativo” significa “que já fez login pelo menos uma vez”, e então:
    - Criar campo/flag apropriado.
    - Atualizar contagem.

[ ] Planejar/implementar gráfico “Visão Geral”

- Definir o que o gráfico vai mostrar:
  - Por exemplo: tickets por status nos últimos 30 dias; ou por dia.
- Definir agregação em Prisma e componente de gráfico (Recharts, etc.).
- Remover placeholder “Gráfico de chamados (em breve)” quando houver dados.

[ ] Planejar/implementar “Chamados Recentes” no dashboard

- Definir:
  - Quantidade (ex.: 5 últimos tickets).
  - Escopo por papel (todos vs atribuídos vs abertos por mim).
- Implementar consulta e lista em lugar do placeholder “Lista de chamados recentes (em breve)”.

## 2. Chamados (/tickets)

[ ] Auditar e alinhar todos os status usados

- Verificar se todos os statuses possíveis ( OPEN , WAITING , IN_PROGRESS , DONE , CLOSED , CANCELLED ) estão:
  - Mapeados corretamente nas actions.
  - Representados corretamente nas opções dos filtros.
  - Mapeados para rótulos e variantes em tickets/utils.ts .

[ ] Confirmar cálculo de métricas na aba “Métricas”

- Garantir que:
  - executionTime é sempre preenchido ao fechar ticket ( DONE/CLOSED ).
  - slaHours é calculado/atualizado corretamente via cron de SLA.
- Criar pequenos cenários de teste:
  - Ticket com SLA cumprido.
  - Ticket com SLA estourado.
  - Ticket sem SLA (para ver se não entra em cálculos indevidos).
- Validar visualmente:
  - avgResMin , avgByTechDisplay , slaAvgHours , slaBreachesCount .

[ ] Padronizar período “Últimos 30d”

- Confirmar que todas as métricas, quando em “Últimos 30d”, usam createdAt >= hoje - 30 .
- Verificar se esse comportamento é o desejado (poderia ser outro período em produção).

[ ] Verificar filtros de pesquisa na aba Métricas

- /tickets form de filtros na aba Métricas está apontando para action="/tickets" .
- Garantir que:
  - Campos q , status , priority , assignedTo estão persistindo nas URLs.
  - A mesma query string alimenta tanto a lista (aba Chamados) quanto as métricas (aba Métricas).

[ ] Eliminar qualquer texto ou label de placeholder nos chamados

- Conferir se ainda existem textos como “(em breve)” em páginas relacionadas a chamados e remover/substituir por funcionalidade real ou mensagens neutras.

## 3. Usuários

[ ] Confirmar fluxo completo de boas-vindas

- Cenário 1: criar novo usuário ADMIN/TECH/USER:
  - Receber e-mail de boas-vindas com:
    - Link do sistema.
    - E-mail de acesso.
    - Senha definida no formulário.
- Cenário 2: clicar “Reenviar boas-vindas”:
  - Usuário recebe nova senha temporária.
  - mustChangePassword marcado como true.
- Validar se fluxo de troca de senha (página de change-password) está coerente com o uso de mustChangePassword.

[ ] Rever permissões de edição de usuário

- Hoje:
  - createUser : apenas ADMIN.
  - updateUser : ADMIN ou o próprio usuário.
- Verificar se:
  - TECH deve ou não editar outros usuários.
  - Se sim, adaptar updateUser e UI.
- Ajustar botões de edição (lista de usuários / detalhes / perfil) para refletir essas regras.

[ ] Tirar placeholders da experiência do perfil

- Revisar textos e métricas em:
  - profile/page.tsx .
  - users/[id]/page.tsx .
- Garantir que:
  - Métricas de “Meus Últimos Chamados” / “Chamados Recentes” refletem corretamente o papel (criador vs técnico).
  - Não há textos “decorativos” sem lógica por trás.

[ ] Garantir consistência de dados antes de produção real

- Definir estratégia para:
  - Apagar dados de teste (tickets e usuários de desenvolvimento) antes de “virar chave”.
  - Manter pelo menos um usuário ADMIN real.
- Opcional: criar um seed ou script de “reset” para ambiente de staging (sem dados reais).
