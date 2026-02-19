import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getUserInitials } from '@/lib/utils/user'
import { getStatusLabel, getStatusVariant } from '@/components/tickets/utils'

type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'DONE'
  | 'CLOSED'
  | 'CANCELLED'

interface UserProfileLayoutProps {
  title: string
  user: {
    id: string
    name: string
    email: string
    role: string
    whatsapp: string | null
    avatar: string | null
    createdAt: Date
  }
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  doneTickets: number
  completionRate: number
  avgTimeDisplay: string
  tickets: {
    id: string
    title: string
    status: TicketStatus
    priority: string
    updatedAt: Date
    createdAt: Date
  }[]
  isTechOrAdmin: boolean
  isSelf?: boolean
  backHref?: string
}

export function UserProfileLayout({
  title,
  user,
  totalTickets,
  openTickets,
  inProgressTickets,
  doneTickets,
  completionRate,
  avgTimeDisplay,
  tickets,
  isTechOrAdmin,
  isSelf = false,
  backHref,
}: UserProfileLayoutProps) {
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11)
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    if (cleaned.length === 10)
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    return phone
  }

  const listTitle = isSelf ? 'Meus Últimos Chamados' : 'Chamados Recentes'
  const listDescription = `Últimos 5 chamados ${
    isTechOrAdmin ? 'atendidos por' : 'abertos por'
  } ${isSelf ? 'você.' : 'este usuário.'}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <Card variant="surface">
            <CardHeader className="flex flex-col items-center text-center pb-2">
              <Avatar className="h-32 w-32 mb-4 border-4 border-primary p-1">
                <AvatarImage
                  src={user.avatar || undefined}
                  alt={user.name}
                  className="rounded-full"
                />
                <AvatarFallback className="text-2xl">
                  {getUserInitials(user.name)}
                </AvatarFallback>
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
                <Link
                  href={`mailto:${user.email}`}
                  className="text-sm break-all text-primary hover:text-sky-600 transition-all duration-300"
                >
                  {user.email}
                </Link>
              </div>

              {user.whatsapp && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> WhatsApp
                  </p>
                  <Link
                    href={`https://wa.me/55${user.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-sky-600 transition-all duration-300"
                  >
                    {formatPhone(user.whatsapp)}
                  </Link>
                </div>
              )}

              <Separator />

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Membro desde
                </p>
                <p className="text-sm">
                  {format(user.createdAt, "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
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
                <CardTitle className="text-sm font-medium">
                  Concluídos
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Em Andamento
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Tempo Médio
                </CardTitle>
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
              <CardTitle>{listTitle}</CardTitle>
              <CardDescription>{listDescription}</CardDescription>
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
                          <Badge variant={getStatusVariant(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                          <span>•</span>
                          <span>
                            {format(ticket.updatedAt, 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tickets/${ticket.id}`}>
                          {isSelf ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </>
                          ) : (
                            <>Ver Detalhes</>
                          )}
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
