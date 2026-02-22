'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { assignTicketToMe } from '@/app/(dashboard)/tickets/actions'

interface AssignTicketButtonProps {
  ticketId: string
}

export function AssignTicketButton({ ticketId }: AssignTicketButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    startTransition(async () => {
      try {
        await assignTicketToMe(ticketId)
        toast.success('Chamado assumido com sucesso.')
        router.refresh()
      } catch {
        toast.error('Erro ao assumir chamado.')
      }
    })
  }

  return (
    <Button
      type="button"
      variant="soft-success"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      Assumir Chamado
    </Button>
  )
}

