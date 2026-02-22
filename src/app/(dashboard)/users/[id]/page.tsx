import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { UserProfileLayout } from '@/components/users/user-profile-layout'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { ResendWelcomeButton } from '@/components/users/resend-welcome-button'

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (
    !session?.user ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'TECH')
  ) {
    redirect('/dashboard')
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ticketsCreated: true,
          ticketsAssigned: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const canManageUser = session.user.role === 'ADMIN'

  const isTechOrAdmin = user.role === 'ADMIN' || user.role === 'TECH'
  const whereCondition = isTechOrAdmin
    ? { assignedToId: user.id }
    : { customerId: user.id }

  const [tickets, stats, executionStats] = await Promise.all([
    prisma.ticket.findMany({
      where: whereCondition,
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    prisma.ticket.groupBy({
      by: ['status'],
      where: whereCondition,
      _count: { status: true },
    }),
    prisma.ticket.aggregate({
      _avg: { executionTime: true },
      where: { ...whereCondition, status: 'DONE' },
    }),
  ])

  const avgExecutionTime = executionStats._avg.executionTime || 0
  const avgHours = Math.floor(avgExecutionTime / 60)
  const avgMinutes = Math.round(avgExecutionTime % 60)
  const avgTimeDisplay =
    avgHours > 0 ? `${avgHours}h ${avgMinutes}m` : `${avgMinutes}m`

  const totalTickets = isTechOrAdmin
    ? user._count.ticketsAssigned
    : user._count.ticketsCreated
  const openTickets = stats.find((s) => s.status === 'OPEN')?._count.status || 0
  const inProgressTickets =
    stats.find((s) => s.status === 'IN_PROGRESS')?._count.status || 0
  const doneTickets = stats.find((s) => s.status === 'DONE')?._count.status || 0
  const completionRate = totalTickets
    ? Math.round((doneTickets / totalTickets) * 100)
    : 0

  return (
    <UserProfileLayout
      title="Detalhes do Usuário"
      backHref="/users"
      actions={
        canManageUser ? (
          <div className="flex items-center gap-2">
            <ResendWelcomeButton userId={user.id} userName={user.name} />
            <Button
              asChild
              variant="soft-edit"
              size="sm"
              className="flex items-center gap-2"
            >
              <Link href="/users">
                <Pencil className="h-4 w-4" />
                <span>Editar</span>
              </Link>
            </Button>
          </div>
        ) : undefined
      }
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        whatsapp: user.whatsapp,
        avatar: user.avatar,
        createdAt: user.createdAt,
      }}
      totalTickets={totalTickets}
      openTickets={openTickets}
      inProgressTickets={inProgressTickets}
      doneTickets={doneTickets}
      completionRate={completionRate}
      avgTimeDisplay={avgTimeDisplay}
      tickets={tickets}
      isTechOrAdmin={isTechOrAdmin}
    />
  )
}
