"use server"

import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
})

export async function createUser(prevState: any, formData: FormData) {
  const session = await auth()
  
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem criar usuários." }
  }

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
  }

  const validatedFields = userSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Dados inválidos. Verifique os campos." }
  }

  const { name, email, password, role } = validatedFields.data

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

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    })
  } catch (error) {
    return { error: "Erro ao criar usuário." }
  }

  revalidatePath("/dashboard/users")
  redirect("/dashboard/users")
}

export async function updateUser(id: string, prevState: any, formData: FormData) {
  const session = await auth()
  
  if (session?.user?.role !== "ADMIN") {
    return { error: "Apenas administradores podem editar usuários." }
  }

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
  }

  const validatedFields = userSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Dados inválidos. Verifique os campos." }
  }

  const { name, email, password, role } = validatedFields.data

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser && existingUser.id !== id) {
    return { error: "Este e-mail já está em uso por outro usuário." }
  }

  const dataToUpdate: any = {
    name,
    email,
    role,
  }

  if (password && password.length >= 6) {
    dataToUpdate.password = await bcrypt.hash(password, 10)
  }

  try {
    await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    })
  } catch (error) {
    return { error: "Erro ao atualizar usuário." }
  }

  revalidatePath("/dashboard/users")
  revalidatePath(`/dashboard/users/${id}`)
  redirect("/dashboard/users")
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
  } catch (error) {
    return { error: "Erro ao excluir usuário." }
  }
}
