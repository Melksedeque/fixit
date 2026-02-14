import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Filter, Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { TicketsView } from "@/app/dashboard/tickets/tickets-view"

type SearchParams = {
  status?: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED"
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  q?: string
  page?: string
  assignedTo?: "me" | "any"
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
  if (assignedPref === "me") {
    where.assignedToId = session.user.id
  }

  const [tickets, totalCount, stats] = await Promise.all([
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
  ])

  const pageCount = Math.max(1, Math.ceil(totalCount / take))
  const countBy = (s: string) => stats.find((x) => x.status === s)?._count.status || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Chamados</h1>
          <Badge variant="secondary" aria-label={`Total de chamados: ${totalCount}`}>{totalCount}</Badge>
        </div>
        <Button variant="soft-edit" asChild>
          <Link href="/dashboard/tickets/new">
            <Plus className="h-4 w-4 mr-2" /> Novo Chamado
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </div>
          <CardDescription>Refine os resultados por status, prioridade e responsável</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-5xl mx-auto">
          <form action="/dashboard/tickets" className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input name="q" placeholder="Buscar por título ou descrição" defaultValue={params.q || ""} aria-label="Buscar" />
            <Select name="status" defaultValue={params.status || undefined}>
              <SelectTrigger aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Aberto</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="DONE">Concluído</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select name="priority" defaultValue={params.priority || undefined}>
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
            <Select name="assignedTo" defaultValue={assignedPref}>
              <SelectTrigger aria-label="Responsável">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Atribuídos a mim</SelectItem>
                <SelectItem value="any">Qualquer responsável</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="soft-edit">Aplicar</Button>
          </form>
          </div>
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
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countBy("IN_PROGRESS")}</div>
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

      <TicketsView tickets={tickets} page={page} pageCount={pageCount} params={params} />

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
