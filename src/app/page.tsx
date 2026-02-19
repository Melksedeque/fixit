import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    if ((session.user as any).mustChangePassword) {
      redirect('/change-password')
    }
    redirect('/dashboard')
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <main className="flex flex-col items-center gap-8 text-center p-8 max-w-2xl">
        <h1>
          <Logo width={300} className="" />
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema de chamados focado em comunicação rápida e gestão ágil.
        </p>
        <div className="flex gap-4 mt-8">
          <Button asChild size="lg" className="font-bold text-lg h-12 px-8">
            <Link href="/login">
              Acessar Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
