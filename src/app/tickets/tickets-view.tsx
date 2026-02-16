import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getPriorityVariant } from "@/components/tickets/utils"

type TicketListItem = {
  id: string
  title: string
  status: string
  priority: string
  customer: { name: string | null } | null
  assignedTo: { name: string | null; avatar: string | null } | null
  deliveryDate: Date | null
  updatedAt: Date
}

type SearchParams = {
  status?: string
  priority?: string
  q?: string
  page?: string
  assignedTo?: string
  view?: string
}

interface TicketsViewProps {
  tickets: TicketListItem[]
  page: number
  pageCount: number
  params: SearchParams
}

export function TicketsView({ tickets, page, pageCount, params }: TicketsViewProps) {
  const hasTickets = tickets.length > 0

  const formatDate = (date: Date | null) => {
    if (!date) return "-"
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Aberto"
      case "IN_PROGRESS":
        return "Em andamento"
      case "WAITING":
        return "Em espera"
      case "DONE":
        return "Concluído"
      case "CLOSED":
        return "Fechado"
      case "CANCELLED":
        return "Cancelado"
      default:
        return status
    }
  }

  const buildPageLink = (targetPage: number) => {
    const query = {
      ...params,
      page: String(targetPage),
      view: "list",
    }
    return {
      pathname: "/tickets",
      query,
    }
  }

  return (
    <Card className="mt-4 border border-border bg-(--card-surface) overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32px]" />
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Atualizado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasTickets ? (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors duration-200 ease-out"
                  onClick={() => {}}
                >
                  <TableCell className="px-4">
                    <Link href={`/tickets/${ticket.id}`}>
                      <Button size="icon" variant="outline" className="h-8 w-8">
                        #
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {ticket.customer?.name ? (
                      <span>{ticket.customer.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Sem cliente</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getStatusLabel(ticket.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={ticket.assignedTo.avatar || undefined}
                            alt={ticket.assignedTo.name || ""}
                          />
                          <AvatarFallback>
                            {ticket.assignedTo.name
                              ?.slice(0, 2)
                              .toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {ticket.assignedTo.name || "Sem nome"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Sem responsável
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(ticket.deliveryDate)}</TableCell>
                  <TableCell>{formatDate(ticket.updatedAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum chamado encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Página {page} de {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={page <= 1}
              >
                <Link href={buildPageLink(page - 1)}>Anterior</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={page >= pageCount}
              >
                <Link href={buildPageLink(page + 1)}>Próxima</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

