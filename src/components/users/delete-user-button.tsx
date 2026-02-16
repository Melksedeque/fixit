"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteUser } from "@/app/(dashboard)/users/actions"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteUserButtonProps {
  userId: string
  userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result: { success?: boolean; error?: string } = await deleteUser(userId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Usuário ${userName} excluído com sucesso.`)
        router.refresh()
      }
    } catch {
      toast.error("Erro ao excluir usuário.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="soft-destructive" size="icon" className="h-8 w-8">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o usuário <strong>{userName}</strong>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
