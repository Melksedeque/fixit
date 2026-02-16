"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Ticket, Users, Settings, LogOut, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Logo } from "@/components/ui/logo"
import { AppIcon } from "@/components/ui/app-icon"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Chamados",
    href: "/tickets",
    icon: Ticket,
  },
  {
    title: "Usuários",
    href: "/users",
    icon: Users,
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("fixit:sidebar:collapsed") === "true"
    } catch {
      return false
    }
  })

  useEffect(() => {
    const sync = () => {
      try {
        setCollapsed(localStorage.getItem("fixit:sidebar:collapsed") === "true")
      } catch {}
    }
    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<string>
      if (typeof ce.detail === "string") {
        setCollapsed(ce.detail === "true")
      } else {
        sync()
      }
    }
    sync()
    window.addEventListener("fixit:sidebar:collapsed", onCustom as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("fixit:sidebar:collapsed", onCustom as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <div className={cn("pb-12 h-screen border-r border-(--sidebar-border) bg-(--sidebar-bg) shadow-[-8px_0_24px_rgba(0,0,0,0.35)] relative transition-[width] duration-300 ease-in-out", className, collapsed ? "w-[72px]" : "w-[264px]")}>

      <div className="space-y-4 py-2">
        <div className="px-3 py-0">
          <div className={cn("mb-6 flex items-center h-18", collapsed && "justify-center")}>
              <Link href="/dashboard" className="flex items-center justify-center">
                  {collapsed ? (
                    <AppIcon size={40} className="" />
                  ) : (
                    <Logo className="w-full pt-2 px-4" />
                  )}
              </Link>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-[background,color,transform] duration-200 ease-out",
                  pathname === item.href 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-(--shadow-glow-brand-soft) hover:text-primary-foreground" 
                    : "text-blue-100 hover:bg-blue-900/50 hover:text-white",
                  collapsed && "justify-center px-0"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary-foreground" : "text-blue-200")} />
                  {!collapsed && item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 px-3 w-full">
          <Button variant="soft-destructive" className={cn(
            "mt-6 flex items-center justify-start h-10 w-full",
            collapsed && "justify-center")} onClick={() => signOut()}>
            <LogOut className="h-5 w-5" />
            {!collapsed && "Sair"}
          </Button>
      </div>
    </div>
  )
}

export function MobileSidebar() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                    <PanelLeft className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-secondary border-blue-900/50 text-white">
                <SheetHeader className="px-6 py-4 border-b border-(--sidebar-border)">
                    <SheetTitle>
                        <Logo width={100} className="brightness-0 invert" />
                    </SheetTitle>
                </SheetHeader>
                <div className="px-3 py-4">
                    <div className="space-y-1">
                        {navItems.map((item) => (
                        <Button
                            key={item.href}
                            variant="ghost"
                            className={cn(
                            "w-full justify-start transition-colors",
                            pathname === item.href 
                                ? "bg-[#48c9b0] text-[#0b1121] hover:bg-[#48c9b0]/90 font-medium" 
                                : "text-blue-100 hover:bg-[#11223b] hover:text-white"
                            )}
                            asChild
                            onClick={() => setOpen(false)}
                        >
                            <Link href={item.href}>
                            <item.icon className={cn("mr-2 h-4 w-4", pathname === item.href ? "text-[#0b1121]" : "text-blue-200")} />
                            {item.title}
                            </Link>
                        </Button>
                        ))}
                    </div>
                </div>
                 <div className="absolute bottom-4 w-full px-6">
                    <Button variant="ghost" className="w-full justify-start text-red-300 hover:text-red-200 hover:bg-red-900/20" onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
