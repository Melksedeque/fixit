import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { Logo } from '@/components/ui/logo'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    if ((session.user as any).mustChangePassword) {
      redirect('/change-password')
    }
    redirect('/dashboard')
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex justify-center mb-4">
          <Logo width={180} className="" />
        </div>
      </div>
      <LoginForm />
    </div>
  )
}
