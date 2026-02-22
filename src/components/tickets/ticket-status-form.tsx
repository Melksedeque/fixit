'use client'

import { useState, useTransition, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { updateStatus } from '@/app/(dashboard)/tickets/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'CANCELLED'

interface TicketStatusFormProps {
  ticketId: string
  currentStatus: TicketStatus
}

export function TicketStatusForm({
  ticketId,
  currentStatus,
}: TicketStatusFormProps) {
  const [status, setStatus] = useState<TicketStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData()
    formData.set('status', status)

    startTransition(async () => {
      try {
        await updateStatus(ticketId, formData)
        toast.success('Status do chamado atualizado com sucesso.')
        router.refresh()
      } catch {
        toast.error('Erro ao atualizar status do chamado.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xs">
      <select
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value as TicketStatus)}
        aria-label="Status"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        disabled={isPending}
      >
        <option value="OPEN">Aberto</option>
        <option value="IN_PROGRESS">Em Andamento</option>
        <option value="WAITING">Aguardando</option>
        <option value="DONE">Concluído</option>
        <option value="CANCELLED">Cancelado</option>
      </select>
      <Button
        type="submit"
        variant="soft-edit"
        className="mt-2"
        disabled={isPending}
      >
        {isPending ? 'Atualizando...' : 'Atualizar Status'}
      </Button>
    </form>
  )
}
