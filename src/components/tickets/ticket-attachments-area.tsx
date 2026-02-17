"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TicketAttachmentsAreaProps {
  name?: string
}

type AttachmentStatus = "uploading" | "uploaded" | "error"

type AttachmentItem = {
  id: string
  file: File
  previewUrl: string
  progress: number
  status: AttachmentStatus
  url?: string
}

export function TicketAttachmentsArea({ name = "attachments" }: TicketAttachmentsAreaProps) {
  const [items, setItems] = useState<AttachmentItem[]>([])

  const createIdForFile = (file: File) => {
    return `${file.name}-${file.size}-${file.lastModified}-${file.type}-${Math.random()
      .toString(16)
      .slice(2)}`
  }

  const updateItem = useCallback((id: string, patch: Partial<AttachmentItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const startUpload = useCallback(
    (id: string, file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const ac = new AbortController()
      const timer = window.setTimeout(() => ac.abort(), 30000)

      updateItem(id, { status: "uploading", progress: 10 })
      console.log("[attachments] upload start", { name: file.name, size: file.size, id })

      fetch("/api/attachments", {
        method: "POST",
        body: formData,
        signal: ac.signal,
      })
        .then(async (res) => {
          window.clearTimeout(timer)
          if (!res.ok) {
            updateItem(id, { status: "error" })
            console.error("[attachments] upload failed", { name: file.name, status: res.status, id })
            return
          }
          const payload = (await res.json()) as { url?: string }
          if (payload.url) {
            updateItem(id, { url: payload.url, progress: 100, status: "uploaded" })
            console.log("[attachments] upload success", { name: file.name, url: payload.url, id })
          } else {
            updateItem(id, { status: "error" })
            console.error("[attachments] upload missing url", { name: file.name, id })
          }
        })
        .catch((error) => {
          window.clearTimeout(timer)
          updateItem(id, { status: "error" })
          console.error("[attachments] upload error", { name: file.name, error: String(error), id })
        })
    },
    [updateItem],
  )

  const processFiles = useCallback(
    (acceptedFiles: File[]) => {
      console.log("[attachments] processing files", { count: acceptedFiles.length })

      if (acceptedFiles.length === 0) {
        console.warn("[attachments] no files to process")
        return
      }

      const newItems: AttachmentItem[] = acceptedFiles.map((file) => {
        const id = createIdForFile(file)
        const previewUrl = URL.createObjectURL(file)
        console.log("[attachments] created item", { id, name: file.name, size: file.size })
        return {
          id,
          file,
          previewUrl,
          progress: 5,
          status: "uploading" as AttachmentStatus,
        }
      })

      setItems((prev) => {
        const next = [...prev, ...newItems]
        console.log("[attachments] updated items state", { 
          previousCount: prev.length, 
          newCount: newItems.length,
          totalCount: next.length 
        })
        return next
      })

      // Inicia uploads individualmente
      newItems.forEach(({ id, file }) => {
        console.log("[attachments] scheduling upload", { id, name: file.name })
        // Pequeno delay para evitar que todos iniciem exatamente ao mesmo tempo
        setTimeout(() => startUpload(id, file), Math.random() * 100)
      })
    },
    [startUpload],
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log("[attachments] onDrop triggered", { count: acceptedFiles.length })
      processFiles(acceptedFiles)
    },
    [processFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    noClick: false,
    noKeyboard: false,
  })

  const handleRemove = useCallback((id: string) => {
    console.log("[attachments] removing item", { id })
    
    setItems((prev) => {
      const target = prev.find((item) => item.id === id)
      const remaining = prev.filter((item) => item.id !== id)

      if (target) {
        URL.revokeObjectURL(target.previewUrl)
        
        // Se já foi enviado, remove do servidor
        if (target.url) {
          fetch("/api/attachments", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: target.url }),
          }).catch((err) => {
            console.error("[attachments] failed to delete from server", { id, error: err })
          })
        }
      }

      console.log("[attachments] item removed", { 
        id, 
        remainingCount: remaining.length 
      })
      return remaining
    })
  }, [])

  const handleRetry = useCallback(
    (id: string) => {
      console.log("[attachments] retrying upload", { id })
      
      setItems((prev) => {
        const target = prev.find((item) => item.id === id)
        if (!target) {
          console.warn("[attachments] retry failed - item not found", { id })
          return prev
        }

        const next = prev.map((item) =>
          item.id === id
            ? { ...item, status: "uploading" as AttachmentStatus, progress: 5, url: undefined }
            : item,
        )

        // Reinicia upload após atualizar estado
        setTimeout(() => startUpload(id, target.file), 100)

        return next
      })
    },
    [startUpload],
  )

  // Notifica componente pai sobre status
  useEffect(() => {
    const hasUploading = items.some((item) => item.status === "uploading")
    const hasError = items.some((item) => item.status === "error")

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("fixit:ticket-attachments-status", {
          detail: { hasUploading, hasError },
        }),
      )
    }
  }, [items])

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-background/40 px-3 py-6 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-background/60",
          isDragActive && "border-primary bg-primary/5",
        )}
      >
        <input {...getInputProps()} name={name} />
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? "Solte as imagens aqui..." : "Arraste e solte imagens aqui"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          ou clique para selecionar arquivos do seu computador.
        </p>
        {items.length > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {items.length} arquivo{items.length > 1 ? "s" : ""} selecionado
            {items.length > 1 ? "s" : ""}.
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
                <div className="text-[10px] text-muted-foreground">
                  {item.file.type || "imagem"} •{" "}
                  {Math.max(1, Math.round(item.file.size / 1024))} KB
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {item.status === "error"
                        ? "Erro ao enviar anexo"
                        : item.status === "uploading"
                        ? "Enviando anexo..."
                        : "Enviado"}
                    </span>
                    {item.status === "error" && (
                      <button
                        type="button"
                        className="ml-2 text-[10px] font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => handleRetry(item.id)}
                      >
                        Tentar novamente
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => handleRemove(item.id)}
                aria-label="Remover anexo"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden inputs para os arquivos enviados com sucesso */}
      {items
        .filter((item) => item.status === "uploaded" && item.url)
        .map((item) => (
          <input key={item.id} type="hidden" name="attachmentUrls" value={item.url!} />
        ))}
    </div>
  )
}
