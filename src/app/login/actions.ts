'use server'

import { prisma } from "@/lib/prisma"

export async function checkEmail(email: string) {
  if (!email) return { exists: false }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    })
    
    return { exists: !!user }
  } catch (error) {
    console.error('Error checking email:', error)
    return { exists: false, error: 'Failed to check email' }
  }
}
