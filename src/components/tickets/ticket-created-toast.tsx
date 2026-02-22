'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

interface TicketCreatedToastProps {
  created?: boolean
  deleted?: boolean
  filtersSummary?: string
}

export function TicketCreatedToast({
  created,
  deleted,
  filtersSummary,
}: TicketCreatedToastProps) {
  useEffect(() => {
    if (created) {
      toast.success('Chamado criado com sucesso')
    }
    if (deleted) {
      toast.success('Chamado excluído com sucesso')
    }
    if (filtersSummary) {
      toast.info(filtersSummary)
    }
  }, [created, deleted, filtersSummary])

  return null
}
