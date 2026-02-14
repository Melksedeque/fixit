"use client"

import { useState } from "react"
import { LayoutList, KanbanSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TicketList } from "@/components/tickets/ticket-list"
import { TicketKanban } from "@/components/tickets/ticket-kanban"
import { Separator } from "@/components/ui/separator"

type TicketRow = {
  id: string
  title: string
  status: string
  priority: string
  customer?: { name: string | null } | null
  assignedTo?: { name: string | null, avatar: string | null } | null
  deliveryDate: Date | null
  updatedAt: Date
}

interface TicketsViewProps {
  tickets: TicketRow[]
  page: number
  pageCount: number
  params: Record<string, string | undefined>
}

export function TicketsView({ tickets, page, pageCount, params }: TicketsViewProps) {
  const [view, setView] = useState<"list" | "kanban">("list")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}
          >
            <LayoutList className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("kanban")}
            className={view === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}
          >
            <KanbanSquare className="h-4 w-4 mr-2" />
            Kanban
          </Button>
        </div>
      </div>

      <Separator className="bg-border" />

      {view === "list" ? (
        <TicketList tickets={tickets} page={page} pageCount={pageCount} params={params} />
      ) : (
        <TicketKanban tickets={tickets} />
      )}
    </div>
  )
}
