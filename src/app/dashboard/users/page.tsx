import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus, Edit2 } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth/config"
import { DeleteUserButton } from "@/components/users/delete-user-button"

export default async function UsersPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
        {isAdmin && (
            <Button asChild>
                <Link href="/dashboard/users/new">
                    <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                </Link>
            </Button>
        )}
      </div>
      
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Função</TableHead>
              {isAdmin && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                {isAdmin && (
                    <TableCell className="text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/users/${user.id}`}>
                            <Edit2 className="h-4 w-4" />
                        </Link>
                    </Button>
                    {user.id !== session?.user?.id && (
                        <DeleteUserButton userId={user.id} userName={user.name} />
                    )}
                    </TableCell>
                )}
              </TableRow>
            ))}
            {users.length === 0 && (
                <TableRow>
                    <TableCell colSpan={isAdmin ? 4 : 3} className="text-center h-24 text-muted-foreground">
                        Nenhum usuário encontrado.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
