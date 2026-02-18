import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, Calendar, Shield, CheckCircle2, Clock, AlertCircle, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getUserInitials } from "@/lib/utils/user"

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  if (session?.user?.role !== "ADMIN") {
    redirect("/users")
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

  const isTechOrAdmin = user.role === "ADMIN" || user.role === "TECH"
  const whereCondition = isTechOrAdmin ? { assignedToId: user.id } : { customerId: user.id }

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
    _count: { status: true }
  })

  const executionStats = await prisma.ticket.aggregate({
    _avg: { executionTime: true },
    where: { ...whereCondition, status: "DONE" }
  })

  const avgExecutionTime = executionStats._avg.executionTime || 0
  const avgHours = Math.floor(avgExecutionTime / 60)
  const avgMinutes = Math.round(avgExecutionTime % 60)
  const avgTimeDisplay = avgHours > 0 ? `${avgHours}h ${avgMinutes}m` : `${avgMinutes}m`

  const totalTickets = isTechOrAdmin ? user._count.ticketsAssigned : user._count.ticketsCreated
  const openTickets = stats.find(s => s.status === "OPEN")?._count.status || 0
  const inProgressTickets = stats.find(s => s.status === "IN_PROGRESS")?._count.status || 0
  const doneTickets = stats.find(s => s.status === "DONE")?._count.status || 0
  const completionRate = totalTickets ? Math.round((doneTickets / totalTickets) * 100) : 0
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\\D/g, "")
    if (cleaned.length === 11) return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    if (cleaned.length === 10) return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
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
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "OPEN": return "soft-warning"
      case "IN_PROGRESS": return "soft-info"
      case "DONE": return "soft-success"
      case "CANCELLED": return "soft-destructive"
      default: return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Detalhes do Usuário</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center pb-2">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl">{getUserInitials(user.name)}</AvatarFallback>
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

        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTickets}</div>
                <p className="text-xs text-muted-foreground">Chamados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{doneTickets}</div>
                <p className="text-xs text-muted-foreground">{completionRate}% taxa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressTickets}</div>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openTickets}</div>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgTimeDisplay}</div>
                <p className="text-xs text-muted-foreground">Execução</p>
              </CardContent>
            </Card>
          </div>

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
                    <div key={ticket.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="font-medium">{ticket.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant={getStatusVariant(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                          <span>•</span>
                          <span>{format(ticket.updatedAt, "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tickets/${ticket.id}`}>Ver Detalhes</Link>
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

