"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface TicketAttachmentsAreaProps {
  name?: string
}

type AttachmentItem = {
  id: string
  file: File
  previewUrl: string
  progress: number
}

const fileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}-${file.type}`

export function TicketAttachmentsArea({ name = "attachments" }: TicketAttachmentsAreaProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [filesCount, setFilesCount] = useState(0)
  const [items, setItems] = useState<AttachmentItem[]>([])

  const createIdForFile = (file: File) => {
    return `${file.name}-${file.size}-${file.lastModified}-${file.type}-${Math.random()
      .toString(16)
      .slice(2)}`
  }

  const mergeFiles = useCallback((incoming: File[]) => {
    if (incoming.length === 0) return

    setItems((prev) => {
      const existingKeys = new Set(prev.map((item) => fileKey(item.file)))
      const newItems: AttachmentItem[] = []

      incoming.forEach((file) => {
        if (existingKeys.has(fileKey(file))) return
        const id = createIdForFile(file)
        const previewUrl = URL.createObjectURL(file)
        newItems.push({ id, file, previewUrl, progress: 10 })

        window.setTimeout(() => {
          setItems((current) =>
            current.map((item) => (item.id === id ? { ...item, progress: 100 } : item)),
          )
        }, 400)
      })

      const next = [...prev, ...newItems]

      const input = inputRef.current
      if (input) {
        const dt = new DataTransfer()
        next.forEach((item) => dt.items.add(item.file))
        input.files = dt.files
      }

      setFilesCount(next.length)
      return next
    })
  }, [])

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
  }, [mergeFiles])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    const list = files ? Array.from(files) : []
    mergeFiles(list)
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

    const files = Array.from(event.dataTransfer.files || []).filter((file) =>
      file.type.startsWith("image/"),
    )
    mergeFiles(files)
  }

  return (
    <div className="space-y-2">
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
      {items.length > 0 && (
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-border bg-background/80 p-2"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-sm bg-muted">
                <Image src={item.previewUrl} alt={item.file.name} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="truncate text-[11px] font-medium text-foreground">
                  {item.file.name}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.progress < 100 ? "Processando anexo..." : "Pronto para envio"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
