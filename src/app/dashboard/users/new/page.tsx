import { UserForm } from "@/components/users/user-form"
import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"

export default async function NewUserPage() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard/users")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Novo Usuário</h2>
      </div>
      
      <div className="rounded-md border bg-white p-6">
        <UserForm />
      </div>
    </div>
  )
}
