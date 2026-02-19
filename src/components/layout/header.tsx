import { MobileSidebar } from './sidebar'
import { UserNav } from './user-nav'
import { auth } from '@/lib/auth/config'
import { SidebarToggleButton } from './sidebar-toggle-button'

export async function Header() {
  const session = await auth()
  const user = session?.user
  const role = user?.role ?? null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-md supports-backdrop-filter:bg-background/60 shadow-(--shadow-e2-main)">
      <div className="flex h-16 items-center px-3 md:pr-6">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <MobileSidebar userRole={role ?? undefined} />
          </div>
          <div className="hidden md:flex">
            <SidebarToggleButton />
          </div>
        </div>
        <div className="flex-1" />

        <div className="ml-auto flex items-center space-x-4">
          {user && <UserNav user={user} />}
        </div>
      </div>
    </header>
  )
}
