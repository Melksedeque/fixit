'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { resendWelcomeEmail } from '@/app/(dashboard)/users/actions'

interface ResendWelcomeButtonProps {
  userId: string
  userName: string
}

export function ResendWelcomeButton({
  userId,
  userName,
}: ResendWelcomeButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      try {
        await resendWelcomeEmail(userId, new FormData())
        toast.success(`Boas-vindas reenviadas para ${userName}.`)
      } catch {
        toast.error('Erro ao reenviar e-mail de boas-vindas.')
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={handleClick}
      disabled={isPending}
    >
      <Send className="h-4 w-4" />
      <span>{isPending ? 'Reenviando...' : 'Reenviar boas-vindas'}</span>
    </Button>
  )
}

