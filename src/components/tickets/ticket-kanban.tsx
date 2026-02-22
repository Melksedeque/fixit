'use client'

import { useEffect, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPriorityVariant } from './utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { updateStatus } from '@/app/(dashboard)/tickets/actions'
import { useRouter } from 'next/navigation'

type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'DONE'
  | 'CLOSED'
  | 'CANCELLED'

interface Ticket {
  id: string
  title: string
  status: TicketStatus
  priority: string
  customer?: { name: string | null } | null
  assignedTo?: { name: string | null; avatar: string | null } | null
  deliveryDate: Date | null
  updatedAt: Date
}

interface TicketKanbanProps {
  tickets: Ticket[]
  currentUserRole?: string
  currentUserName?: string
}

const columns: { id: TicketStatus; title: string }[] = [
  { id: 'OPEN', title: 'Aberto' },
  { id: 'IN_PROGRESS', title: 'Em Andamento' },
  { id: 'WAITING', title: 'Em Espera' },
  { id: 'DONE', title: 'Concluído' },
  { id: 'CLOSED', title: 'Fechado' },
  { id: 'CANCELLED', title: 'Cancelado' },
]

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'WAITING', 'CANCELLED'],
  IN_PROGRESS: ['OPEN', 'WAITING', 'DONE', 'CANCELLED'],
  WAITING: ['IN_PROGRESS', 'CANCELLED'],
  DONE: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
}

import { assignTicketToMe } from '@/app/(dashboard)/tickets/actions'

