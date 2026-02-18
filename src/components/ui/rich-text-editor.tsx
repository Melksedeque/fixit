"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useQuill } from "react-quilljs"
import { cn } from "@/lib/utils"
import "quill/dist/quill.bubble.css"

interface RichTextEditorProps {
  name: string
  defaultValue?: string
  label?: string
  placeholder?: string
}

export function RichTextEditor({ name, defaultValue, label, placeholder }: RichTextEditorProps) {
  const [value, setValue] = useState(defaultValue || "")

  const { quill, quillRef } = useQuill({
    placeholder,
    theme: "bubble",
    modules: {
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
      ],
      clipboard: {
        matchVisual: false,
      },
    },
    formats: ["bold", "italic", "underline", "list", "link"],
  })

  useEffect(() => {
    if (quill && defaultValue) {
      quill.clipboard.dangerouslyPasteHTML(defaultValue)
    }
  }, [quill, defaultValue])

  useEffect(() => {
    if (!quill) return

    const handleTextChange = () => {
      const html = quill.root.innerHTML
      setValue(html === "<p><br></p>" ? "" : html)
    }

    quill.on("text-change", handleTextChange)

    return () => {
      quill.off("text-change", handleTextChange)
    }
  }, [quill])

  useEffect(() => {
    if (!quill) return

    const root = quill.root

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file && file.type.startsWith("image/")) {
            files.push(file)
          }
        }
      }

      if (files.length > 0 && typeof window !== "undefined") {
        event.preventDefault()
        window.dispatchEvent(
          new CustomEvent("fixit:ticket-attachments-from-paste", {
            detail: { files },
          }),
        )
      }
    }

    root.addEventListener("paste", handlePaste as unknown as EventListener)

    return () => {
      root.removeEventListener("paste", handlePaste as unknown as EventListener)
    }
  }, [quill])

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-medium text-muted-foreground">
          {label}
        </div>
      )}
      <div className={cn("rounded-md border border-border bg-background")}>
        <div className="relative min-h-32">
          <div ref={quillRef} className="min-h-32" />
        </div>
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
