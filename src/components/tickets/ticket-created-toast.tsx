"use client"

import { useEffect } from "react"
import { toast } from "sonner"

interface TicketCreatedToastProps {
  created?: boolean
}

export function TicketCreatedToast({ created }: TicketCreatedToastProps) {
  useEffect(() => {
    if (created) {
      toast.success("Chamado criado com sucesso")
    }
  }, [created])

  return null
}

