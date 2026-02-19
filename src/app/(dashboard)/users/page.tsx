import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth/config"
import { UsersTable } from "@/components/users/users-table"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TECH")
  ) {
    redirect("/dashboard")
  }
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <UsersTable 
      users={users} 
      currentUser={{
        id: session?.user?.id || "",
        role: session?.user?.role || "USER"
      }}
    />
  )
}

