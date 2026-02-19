'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export type ChangePasswordState = {
  error?: string
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Não autorizado.' }
  }

  const newPassword = formData.get('newPassword')
  const confirmPassword = formData.get('confirmPassword')

  if (
    !newPassword ||
    typeof newPassword !== 'string' ||
    newPassword.length < 6
  ) {
    return { error: 'Nova senha deve ter pelo menos 6 caracteres.' }
  }

  if (!confirmPassword || typeof confirmPassword !== 'string') {
    return { error: 'Confirme a nova senha.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'As senhas não conferem.' }
  }

  const hash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      password: hash,
      mustChangePassword: false,
    },
  })

  redirect('/dashboard')
}
