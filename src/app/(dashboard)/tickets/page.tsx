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
import { SegmentedTabs } from "@/components/ui/tabs"

type SearchParams = {
  status?: "OPEN" | "IN_PROGRESS" | "WAITING" | "DONE" | "CLOSED" | "CANCELLED"
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  q?: string
  page?: string
  assignedTo?: "me" | "any" | "unassigned"
  view?: "list" | "kanban"
  created?: string
  tab?: "tickets" | "metrics"
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
  const tab = params.tab === "metrics" ? "metrics" : "tickets"

  const where: Record<string, unknown> = {}
  if (params.status) where.status = params.status
  if (params.priority) where.priority = params.priority
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ]
  }
  const isAdmin = session.user.role === "ADMIN"
  const isTech = session.user.role === "TECH"
  const isUser = session.user.role === "USER"
  const assignedPref = params.assignedTo ?? (isAdmin ? "any" : "me")
  if (isUser) {
    where.customerId = session.user.id
  } else if (isTech) {
    // Técnicos sempre visualizam apenas os próprios chamados
    where.assignedToId = session.user.id
  } else {
    // Admin pode alternar o filtro
    if (assignedPref === "me") where.assignedToId = session.user.id
    if (assignedPref === "unassigned") where.assignedToId = null
  }

  const [tickets, totalCount, techs] = await Promise.all([
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
    prisma.user.findMany({
      where: { role: "TECH" },
      select: { id: true, name: true },
    }),
  ])

  const pageCount = Math.max(1, Math.ceil(totalCount / take))
  const view = params.view === "kanban" ? "kanban" : "list"
  const created = params["created"] === "1"
  let metrics: {
    avgResMin: number
    avgByTechDisplay: { name: string; minutes: number }[]
    slaAvgHours: number
    slaBreachesCount: number
    period: "all" | "last30"
    countByPeriod: (s: string) => number
    maxCountPeriod: number
    countBy: (s: string) => number
  } | null = null

  if (!isUser && tab === "metrics") {
    const [stats, avgResolution, avgByTech, slaAvg] = await Promise.all([
      prisma.ticket.groupBy({ by: ["status"], where, _count: { status: true } }),
      prisma.ticket.aggregate({
        _avg: { executionTime: true },
        where: { ...where, status: { in: ["DONE", "CLOSED"] }, executionTime: { not: null } },
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
      prisma.ticket.aggregate({ _avg: { slaHours: true }, where: { ...where, slaHours: { not: null } } }),
    ])
    const closedDoneTickets = await prisma.ticket.findMany({
      where: { ...where, status: { in: ["DONE", "CLOSED"] }, slaHours: { not: null }, executionTime: { not: null } },
      select: { slaHours: true, executionTime: true },
    })
    const slaBreachesCount = closedDoneTickets.filter(
      (t) => (t.executionTime || 0) > ((t.slaHours || 0) * 60),
    ).length
    const avgResMin = Math.round(avgResolution._avg.executionTime || 0)
    const avgByTechDisplay = avgByTech
      .map((row) => {
        const tech = techs.find((t) => t.id === row.assignedToId)
        return { name: tech?.name || "—", minutes: Math.round(row._avg.executionTime || 0) }
      })
      .sort((a, b) => a.minutes - b.minutes)
      .slice(0, 5)
    const slaAvgHours = Math.round(slaAvg._avg.slaHours || 0)
    const period = params.created === "last30" ? "last30" : "all"
    const last30Date = new Date()
    last30Date.setDate(last30Date.getDate() - 30)
    const [statsLast30] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        where: { ...(period === "last30" ? { createdAt: { gte: last30Date } } : {}) },
        _count: { status: true },
      }),
    ])
    const countBy = (s: string) => stats.find((x) => x.status === s)?._count.status || 0
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
    metrics = { avgResMin, avgByTechDisplay, slaAvgHours, slaBreachesCount, period, countByPeriod, maxCountPeriod, countBy }
  }

  return (
    <div className="space-y-8">
      <TicketCreatedToast created={created} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Chamados</h1>
          <Badge variant="secondary" aria-label={`Total de chamados: ${totalCount}`}>{totalCount}</Badge>
        </div>
        {/* Abas: Chamados / Métricas */}
        <SegmentedTabs
          value={tab}
          items={[
            { label: "Chamados", value: "tickets", href: `/tickets?${new URLSearchParams({ ...params, tab: "tickets" } as Record<string, string>).toString()}` },
            { label: "Métricas", value: "metrics", href: `/tickets?${new URLSearchParams({ ...params, tab: "metrics" } as Record<string, string>).toString()}`, disabled: isUser },
          ]}
        />
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

      {tab === "metrics" && !isUser ? (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Gráfico por Status ({metrics?.period === "last30" ? "Últimos 30 dias" : "Total"})</CardTitle>
          <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
            <Button asChild variant={(metrics?.period || "all") === "all" ? "default" : "ghost"} size="sm">
              <Link href={{ pathname: "/tickets", query: { ...params, created: undefined } }}>Total</Link>
            </Button>
            <Button asChild variant={(metrics?.period || "all") === "last30" ? "default" : "ghost"} size="sm">
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
            const count = metrics?.countByPeriod(item.key) || 0
            const pct = Math.round((count / (metrics?.maxCountPeriod || 1)) * 100)
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
      ) : null}
      {tab === "metrics" && !isUser ? (
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
            {isAdmin ? (
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
            ) : null}
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild variant="ghost">
                <Link href="/tickets" aria-label="Limpar filtros">Limpar</Link>
              </Button>
              <Button type="submit" variant="soft-edit">Aplicar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      ) : null}

      {tab === "metrics" && !isUser ? (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.countBy("OPEN") || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.countBy("WAITING") || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.countBy("IN_PROGRESS") || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.countBy("CLOSED") || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.countBy("DONE") || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.countBy("CANCELLED") || 0}</div>
          </CardContent>
        </Card>
      </div>
      ) : null}

      {tab === "metrics" && !isUser ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio (geral)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics && metrics.avgResMin > 0 ? `${Math.floor(metrics.avgResMin / 60)}h ${metrics.avgResMin % 60}m` : "—"}
            </div>
            <CardDescription>Chamados concluídos/fechados</CardDescription>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio por Técnico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(!metrics || metrics.avgByTechDisplay.length === 0) && (
              <div className="text-sm text-muted-foreground">Sem dados para técnicos.</div>
            )}
            {metrics?.avgByTechDisplay.map((row) => (
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
      ) : null}

      {tab === "metrics" && !isUser ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics && metrics.slaAvgHours > 0 ? `${metrics.slaAvgHours}h` : "—"}</div>
            <CardDescription>Entre tickets com SLA definido</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fora do SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.slaBreachesCount || 0}</div>
            <CardDescription>Concluídos/fechados que excederam o SLA</CardDescription>
          </CardContent>
        </Card>
      </div>
      ) : null}
      {tab === "tickets" ? (
      <div className="flex items-center justify-between mt-4">
        <h2 className="text-sm font-medium text-muted-foreground">Visualização</h2>
        <SegmentedTabs
          value={view}
          items={[
            { label: "Lista", value: "list", href: `/tickets?${new URLSearchParams({ ...params, view: "list", tab: "tickets" } as Record<string, string>).toString()}` },
            { label: "Kanban", value: "kanban", href: `/tickets?${new URLSearchParams({ ...params, view: "kanban", tab: "tickets" } as Record<string, string>).toString()}` },
          ]}
        />
      </div>
      ) : null}

      {tab === "tickets" && view === "list" ? (
        <TicketList tickets={tickets} page={page} pageCount={pageCount} params={params} />
      ) : null}
      {tab === "tickets" && view === "kanban" ? (
        <TicketKanban
          tickets={tickets}
          currentUserRole={session.user.role}
          currentUserName={session.user.name || "Você"}
        />
      ) : null}

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

