"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Ticket } from "lucide-react"

interface TicketSubmitButtonProps {
  label?: string
}

export function TicketSubmitButton({ label = "Criar Chamado" }: TicketSubmitButtonProps) {
  const [hasUploading, setHasUploading] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ hasUploading?: boolean }>
      if (typeof custom.detail?.hasUploading === "boolean") {
        setHasUploading(custom.detail.hasUploading)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("fixit:ticket-attachments-status", handler as EventListener)
      return () => {
        window.removeEventListener("fixit:ticket-attachments-status", handler as EventListener)
      }
    }
  }, [])

  return (
    <Button type="submit" variant="soft-success" disabled={hasUploading}>
      <Ticket className="h-4 w-4 mr-2" />
      {hasUploading ? "Aguardando anexos..." : label}
    </Button>
  )
}

