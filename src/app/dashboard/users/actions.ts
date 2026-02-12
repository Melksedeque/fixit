"use server"

import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Prisma, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { put } from "@vercel/blob"

const userSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
  whatsapp: z.string().optional(),
})

type ActionState = {
  error?: string
  success?: boolean
}

async function saveFile(file: File | null): Promise<string | undefined> {
  if (!file || !(file instanceof File) || file.size === 0) return undefined

  // Tenta usar Vercel Blob se o token estiver configurado
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      console.log("Iniciando upload para Vercel Blob...")
      const filename = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
      const blob = await put(filename, file, {
        access: 'public',
      })
      console.log("Upload para Vercel Blob concluído:", blob.url)
      return blob.url
    } catch (error) {
      console.error("Erro ao fazer upload para o Vercel Blob:", error)
      console.log("Tentando fallback para armazenamento local...")
      // Não lança erro, deixa cair no fallback abaixo
    }
  } else {
    console.log("Token do Vercel Blob não encontrado. Usando armazenamento local.")
  }

  // Fallback para sistema de arquivos local
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), "public/uploads/users")
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const extension = file.name.split(".").pop()
    const fileName = `${randomUUID()}.${extension}`
    const filePath = path.join(uploadDir, fileName)

    fs.writeFileSync(filePath, buffer)
    console.log("Arquivo salvo localmente:", filePath)

    return `/uploads/users/${fileName}`
  } catch (error) {
    console.error("Erro ao salvar arquivo localmente:", error)
    return undefined
  }
}

export async function createUser(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const session = await auth()
  
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem criar usuários." }
  }

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    whatsapp: formData.get("whatsapp") || undefined,
  }

  const validatedFields = userSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Dados inválidos. Verifique os campos." }
  }

  const { name, email, password, role, whatsapp } = validatedFields.data

  if (!password || password.length < 6) {
      return { error: "A senha deve ter no mínimo 6 caracteres." }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: "Este e-mail já está cadastrado." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  
  const file = formData.get("avatar") as File | null
  const avatarUrl = await saveFile(file)

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        whatsapp,
        avatar: avatarUrl,
      },
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return { error: error instanceof Error ? error.message : "Erro ao criar usuário." }
  }

  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function updateUser(id: string, prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const session = await auth()
  
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem editar usuários." }
  }

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    whatsapp: formData.get("whatsapp") || undefined,
  }

  const validatedFields = userSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Dados inválidos. Verifique os campos." }
  }

  const { name, email, password, role, whatsapp } = validatedFields.data

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser && existingUser.id !== id) {
    return { error: "Este e-mail já está em uso por outro usuário." }
  }

  const dataToUpdate: Prisma.UserUpdateInput = {
    name,
    email,
    role,
    whatsapp,
  }

  if (password && password.length >= 6) {
    dataToUpdate.password = await bcrypt.hash(password, 10)
  }

  const file = formData.get("avatar") as File | null
  const avatarUrl = await saveFile(file)
  
  if (avatarUrl) {
    dataToUpdate.avatar = avatarUrl
  }

  try {
    await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return { error: error instanceof Error ? error.message : "Erro ao atualizar usuário." }
  }

  revalidatePath("/dashboard/users")
  revalidatePath(`/dashboard/users/${id}`)
  return { success: true }
}

export async function deleteUser(id: string) {
  const session = await auth()
  
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem excluir usuários." }
  }

  if (session.user.id === id) {
      return { error: "Você não pode excluir sua própria conta." }
  }

  try {
    await prisma.user.delete({
      where: { id },
    })
    revalidatePath("/dashboard/users")
    return { success: true }
  } catch {
    return { error: "Erro ao excluir usuário." }
  }
}
