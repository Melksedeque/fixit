"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Mail, Phone, Eye } from "lucide-react"
import { DeleteUserButton } from "@/components/users/delete-user-button"
import { UserForm } from "@/components/users/user-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Role } from "@prisma/client"
import { useRouter } from "next/navigation"
import { getUserInitials } from "@/lib/utils/user"

interface User {
  id: string
  name: string
  email: string
  role: Role
  whatsapp: string | null
  avatar: string | null
  createdAt: Date
}

interface UsersTableProps {
  users: User[]
  currentUser: {
    id: string
    role: string
  }
}

export function UsersTable({ users, currentUser }: UsersTableProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const isAdmin = currentUser?.role === "ADMIN"

  const handleSuccess = () => {
    setIsCreateOpen(false)
    setEditingUser(null)
    router.refresh()
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return phone
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-primary-foreground">
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
              </DialogHeader>
              <UserForm
                onSuccess={handleSuccess}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border border-border bg-(--card-surface) overflow-hidden">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-(--card-surface)/95 backdrop-blur supports-backdrop-filter:bg-(--card-surface)/80">
            <TableRow className="border-border">
              <TableHead className="px-5">Nome</TableHead>
              <TableHead className="px-5">E-mail</TableHead>
              <TableHead className="px-5">WhatsApp</TableHead>
              <TableHead className="px-5">Função</TableHead>
              {isAdmin && <TableHead className="text-right px-5">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user.id} 
                className="cursor-pointer hover:bg-muted/40 transition-colors duration-200 ease-out odd:bg-muted/30"
                onClick={() => router.push(`/users/${user.id}`)}
              >
                <TableCell className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="p-5">
                  <a
                    href={`mailto:${user.email}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Enviar e-mail para ${user.email}`}
                    className="flex items-center gap-2 hover:underline hover:text-primary w-fit"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {user.email}
                  </a>
                </TableCell>
                <TableCell className="p-5">
              {user.whatsapp ? (
                <a
                  href={`https://wa.me/55${user.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Abrir WhatsApp para ${formatPhone(user.whatsapp)}`}
                  className="flex items-center gap-2 hover:underline hover:text-green-600 w-fit"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {formatPhone(user.whatsapp)}
                </a>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
                <TableCell className="p-5">
                  {user.role === "ADMIN" ? (
                    <Badge variant="outline" className="border-purple-400 bg-purple-400/15 text-purple-400">
                      ADMIN
                    </Badge>
                  ) : user.role === "TECH" ? (
                    <Badge variant="outline" className="border-green-400 bg-green-400/15 text-green-400">
                      TECH
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-sky-400 bg-sky-400/15 text-sky-400">
                      USER
                    </Badge>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right p-5">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="soft-success"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                         <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="soft-edit"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingUser(user)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {user.id !== currentUser.id && (
                        <DeleteUserButton userId={user.id} userName={user.name} />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center h-24 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[600px] bg-primary-foreground">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              initialData={editingUser}
              onSuccess={handleSuccess}
              onCancel={() => setEditingUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
