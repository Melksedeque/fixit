"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface TicketAttachmentsAreaProps {
  name?: string
}

export function TicketAttachmentsArea({ name = "attachments" }: TicketAttachmentsAreaProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [filesCount, setFilesCount] = useState(0)

  const mergeFiles = (incoming: File[]) => {
    const input = inputRef.current
    if (!input || incoming.length === 0) return

    const existing = input.files ? Array.from(input.files) : []
    const all = [...existing, ...incoming]
    const dt = new DataTransfer()
    all.forEach((file) => dt.items.add(file))
    input.files = dt.files
    setFilesCount(all.length)
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ files?: File[] }>
      const files = custom.detail?.files || []
      if (files.length > 0) {
        mergeFiles(files)
      }
    }

    window.addEventListener("fixit:ticket-attachments-from-paste", handler as EventListener)
    return () => {
      window.removeEventListener("fixit:ticket-attachments-from-paste", handler as EventListener)
    }
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    setFilesCount(files ? files.length : 0)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-background/40 px-3 py-6 text-center transition-colors",
        isDragging && "border-primary bg-primary/5",
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        name={name}
        multiple
        accept="image/*"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={handleChange}
      />
      <p className="text-sm font-medium text-foreground">Arraste e solte imagens aqui</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        ou clique para selecionar arquivos do seu computador.
      </p>
      {filesCount > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {filesCount} arquivo{filesCount > 1 ? "s" : ""} selecionado
          {filesCount > 1 ? "s" : ""}.
        </p>
      )}
    </div>
  )
}

