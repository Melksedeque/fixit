'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendPasswordResetEmail } from '@/lib/notifications/email'

export async function checkEmail(email: string) {
  if (!email) return { exists: false }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    return { exists: !!user }
  } catch (error) {
    console.error('Error checking email:', error)
    return { exists: false, error: 'Failed to check email' }
  }
}

function generateTemporaryPassword() {
  try {
    if (globalThis.crypto && 'getRandomValues' in globalThis.crypto) {
      const bytes = new Uint32Array(8)
      globalThis.crypto.getRandomValues(bytes)
      const str = Array.from(bytes)
        .map((n) => n.toString(36))
        .join('')
      return str.replace(/[^a-z0-9]/gi, '').slice(0, 10)
    }
  } catch {}
  const str = Math.random().toString(36) + Math.random().toString(36)
  return str.replace(/[^a-z0-9]/gi, '').slice(0, 10)
}

export async function requestPasswordReset(email: string) {
  if (!email) {
    return { success: false, error: 'E-mail é obrigatório.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return { success: true }
    }

    const temporaryPassword = generateTemporaryPassword()
    const hash = await bcrypt.hash(temporaryPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        mustChangePassword: true,
      },
    })

    await sendPasswordResetEmail(
      { name: user.name, email: user.email },
      temporaryPassword
    )

    return { success: true }
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return {
      success: false,
      error: 'Não foi possível solicitar recuperação de senha.',
    }
  }
}
