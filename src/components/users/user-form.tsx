"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { Role } from "@prisma/client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { createUser, updateUser } from "@/app/dashboard/users/actions"

const userSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  initialData?: {
    id: string
    name: string
    email: string
    role: Role
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const router = useRouter()
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || Role.USER,
      password: "",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form

  async function onSubmit(data: UserFormValues) {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("email", data.email)
    formData.append("role", data.role)
    if (data.password) {
      formData.append("password", data.password)
    }

    try {
      if (initialData) {
        const result: any = await updateUser(initialData.id, null, formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Usuário atualizado com sucesso!")
            if (onSuccess) {
              onSuccess()
            } else {
              router.push("/dashboard/users")
            }
        }
      } else {
        const result: any = await createUser(null, formData)
         if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Usuário criado com sucesso!")
            if (onSuccess) {
              onSuccess()
            } else {
              router.push("/dashboard/users")
            }
        }
      }
    } catch {
      toast.error("Ocorreu um erro ao salvar o usuário.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
            <Input
                label="Nome"
                {...register("name")}
                disabled={isSubmitting}
            />
            {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
        </div>
        
        <div className="space-y-2">
            <Input
                label="E-mail"
                type="email"
                {...register("email")}
                disabled={isSubmitting}
            />
             {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
        </div>

        <div className="space-y-2">
            <Input
                label={initialData ? "Senha (opcional)" : "Senha"}
                type="password"
                {...register("password")}
                disabled={isSubmitting}
            />
             {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
        </div>

        <div className="space-y-2">
          <Select
            disabled={isSubmitting}
            onValueChange={(value) => setValue("role", value as Role)}
            defaultValue={watch("role")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Role.ADMIN}>Administrador</SelectItem>
              <SelectItem value={Role.TECH}>Técnico</SelectItem>
              <SelectItem value={Role.USER}>Usuário</SelectItem>
            </SelectContent>
          </Select>
           {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onCancel ? onCancel() : router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Salvar Alterações" : "Criar Usuário"}
        </Button>
      </div>
    </form>
  )
}
