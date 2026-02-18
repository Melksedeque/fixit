"use server"

import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { put, del } from "@vercel/blob"

const UserSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "TECH", "USER"]),
  whatsapp: z.string().optional(),
  removeAvatar: z.boolean().optional(),
})

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

export async function createUser(_prevState: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Não autorizado" }
  }

  const parsed = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    whatsapp: formData.get("whatsapp") || undefined,
    removeAvatar: formData.get("removeAvatar") === "true",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const data = parsed.data

  if (!data.password) {
    return { error: "Senha é obrigatória para criação de usuário." }
  }

  const passwordHash = await bcrypt.hash(data.password, 10)

  let avatarUrl: string | null = null
  const avatarFile = formData.get("avatar")

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_SIZE_BYTES) {
      return { error: "Imagem muito grande. Tamanho máximo de 5MB." }
    }

    const safeName =
      avatarFile.name.replace(/[^a-zA-Z0-9.\-]/g, "_") ||
      `avatar-${Date.now().toString(16)}`
    const pathname = `users/avatars/${Date.now()}-${safeName}`

    const blob = await put(pathname, avatarFile, {
      access: "public",
      addRandomSuffix: true,
      contentType: avatarFile.type || "image/jpeg",
    })

    avatarUrl = blob.url
  }

  try {
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: passwordHash,
        role: data.role,
        whatsapp: data.whatsapp || null,
        avatar: avatarUrl,
      },
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { error: "E-mail já está em uso." }
    }
    return { error: "Erro ao criar usuário." }
  }
}

export async function updateUser(
  userId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Não autorizado" }
  }

  const parsed = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    whatsapp: formData.get("whatsapp") || undefined,
    removeAvatar: formData.get("removeAvatar") === "true",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const data = parsed.data

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    return { error: "Usuário não encontrado." }
  }

  let passwordToSave = existing.password
  if (data.password) {
    passwordToSave = await bcrypt.hash(data.password, 10)
  }

  let avatarValue = existing.avatar
  const avatarFile = formData.get("avatar")

  if (data.removeAvatar === true) {
    avatarValue = null
    if (existing.avatar) {
      try {
        await del(existing.avatar)
      } catch {}
    }
  } else if (avatarFile instanceof File && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_SIZE_BYTES) {
      return { error: "Imagem muito grande. Tamanho máximo de 5MB." }
    }

    const safeName =
      avatarFile.name.replace(/[^a-zA-Z0-9.\-]/g, "_") ||
      `avatar-${Date.now().toString(16)}`
    const pathname = `users/avatars/${Date.now()}-${safeName}`

    const blob = await put(pathname, avatarFile, {
      access: "public",
      addRandomSuffix: true,
      contentType: avatarFile.type || "image/jpeg",
    })

    avatarValue = blob.url

    if (existing.avatar) {
      try {
        await del(existing.avatar)
      } catch {}
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        password: passwordToSave,
        role: data.role,
        whatsapp: data.whatsapp || null,
        avatar: avatarValue,
      },
    })

    revalidatePath("/users")
    revalidatePath(`/users/${userId}`)
    revalidatePath("/profile")

    return { success: true }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { error: "E-mail já está em uso." }
    }
    return { error: "Erro ao atualizar usuário." }
  }
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Não autorizado" }
  }

  if (session.user.id === userId) {
    return { error: "Você não pode excluir seu próprio usuário." }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/users")
    revalidatePath("/profile")

    return { success: true }
  } catch {
    return { error: "Erro ao excluir usuário." }
  }
}

