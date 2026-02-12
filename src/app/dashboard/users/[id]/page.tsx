
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ticketsCreated: true,
          ticketsAssigned: true,
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // Determine context based on role
  const isTechOrAdmin = user.role === "ADMIN" || user.role === "TECH"
  
  // Fetch tickets stats
  const whereCondition = isTechOrAdmin 
    ? { assignedToId: user.id }
    : { customerId: user.id }

  const tickets = await prisma.ticket.findMany({
    where: whereCondition,
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      updatedAt: true,
      createdAt: true,
    }
  })

  const stats = await prisma.ticket.groupBy({
    by: ['status'],
    where: whereCondition,
    _count: {
      status: true
    }
  })

  // Calculate average execution time for completed tickets
  const executionStats = await prisma.ticket.aggregate({
    _avg: {
      executionTime: true
    },
    where: {
      ...whereCondition,
      status: "DONE"
    }
  })

  const avgExecutionTime = executionStats._avg.executionTime || 0
  const avgHours = Math.floor(avgExecutionTime / 60)
  const avgMinutes = Math.round(avgExecutionTime % 60)
  const avgTimeDisplay = avgHours > 0 
    ? `${avgHours}h ${avgMinutes}m` 
    : `${avgMinutes}m`

  // Calculate totals
  const totalTickets = isTechOrAdmin ? user._count.ticketsAssigned : user._count.ticketsCreated
  const openTickets = stats.find(s => s.status === "OPEN")?._count.status || 0
  const inProgressTickets = stats.find(s => s.status === "IN_PROGRESS")?._count.status || 0
  const doneTickets = stats.find(s => s.status === "DONE")?._count.status || 0
  const cancelledTickets = stats.find(s => s.status === "CANCELLED")?._count.status || 0

  // Calculate generic completion rate or other metric
  const completionRate = totalTickets > 0 
    ? Math.round((doneTickets / totalTickets) * 100) 
    : 0

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return phone
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN": return "Aberto"
      case "IN_PROGRESS": return "Em Andamento"
      case "DONE": return "Concluído"
      case "CANCELLED": return "Cancelado"
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-yellow-100 text-yellow-800"
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800"
      case "DONE": return "bg-green-100 text-green-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Detalhes do Usuário</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Dados do Usuário (md:col-span-4 lg:col-span-3) */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center pb-2">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3" />
                {user.role}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> E-mail
                </p>
                <p className="text-sm break-all">{user.email}</p>
              </div>

              {user.whatsapp && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> WhatsApp
                  </p>
                  <a 
                    href={`https://wa.me/55${user.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {formatPhone(user.whatsapp)}
                  </a>
                </div>
              )}

              <Separator />

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Membro desde
                </p>
                <p className="text-sm">
                  {format(user.createdAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Dashboard (md:col-span-8 lg:col-span-9) */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Chamados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{doneTickets}</div>
                <p className="text-xs text-muted-foreground">
                  {completionRate}% taxa
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openTickets}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgTimeDisplay}</div>
                <p className="text-xs text-muted-foreground">
                  Execução
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Chamados Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Chamados Recentes</CardTitle>
              <CardDescription>
                Últimos 5 chamados {isTechOrAdmin ? "atendidos por" : "abertos por"} este usuário.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{ticket.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                          <span>•</span>
                          <span>{format(ticket.updatedAt, "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  Nenhum chamado encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
