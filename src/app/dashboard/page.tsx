import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, Users, Clock, CheckCircle } from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user
  const isAdmin = user.role === 'ADMIN'
  const isTech = user.role === 'TECH'
  const isUser = user.role === 'USER'

  const ticketScope: Record<string, unknown> = isAdmin
    ? {}
    : isTech
    ? { assignedToId: user.id }
    : { customerId: user.id }

  const [totalTickets, openTickets, doneTickets, activeUsers] =
    await Promise.all([
      prisma.ticket.count({ where: ticketScope }),
      prisma.ticket.count({
        where: { ...ticketScope, status: 'OPEN' },
      }),
      prisma.ticket.count({
        where: { ...ticketScope, status: { in: ['DONE', 'CLOSED'] } },
      }),
      prisma.user.count(),
    ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Visão como {isAdmin ? 'administrador' : isTech ? 'técnico' : 'usuário'}.
      </p>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="main">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Total de Chamados' : 'Meus Chamados'}
            </CardTitle>
            <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 p-1.5">
              <Ticket className="h-4 w-4 text-primary" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground/80">
              +0% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card variant="main">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
            <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 p-1.5">
              <Clock className="h-4 w-4 text-primary" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground/80">
              Aguardando atendimento
            </p>
          </CardContent>
        </Card>
        <Card variant="main">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 p-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneTickets}</div>
            <p className="text-xs text-muted-foreground/80">
              +0% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card variant="main">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários Ativos
            </CardTitle>
            <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 p-1.5">
              <Users className="h-4 w-4 text-primary" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground/80">
              +0 novos usuários
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-7">
        <Card variant="surface" className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-semibold">Visão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Gráfico de chamados (em breve)
            </div>
          </CardContent>
        </Card>
        <Card variant="surface" className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-semibold">Chamados Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Lista de chamados recentes (em breve)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
