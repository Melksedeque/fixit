import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { auth } from "@/lib/auth/config"

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = session?.user?.role ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="hidden md:block shrink-0" role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  )
}

