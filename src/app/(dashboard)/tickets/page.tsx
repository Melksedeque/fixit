import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Filter, Plus, Search } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { TicketList } from "@/components/tickets/ticket-list"
import { TicketKanban } from "@/components/tickets/ticket-kanban"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createTicket } from "@/app/(dashboard)/tickets/actions"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { TicketSubmitButton } from "@/components/tickets/ticket-submit-button"
import { TicketAttachmentsArea } from "@/components/tickets/ticket-attachments-area"
import { TicketCreatedToast } from "@/components/tickets/ticket-created-toast"

type SearchParams = {
  status?: "OPEN" | "IN_PROGRESS" | "WAITING" | "DONE" | "CLOSED" | "CANCELLED"
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  q?: string
  page?: string
  assignedTo?: "me" | "any" | "unassigned"
  view?: "list" | "kanban"
  created?: string
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const params = await searchParams
  const page = Number(params.page || "1")
  const take = 10
  const skip = (page - 1) * take

  const where: Record<string, unknown> = {}
  if (params.status) where.status = params.status
  if (params.priority) where.priority = params.priority
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ]
  }
  const assignedPref = params.assignedTo ?? "me"
  const isUser = session.user.role === "USER"
  if (isUser) {
    where.customerId = session.user.id
  } else {
    if (assignedPref === "me") {
      where.assignedToId = session.user.id
    } else if (assignedPref === "unassigned") {
      where.assignedToId = null
    }
  }

  const [tickets, totalCount, stats, techs, avgResolution, avgByTech, slaAvg] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        customer: { select: { name: true } },
        assignedTo: { select: { name: true, avatar: true } },
        deliveryDate: true,
        updatedAt: true,
      },
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    }),
    prisma.user.findMany({
      where: { role: "TECH" },
      select: { id: true, name: true },
    }),
    prisma.ticket.aggregate({
      _avg: { executionTime: true },
      where: {
        ...where,
        status: { in: ["DONE", "CLOSED"] },
        executionTime: { not: null },
      },
    }),
    prisma.ticket.groupBy({
      by: ["assignedToId"],
      where: {
        ...where,
        status: { in: ["DONE", "CLOSED"] },
        executionTime: { not: null },
        assignedToId: { not: null },
      },
      _avg: { executionTime: true },
    }),
    prisma.ticket.aggregate({
      _avg: { slaHours: true },
      where: { ...where, slaHours: { not: null } },
    }),
    prisma.ticket.count({
      where: {
        ...where,
        status: { in: ["DONE", "CLOSED"] },
        slaHours: { not: null },
        executionTime: { not: null },
        // execução acima do SLA (minutos > horas*60)
        // Prisma não permite comparação direta entre campos, então aproximamos via filter pós-query
      },
    }),
  ])

  const pageCount = Math.max(1, Math.ceil(totalCount / take))
  const countBy = (s: string) => stats.find((x) => x.status === s)?._count.status || 0
  const view = params.view === "kanban" ? "kanban" : "list"
  const created = params["created"] === "1"
  const avgResMin = Math.round(avgResolution._avg.executionTime || 0)
  const avgByTechDisplay = avgByTech
    .map((row) => {
      const tech = techs.find((t) => t.id === row.assignedToId)
      return { name: tech?.name || "—", minutes: Math.round(row._avg.executionTime || 0) }
    })
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 5)
  const slaAvgHours = Math.round(slaAvg._avg.slaHours || 0)
  // Como não há comparação direta campo-campo em Prisma count, recontamos via fetch mínimo
  const closedDoneTickets = await prisma.ticket.findMany({
    where: {
      ...where,
      status: { in: ["DONE", "CLOSED"] },
      slaHours: { not: null },
      executionTime: { not: null },
    },
    select: { slaHours: true, executionTime: true },
  })
  const slaBreachesCount = closedDoneTickets.filter(
    (t) => (t.executionTime || 0) > ((t.slaHours || 0) * 60)
  ).length
  const period = params.created === "last30" ? "last30" : "all"
  const last30Date = new Date()
  last30Date.setDate(last30Date.getDate() - 30)
  const [statsLast30] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      where: {
        ...(period === "last30" ? { createdAt: { gte: last30Date } } : {}),
      },
      _count: { status: true },
    }),
  ])
  const countByPeriod = (s: string) =>
    (period === "last30"
      ? statsLast30.find((x) => x.status === s)?._count.status
      : stats.find((x) => x.status === s)?._count.status) || 0
  const maxCountPeriod =
    Math.max(
      countByPeriod("OPEN"),
      countByPeriod("WAITING"),
      countByPeriod("IN_PROGRESS"),
      countByPeriod("DONE"),
      countByPeriod("CLOSED"),
      countByPeriod("CANCELLED"),
    ) || 1

  return (
    <div className="space-y-8">
      <TicketCreatedToast created={created} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Chamados</h1>
          <Badge variant="secondary" aria-label={`Total de chamados: ${totalCount}`}>{totalCount}</Badge>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4 mr-2" /> Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-primary-foreground sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Chamado</DialogTitle>
            </DialogHeader>
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 pt-4">
                <form action={createTicket} className="grid grid-cols-1 gap-4">
                  <Input name="title" label="Título" aria-label="Título" required />
                  <RichTextEditor
                    name="description"
                    label="Descrição"
                    placeholder="Descreva o problema, passos, contexto, links..."
                    defaultValue=""
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Anexos</div>
                    <TicketAttachmentsArea name="attachments" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Prioridade</div>
                    <Select name="priority" defaultValue="MEDIUM">
                      <SelectTrigger aria-label="Prioridade">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baixa</SelectItem>
                        <SelectItem value="MEDIUM">Média</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="CRITICAL">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Atribuir a</div>
                    <Select name="assignedToId">
                      <SelectTrigger aria-label="Responsável">
                        <SelectValue placeholder="Atribuir a" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem responsável</SelectItem>
                        {techs.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    {/* Campo de previsão removido: apenas técnicos definem previsões */}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <TicketSubmitButton label="Criar Chamado" />
                  </div>
                </form>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Gráfico por Status ({period === "last30" ? "Últimos 30 dias" : "Total"})</CardTitle>
          <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
            <Button asChild variant={period === "all" ? "default" : "ghost"} size="sm">
              <Link href={{ pathname: "/tickets", query: { ...params, created: undefined } }}>Total</Link>
            </Button>
            <Button asChild variant={period === "last30" ? "default" : "ghost"} size="sm">
              <Link href={{ pathname: "/tickets", query: { ...params, created: "last30" } }}>Últimos 30d</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "Abertos", key: "OPEN" },
            { label: "Em Espera", key: "WAITING" },
            { label: "Em Andamento", key: "IN_PROGRESS" },
            { label: "Concluídos", key: "DONE" },
            { label: "Fechados", key: "CLOSED" },
            { label: "Cancelados", key: "CANCELLED" },
          ].map((item) => {
            const count = countByPeriod(item.key)
            const pct = Math.round((count / maxCountPeriod) * 100)
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 w-full rounded bg-muted">
                  <div
                    className="h-2 rounded bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                    aria-label={`${item.label}: ${count}`}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </div>
          <CardDescription>Refine os resultados por status, prioridade e responsável</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/tickets" className="flex items-center justify-between gap-4 w-full">
            <div className="flex-1 min-w-[300px]">
              <Input
                name="q"
                placeholder="Buscar por título ou descrição"
                defaultValue={params.q || ""}
                aria-label="Buscar"
                startIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-[160px] shrink-0">
              <Select name="status" defaultValue={params.status || undefined}>
                <SelectTrigger aria-label="Status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Aberto</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="WAITING">Em Espera</SelectItem>
                  <SelectItem value="DONE">Concluído</SelectItem>
                  <SelectItem value="CLOSED">Fechado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px] shrink-0">
              <Select name="priority" defaultValue={params.priority || undefined}>
                <SelectTrigger aria-label="Prioridade" className="w-full">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="CRITICAL">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isUser ? null : (
              <div className="w-[200px] shrink-0">
                <Select name="assignedTo" defaultValue={assignedPref}>
                  <SelectTrigger aria-label="Responsável" className="w-full">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Atribuídos a mim</SelectItem>
                    <SelectItem value="any">Qualquer responsável</SelectItem>
                    <SelectItem value="unassigned">Sem responsável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild variant="ghost">
                <Link href="/tickets" aria-label="Limpar filtros">Limpar</Link>
              </Button>
              <Button type="submit" variant="soft-edit">Aplicar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countBy("OPEN")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countBy("WAITING")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countBy("IN_PROGRESS")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countBy("CLOSED")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countBy("DONE")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countBy("CANCELLED")}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio (geral)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgResMin > 0 ? `${Math.floor(avgResMin / 60)}h ${avgResMin % 60}m` : "—"}
            </div>
            <CardDescription>Chamados concluídos/fechados</CardDescription>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio por Técnico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {avgByTechDisplay.length === 0 && (
              <div className="text-sm text-muted-foreground">Sem dados para técnicos.</div>
            )}
            {avgByTechDisplay.map((row) => (
              <div key={row.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.name}</span>
                <span className="font-medium">
                  {row.minutes > 0 ? `${Math.floor(row.minutes / 60)}h ${row.minutes % 60}m` : "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaAvgHours > 0 ? `${slaAvgHours}h` : "—"}</div>
            <CardDescription>Entre tickets com SLA definido</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fora do SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaBreachesCount}</div>
            <CardDescription>Concluídos/fechados que excederam o SLA</CardDescription>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-between mt-4">
        <h2 className="text-sm font-medium text-muted-foreground">Visualização</h2>
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
          <Button
            asChild
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
          >
            <Link href={{ pathname: "/tickets", query: { ...params, view: "list" } }}>
              Lista
            </Link>
          </Button>
          <Button
            asChild
            variant={view === "kanban" ? "default" : "ghost"}
            size="sm"
          >
            <Link href={{ pathname: "/tickets", query: { ...params, view: "kanban" } }}>
              Kanban
            </Link>
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <TicketList tickets={tickets} page={page} pageCount={pageCount} params={params} />
      ) : (
        <TicketKanban
          tickets={tickets}
          currentUserRole={session.user.role}
          currentUserName={session.user.name || "Você"}
        />
      )}

      <Separator />

      <Suspense fallback={
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      }>
      </Suspense>
    </div>
  )
}

