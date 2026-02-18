import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

type LoginAttemptInfo = {
  attempts: number
  lastAttempt: number
}

const loginAttempts = new Map<string, LoginAttemptInfo>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60,
  },
  callbacks: {
    async session({ session, token }) {
      if (!session.user || !token.sub) {
        return session
      }

      session.user.id = token.sub
      session.user.role = token.role as string

      // Busca avatar diretamente do banco para garantir que o header
      // reflita sempre a foto mais recente, mesmo em sessões antigas.
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { avatar: true },
      })

      if (dbUser?.avatar) {
        session.user.image = dbUser.avatar
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = user as {
          id: string
          role: string
          avatar?: string | null
        }
        token.sub = dbUser.id
        token.role = dbUser.role
        if (dbUser.avatar && typeof dbUser.avatar === "string") {
          token.avatar = dbUser.avatar
        }
      }
      return token
    }
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data

          const existingAttempt = loginAttempts.get(email)
          const now = Date.now()
          if (existingAttempt && now - existingAttempt.lastAttempt < WINDOW_MS && existingAttempt.attempts >= MAX_ATTEMPTS) {
            console.warn(`Too many login attempts for ${email}`)
            return null
          }

          const user = await prisma.user.findUnique({ where: { email } })
          if (!user) return null
          
          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (passwordsMatch) {
            loginAttempts.delete(email)
            return user
          }

          const updated: LoginAttemptInfo = existingAttempt && now - existingAttempt.lastAttempt < WINDOW_MS
            ? { attempts: existingAttempt.attempts + 1, lastAttempt: now }
            : { attempts: 1, lastAttempt: now }
          loginAttempts.set(email, updated)
        }

        console.log('Invalid credentials')
        return null
      },
    }),
  ],
})
