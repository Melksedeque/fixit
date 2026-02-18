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
      if (token.sub && session.user) {
        session.user.id = token.sub
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = user.role
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
