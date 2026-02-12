import { UserForm } from "@/components/users/user-form"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth()
  const { id } = await params

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard/users")
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Editar Usuário</h2>
      </div>
      
      <div className="rounded-md border bg-white p-6">
        <UserForm initialData={user} />
      </div>
    </div>
  )
}
