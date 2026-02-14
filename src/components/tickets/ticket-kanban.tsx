"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPriorityVariant } from "./utils"
import Link from "next/link"

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
  customer?: { name: string | null } | null
  assignedTo?: { name: string | null, avatar: string | null } | null
  deliveryDate: Date | null
  updatedAt: Date
}

interface TicketKanbanProps {
  tickets: Ticket[]
}

const columns = [
  { id: "OPEN", title: "Aberto" },
  { id: "IN_PROGRESS", title: "Em Andamento" },
  { id: "DONE", title: "Concluído" },
  { id: "CANCELLED", title: "Cancelado" },
]

export function TicketKanban({ tickets }: TicketKanbanProps) {
  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTickets = tickets.filter((t) => t.status === column.id)
        
        return (
          <div key={column.id} className="flex-1 min-w-[280px] flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-medium text-sm text-muted-foreground">{column.title}</h3>
              <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                {columnTickets.length}
              </Badge>
            </div>
            
            <div className="flex flex-col gap-3 h-full rounded-lg bg-muted/20 p-2 border border-border/50">
              {columnTickets.length === 0 ? (
                <div className="h-20 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
                  Vazio
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card border-border shadow-sm">
                      <CardContent className="p-3 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {ticket.id.slice(0, 6)}
                          </span>
                          <Badge variant={getPriorityVariant(ticket.priority)} className="text-[10px] px-1.5 py-0 h-5">
                            {ticket.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
                          {ticket.title}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {ticket.customer?.name || "Sem cliente"}
                          </div>
                          {ticket.assignedTo && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ticket.assignedTo.avatar || undefined} />
                              <AvatarFallback className="text-[10px] bg-muted">
                                {ticket.assignedTo.name?.slice(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
