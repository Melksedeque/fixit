import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserProfileLayout } from "@/components/users/user-profile-layout"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          ticketsCreated: true,
          ticketsAssigned: true,
        },
      },
    },
  })

  if (!user) redirect("/dashboard")

  const isTechOrAdmin = user.role === "ADMIN" || user.role === "TECH"
  const whereCondition = isTechOrAdmin ? { assignedToId: user.id } : { customerId: user.id }

  const [tickets, stats, executionStats] = await Promise.all([
    prisma.ticket.findMany({
      where: whereCondition,
      orderBy: { updatedAt: "desc" },
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
      by: ["status"],
      where: whereCondition,
      _count: { status: true },
    }),
    prisma.ticket.aggregate({
      _avg: { executionTime: true },
      where: { ...whereCondition, status: "DONE" },
    }),
  ])

  const avgExecutionTime = executionStats._avg.executionTime || 0
  const avgHours = Math.floor(avgExecutionTime / 60)
  const avgMinutes = Math.round(avgExecutionTime % 60)
  const avgTimeDisplay = avgHours > 0 ? `${avgHours}h ${avgMinutes}m` : `${avgMinutes}m`

  const totalTickets = isTechOrAdmin ? user._count.ticketsAssigned : user._count.ticketsCreated
  const openTickets = stats.find((s) => s.status === "OPEN")?._count.status || 0
  const inProgressTickets = stats.find((s) => s.status === "IN_PROGRESS")?._count.status || 0
  const doneTickets = stats.find((s) => s.status === "DONE")?._count.status || 0
  const completionRate = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0

  return (
    <UserProfileLayout
      title="Meu Perfil"
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
      isSelf
    />
  )
}
