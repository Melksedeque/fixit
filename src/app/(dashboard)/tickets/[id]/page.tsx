import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { addComment, updateStatus, deleteTicket, updateTicket, assignTicketToMe, addAttachments } from "@/app/(dashboard)/tickets/actions"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { TicketAttachmentsArea } from "@/components/tickets/ticket-attachments-area"

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: { mp?: string }
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      customerId: true,
      customer: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!ticket) {
    redirect("/tickets")
  }

  const isAdmin = session.user.role === "ADMIN"
  const isTech = session.user.role === "TECH"
  const isOwner = ticket.customerId === session.user.id
  const isAssignedTech = ticket.assignedTo?.id === session.user.id
  const isTechOrAdmin = isAdmin || isTech
  const canEditTicket = isAdmin || isOwner || (isTech && isAssignedTech)

  const mp = Number(searchParams?.mp || "1")
  const take = 10
  const skip = (mp - 1) * take
  const [messages, totalMessages, histories, attachments] = await Promise.all([
    prisma.message.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        content: true,
        type: true,
        fileUrl: true,
        createdAt: true,
        user: { select: { name: true } }
      }
    }),
    prisma.message.count({ where: { ticketId: id } }),
    prisma.ticketHistory.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actionType: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.message.findMany({
      where: { ticketId: id, type: "IMAGE" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, fileUrl: true, content: true, createdAt: true },
    }),
  ])
  const msgPageCount = Math.max(1, Math.ceil(totalMessages / take))

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{ticket.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{ticket.priority}</Badge>
            <Badge variant="outline">{ticket.status}</Badge>
            {isAdmin && (
              <form action={async () => { await deleteTicket(ticket.id) }} >
                <Button type="submit" variant="soft-destructive">Excluir</Button>
              </form>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-muted-foreground">Cliente: <span className="text-foreground">{ticket.customer?.name}</span></div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-muted-foreground">
                Responsável: <span className="text-foreground">{ticket.assignedTo?.name || "-"}</span>
              </div>
              {isTechOrAdmin && !ticket.assignedTo && (
                <form action={assignTicketToMe.bind(null, ticket.id)}>
                  <Button type="submit" variant="soft-success" size="sm">
                    Assumir Chamado
                  </Button>
                </form>
              )}
            </div>
            <div className="text-muted-foreground">Status atual:
              <Badge variant="secondary" className="ml-2">{ticket.status}</Badge>
            </div>
            <div className="text-muted-foreground">Descrição:</div>
            <div className="prose prose-invert rounded-md border border-border bg-(--card-surface) p-3" dangerouslySetInnerHTML={{ __html: ticket.description || "" }} />
            {canEditTicket && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="soft-edit" size="sm">Editar Chamado</Button>
                </DialogTrigger>
                <DialogContent className="bg-primary-foreground sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Chamado</DialogTitle>
                  </DialogHeader>
                  <form
                    action={updateTicket.bind(null, ticket.id)}
                    className="grid grid-cols-1 gap-4"
                  >
                    <input
                      name="title"
                      defaultValue={ticket.title}
                      aria-label="Título"
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Prioridade</div>
                      <select
                        name="priority"
                        defaultValue={String(ticket.priority)}
                        aria-label="Prioridade"
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                        <option value="CRITICAL">Crítica</option>
                      </select>
                    </div>
                    <RichTextEditor
                      name="description"
                      label="Descrição"
                      placeholder="Atualize a descrição do chamado"
                      defaultValue={ticket.description || ""}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="soft-edit">Salvar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <form action={updateStatus.bind(null, ticket.id)} className="max-w-xs">
              <select
                name="status"
                defaultValue={String(ticket.status)}
                aria-label="Status"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="OPEN">Aberto</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="WAITING">Aguardando</option>
                <option value="DONE">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              <Button type="submit" variant="soft-edit" className="mt-2">Atualizar Status</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent>
            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((a) => (
                  <div key={a.id} className="relative h-24 w-full overflow-hidden rounded-md border border-border bg-muted">
                    {a.fileUrl ? (
                      <Image src={a.fileUrl} alt={a.content || "Anexo"} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem imagem</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-muted-foreground">
                Nenhum anexo.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comentários</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={addComment.bind(null, ticket.id)}
            className="space-y-3"
          >
            <textarea
              name="message"
              placeholder="Escreva um comentário..."
              aria-label="Comentário"
              required
              className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <div className="flex items-center justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">Upload de Anexos</Button>
                </DialogTrigger>
                <DialogContent className="bg-primary-foreground sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enviar Anexos</DialogTitle>
                  </DialogHeader>
                  <form action={addAttachments.bind(null, ticket.id)} className="space-y-3">
                    <TicketAttachmentsArea name="commentAttachments" />
                    <div className="flex justify-end">
                      <Button type="submit" variant="soft-success">Salvar Anexos</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button type="submit" variant="soft-success">
                Adicionar Comentário
              </Button>
            </div>
          </form>
          <div className="mt-6 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-md border border-border bg-(--card-surface) p-3">
                <div className="text-xs text-muted-foreground">
                  {m.user?.name} • {new Date(m.createdAt).toLocaleString()}
                </div>
                {m.type === "IMAGE" && m.fileUrl ? (
                  <div className="mt-2">
                    <Image
                      src={m.fileUrl}
                      alt={m.content || "Imagem do chamado"}
                      width={320}
                      height={180}
                      className="h-auto w-full max-w-sm rounded-md border border-border object-cover"
                    />
                  </div>
                ) : m.type === "VIDEO" && m.fileUrl ? (
                  <div className="mt-2">
                    <video
                      controls
                      className="h-auto w-full max-w-sm rounded-md border border-border"
                      src={m.fileUrl}
                    />
                  </div>
                ) : m.type === "AUDIO" && m.fileUrl ? (
                  <div className="mt-2">
                    <audio controls className="w-full max-w-sm">
                      <source src={m.fileUrl} />
                    </audio>
                  </div>
                ) : (
                  <div className="mt-2 text-foreground">{m.content}</div>
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhum comentário ainda.</div>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Página {mp} de {msgPageCount}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" disabled={mp <= 1} aria-label="Página anterior">
                <Link
                  href={`/tickets/${ticket.id}?${new URLSearchParams({ mp: String(mp - 1) }).toString()}`}
                >
                  Anterior
                </Link>
              </Button>
              <Button asChild variant="outline" disabled={mp >= msgPageCount} aria-label="Próxima página">
                <Link
                  href={`/tickets/${ticket.id}?${new URLSearchParams({ mp: String(mp + 1) }).toString()}`}
                >
                  Próxima
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {histories.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhum evento de histórico ainda.</div>
          )}
          {histories.map((h) => {
            let description = ""
            if (h.actionType === "STATUS_CHANGE") {
              description = `Status: ${h.oldValue ?? "-"} → ${h.newValue ?? "-"}`
            } else if (h.actionType === "ASSIGNMENT") {
              description = `Responsável: ${h.oldValue ?? "-"} → ${h.newValue ?? "-"}`
            } else if (h.actionType === "PRIORITY_CHANGE") {
              description = `Prioridade: ${h.oldValue ?? "-"} → ${h.newValue ?? "-"}`
            }
            return (
              <div
                key={h.id}
                className="flex items-start justify-between rounded-md border border-border bg-(--card-surface) p-3"
              >
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {h.user?.name} • {new Date(h.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-foreground">{description}</div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

