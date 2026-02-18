"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getStatusLabel, getStatusVariant, getPriorityVariant } from "./utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteTicket } from "@/app/(dashboard)/tickets/actions"

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

interface TicketListProps {
  tickets: Ticket[]
  page: number
  pageCount: number
  params: Record<string, string | undefined>
}

export function TicketList({ tickets, page, pageCount, params }: TicketListProps) {
  const router = useRouter()
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource("/api/tickets/stream")
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data?.type === "ping") return
          if (data?.type && String(data.type).startsWith("ticket:")) {
            router.refresh()
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    return () => {
      es?.close()
    }
  }, [router])
  if (tickets.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Nenhum chamado encontrado.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border border-border bg-(--card-surface) overflow-hidden">
        <Table aria-label="Tabela de Chamados">
          <TableHeader className="bg-[(--card-surface)">
            <TableRow className="hover:bg-[(--card-surface) border-border">
              <TableHead className="text-muted-foreground">Nº</TableHead>
              <TableHead className="text-muted-foreground">Título</TableHead>
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Responsável</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Prioridade</TableHead>
              <TableHead className="text-right text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id} className="hover:bg-muted/50 border-border">
                <TableCell className="font-mono text-xs text-muted-foreground">{t.id.slice(0, 6)}</TableCell>
                <TableCell className="font-medium text-foreground">{t.title}</TableCell>
                <TableCell className="text-muted-foreground">{t.customer?.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.assignedTo?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(String(t.status))}>
                    {getStatusLabel(String(t.status))}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityVariant(String(t.priority))}>
                    {String(t.priority)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild aria-label="Ver detalhes" className="text-muted-foreground hover:text-foreground">
                    <Link href={`/tickets/${t.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild aria-label="Editar chamado" className="text-muted-foreground hover:text-foreground">
                    <Link href={`/tickets/${t.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Excluir chamado" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Chamado</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <form action={async () => { await deleteTicket(t.id) }}>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Página {page} de {pageCount}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" disabled={page <= 1} aria-label="Página anterior" className="border-border bg-transparent text-foreground hover:bg-muted">
            <Link href={`/tickets?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}>Anterior</Link>
          </Button>
          <Button asChild variant="outline" disabled={page >= pageCount} aria-label="Próxima página" className="border-border bg-transparent text-foreground hover:bg-muted">
            <Link href={`/tickets?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}>Próxima</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
