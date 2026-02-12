import { MobileSidebar } from "./sidebar"
import { UserNav } from "./user-nav"
import { auth } from "@/lib/auth/config"

export async function Header() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8">
        <MobileSidebar />
        <div className="hidden md:flex">
             {/* Breadcrumbs could go here */}
        </div>
        <div className="md:hidden flex flex-1 justify-center">
             {/* Logo centered on mobile if needed, but usually in sheet */}
             {/* <Logo width={80} /> */}
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          {user && <UserNav user={user} />}
        </div>
      </div>
    </header>
  )
}