export function TicketKanban({
  tickets,
  currentUserRole,
  currentUserName,
}: TicketKanbanProps) {
  const [boardTickets, setBoardTickets] = useState<Ticket[]>(tickets)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const isTechOrAdmin =
    currentUserRole === 'ADMIN' || currentUserRole === 'TECH'

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'border-l-emerald-500'
      case 'MEDIUM':
        return 'border-l-sky-500'
      case 'HIGH':
        return 'border-l-amber-500'
      case 'CRITICAL':
        return 'border-l-red-500'
      default:
        return 'border-l-muted'
    }
  }

  useEffect(() => {
    setBoardTickets(tickets)
  }, [tickets])

  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/tickets/stream')
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data?.type === 'ping') return
          if (data?.type && String(data.type).startsWith('ticket:')) {
            router.refresh()
          }
        } catch {
          // ignore parse errors
        }
      }
    } catch {
      // ignore
    }
    return () => {
      es?.close()
    }
  }, [router])

  const changeStatus = (ticketId: string, targetStatus: TicketStatus) => {
    if (!isTechOrAdmin) {
      toast.error(
        'Somente administradores ou técnicos podem alterar o status pelo quadro'
      )
      return
    }

    const current = boardTickets.find((t) => t.id === ticketId)
    if (!current || current.status === targetStatus) return

    const currentStatus = current.status
    const allowedNext = allowedTransitions[currentStatus] || []
    if (!allowedNext.includes(targetStatus)) {
      toast.error('Transição de status inválida')
      return
    }

    setBoardTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: targetStatus } : t))
    )
    setPendingId(ticketId)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('status', targetStatus)
        await updateStatus(ticketId, formData)
        toast.success('Status do chamado atualizado com sucesso.')
      } catch {
        setBoardTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, status: currentStatus } : t
          )
        )
        toast.error('Erro ao atualizar status do chamado.')
      } finally {
        setPendingId((prev) => (prev === ticketId ? null : prev))
      }
    })
  }

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    status: TicketStatus
  ) => {
    event.preventDefault()
    const ticketId = event.dataTransfer.getData('text/plain')
    if (!ticketId) return
    changeStatus(ticketId, status)
    setDraggedId(null)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    ticket: Ticket
  ) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const order: TicketStatus[] = [
        'OPEN',
        'IN_PROGRESS',
        'WAITING',
        'DONE',
        'CLOSED',
        'CANCELLED',
      ]
      const index = order.indexOf(ticket.status)
      if (index === -1) return
      const nextIndex = event.key === 'ArrowRight' ? index + 1 : index - 1
      const targetStatus = order[nextIndex]
      if (!targetStatus) return
      changeStatus(ticket.id, targetStatus)
    }
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTickets = boardTickets.filter((t) => t.status === column.id)

        return (
          <div
            key={column.id}
            className="flex-1 min-w-[280px] flex flex-col gap-4"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column.id)}
            aria-label={`Coluna ${column.title}`}
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="font-medium text-sm text-muted-foreground">
                {column.title}
              </h3>
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground hover:bg-muted"
              >
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
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block"
                  >
                    <Card
                      draggable={isTechOrAdmin}
                      onDragStart={
                        !isTechOrAdmin
                          ? undefined
                          : (event) => {
                              event.dataTransfer.setData(
                                'text/plain',
                                ticket.id
                              )
                              setDraggedId(ticket.id)
                            }
                      }
                      onDragEnd={
                        !isTechOrAdmin
                          ? undefined
                          : () =>
                              setDraggedId((prev) =>
                                prev === ticket.id ? null : prev
                              )
                      }
                      tabIndex={0}
                      onKeyDown={(event) => handleKeyDown(event, ticket)}
                      aria-grabbed={draggedId === ticket.id}
                      className={`bg-card border-border shadow-sm ${
                        isTechOrAdmin ? 'cursor-move' : 'cursor-not-allowed'
                      } transition-colors border-l-[3px] ${getPriorityBorder(
                        ticket.priority
                      )} ${
                        draggedId === ticket.id ? 'ring-2 ring-primary' : ''
                      } ${pendingId === ticket.id ? 'opacity-60' : ''}`}
                    >
                      <CardContent className="p-3 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {ticket.id.slice(0, 6)}
                          </span>
                          <Badge
                            variant={getPriorityVariant(ticket.priority)}
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {ticket.priority}
                          </Badge>
                        </div>

                        <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
                          {ticket.title}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {ticket.customer?.name || 'Sem cliente'}
                          </div>
                          {ticket.assignedTo && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={ticket.assignedTo.avatar || undefined}
                              />
                              <AvatarFallback className="text-[10px] bg-muted">
                                {ticket.assignedTo.name
                                  ?.slice(0, 2)
                                  .toUpperCase() || '??'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!ticket.assignedTo && isTechOrAdmin && (
                            <button
                              type="button"
                              className="text-[10px] px-2 py-1 rounded-md border border-muted-foreground/30 hover:bg-muted/40 transition-colors"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const id = ticket.id
                                setPendingId(id)
                                startTransition(async () => {
                                  try {
                                    await assignTicketToMe(id)
                                    setBoardTickets((prev) =>
                                      prev.map((t) =>
                                        t.id === id
                                          ? {
                                              ...t,
                                              assignedTo: {
                                                name: currentUserName || 'Você',
                                                avatar: null,
                                              },
                                            }
                                          : t
                                      )
                                    )
                                    toast.success('Chamado assumido com sucesso.')
                                  } catch {
                                    toast.error('Erro ao assumir chamado.')
                                  } finally {
                                    setPendingId((prev) =>
                                      prev === id ? null : prev
                                    )
                                  }
                                })
                              }}
                              aria-label="Assumir chamado"
                            >
                              Assumir
                            </button>
                          )}
                        </div>

                        {(() => {
                          const reference = new Date(ticket.updatedAt).getTime()
                          const now = Date.now()

                          let targetHours: number
                          switch (ticket.priority) {
                            case 'LOW':
                              // ao longo do mês ~ 30 dias
                              targetHours = 30 * 24
                              break
                            case 'MEDIUM':
                              // até o fim da semana ~ 7 dias
                              targetHours = 7 * 24
                              break
                            case 'HIGH':
                              // 2 dias úteis ~ 48h (aproximação)
                              targetHours = 2 * 24
                              break
                            case 'CRITICAL':
                              // atenção imediata: qualquer tempo já conta contra
                              targetHours = 0
                              break
                            default:
                              targetHours = 0
                          }

                          const due = reference + targetHours * 60 * 60 * 1000
                          const diffMs = due - now
                          const overdue = diffMs < 0
                          const absMin = Math.round(Math.abs(diffMs) / 60000)
                          const days = Math.floor(absMin / (60 * 24))
                          const hours = Math.floor((absMin % (60 * 24)) / 60)
                          const minutes = absMin % 60
                          const display =
                            days > 0
                              ? `${days}d ${hours}h`
                              : hours > 0
                                ? `${hours}h ${minutes}m`
                                : `${minutes}m`

                          return (
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground">
                                SLA
                              </span>
                              <Badge
                                variant={
                                  overdue ? 'soft-destructive' : 'soft-info'
                                }
                                className="text-[10px] px-1.5 py-0 h-5"
                              >
                                {overdue
                                  ? `Fora do SLA há ${display}`
                                  : ticket.priority === 'CRITICAL'
                                    ? `Aberto há ${display}`
                                    : `Faltam ${display}`}
                              </Badge>
                            </div>
                          )
                        })()}
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
