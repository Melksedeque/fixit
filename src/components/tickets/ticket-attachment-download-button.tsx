'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface TicketAttachmentDownloadButtonProps {
  url: string
}

export function TicketAttachmentDownloadButton({
  url,
}: TicketAttachmentDownloadButtonProps) {
  return (
    <Button
      asChild
      variant="soft-success"
      size="icon"
      onClick={() => {
        toast.info('Download do anexo iniciado.')
      }}
    >
      <a href={url} download aria-label="Baixar anexo">
        <Download className="h-4 w-4" />
      </a>
    </Button>
  )
}

