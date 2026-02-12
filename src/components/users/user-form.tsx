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
import { Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { createUser, updateUser } from "@/app/dashboard/users/actions"
import { useDropzone } from "react-dropzone"
import { useCallback, useState } from "react"
import VMasker from "vanilla-masker"
import Image from "next/image"

const userSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
  whatsapp: z.string().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  initialData?: {
    id: string
    name: string
    email: string
    role: Role
    whatsapp?: string | null
    avatar?: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initialData?.avatar || null)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || Role.USER,
      password: "",
      whatsapp: initialData?.whatsapp || "",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const masked = VMasker.toPattern(value, "(99) 99999-9999")
    setValue("whatsapp", masked)
  }

  async function onSubmit(data: UserFormValues) {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("email", data.email)
    formData.append("role", data.role)
    if (data.password) {
      formData.append("password", data.password)
    }
    if (data.whatsapp) {
      formData.append("whatsapp", data.whatsapp.replace(/\D/g, ""))
    }
    if (file) {
      formData.append("avatar", file)
    }

    try {
      if (initialData) {
        const result = await updateUser(initialData.id, null, formData)
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
        const result = await createUser(null, formData)
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
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          {...getRootProps()}
          className={`relative flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed bg-muted transition-colors hover:bg-muted/50 ${
            isDragActive ? "border-primary" : "border-muted-foreground/25"
          }`}
        >
          <input {...getInputProps()} />
          {preview ? (
            <>
              <Image
                src={preview}
                alt="Preview"
                fill
                className="rounded-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <span className="text-xs">Foto</span>
            </div>
          )}
        </div>
        {preview && (
           <Button
             type="button"
             variant="ghost"
             size="sm"
             className="text-destructive hover:text-destructive"
             onClick={(e) => {
               e.stopPropagation()
               setFile(null)
               setPreview(null)
             }}
           >
             <X className="mr-2 h-4 w-4" /> Remover foto
           </Button>
        )}
      </div>

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
            <Input
                label="WhatsApp"
                placeholder="(99) 99999-9999"
                {...register("whatsapp")}
                onChange={handleWhatsappChange}
                value={watch("whatsapp") || ""}
                disabled={isSubmitting}
            />
             {errors.whatsapp && (
                <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
            )}
        </div>

        <div className="space-y-2">
          <Select
            disabled={isSubmitting}
            onValueChange={(value) => setValue("role", value as Role)}
            value={watch("role")}
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
