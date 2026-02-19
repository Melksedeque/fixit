import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, Users, Clock, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="main">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Chamados
            </CardTitle>
            <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 p-1.5">
              <Ticket className="h-4 w-4 text-primary" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
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
