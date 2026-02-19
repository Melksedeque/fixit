'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings2, Shield, User2 } from 'lucide-react'
import { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { getUserInitials } from '@/lib/utils/user'

interface UserNavProps {
  user: User
}

export function UserNav({ user }: UserNavProps) {
  const initials = getUserInitials(user?.name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 rounded-full px-2 flex items-center gap-2 hover:bg-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold leading-tight">
                {user?.name}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-blue-700/60 bg-blue-900/60 px-2 py-0.5">
                <Shield
                  className="text-blue-400"
                  style={{ width: 12, height: 12 }}
                />
                <span className="text-[10px] font-medium text-blue-200">
                  {user?.role === 'ADMIN'
                    ? 'Administrador'
                    : user?.role === 'TECH'
                      ? 'Técnico'
                      : 'Usuário'}
                </span>
              </span>
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="z-60 w-56 p-0 rounded-md border border-[#ffffff1a] bg-(--card-surface) text-foreground shadow-(--shadow-e2-main) data-[state=open]:shadow-(--shadow-e3-main) backdrop-blur supports-backdrop-filter:bg-(--card-surface)/90"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="rounded-none cursor-pointer px-3 py-2 hover:bg-primary/10 focus:bg-primary/10">
            <Link href="/profile" className="flex items-center justify-center">
              <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 p-1 mr-2">
                <User2 className="h-4 w-4 text-primary" />
              </span>
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-none cursor-pointer px-3 py-2 hover:bg-primary/10 focus:bg-primary/10">
            <Link href="/settings" className="flex items-center justify-center">
              <span className="inline-flex items-center justify-center rounded-md bg-primary/10 border border-primary/20 p-1 mr-2">
                <Settings2 className="h-4 w-4 text-primary" />
              </span>
              Configurações
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-none cursor-pointer px-3 py-2 text-red-400 hover:bg-red-500/15 hover:text-red-300 focus:bg-red-500/15 focus:text-red-300"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <span className="inline-flex items-center justify-center rounded-md bg-red-500/10 border border-red-500/20 p-1 mr-2">
            <LogOut className="h-4 w-4" />
          </span>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
