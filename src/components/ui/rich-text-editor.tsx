"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  name: string
  defaultValue?: string
  label?: string
  placeholder?: string
}

export function RichTextEditor({ name, defaultValue, label, placeholder }: RichTextEditorProps) {
  const [value, setValue] = useState(defaultValue || "")
  const [focused, setFocused] = useState(false)
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue
    }
  }, [defaultValue])

  const syncValueFromDom = () => {
    if (editorRef.current) {
      setValue(editorRef.current.innerHTML)
    }
  }

  const withSelectionInEditor = (fn: (range: Range) => void) => {
    const editor = editorRef.current
    if (!editor) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return
    fn(range)
    syncValueFromDom()
  }

  const applyInlineWrapper = (tag: "strong" | "em") => {
    withSelectionInEditor((range) => {
      if (range.collapsed) return
      const wrapper = document.createElement(tag)
      const contents = range.extractContents()
      wrapper.appendChild(contents)
      range.insertNode(wrapper)
    })
  }

  const insertLink = (url: string) => {
    if (!/^https?:\/\//i.test(url)) return
    withSelectionInEditor((range) => {
      const selectionText = range.collapsed ? url : range.toString()
      range.deleteContents()
      const link = document.createElement("a")
      link.href = url
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.textContent = selectionText
      range.insertNode(link)
    })
  }

  const insertImage = (url: string) => {
    if (!/^https?:\/\//i.test(url)) return
    withSelectionInEditor((range) => {
      const img = document.createElement("img")
      img.src = url
      img.alt = ""
      img.loading = "lazy"
      img.style.maxWidth = "100%"
      img.style.display = "block"
      range.insertNode(img)
    })
  }

  const handleLink = () => {
    const url = window.prompt("URL do link")
    if (url) {
      insertLink(url)
    }
  }

  const handleImage = () => {
    const url = window.prompt("URL da imagem")
    if (url) {
      insertImage(url)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-medium text-muted-foreground">
          {label}
        </div>
      )}
      <div className={cn("rounded-md border border-border bg-background")}>
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => applyInlineWrapper("strong")}
          >
            B
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => applyInlineWrapper("em")}
          >
            I
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={handleLink}
          >
            Link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={handleImage}
          >
            Imagem
          </Button>
        </div>
        <div className="relative">
          {placeholder && !value && !focused && (
            <div className="pointer-events-none absolute inset-x-3 top-2 text-sm text-muted-foreground">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            className="min-h-28 max-h-[320px] overflow-y-auto rounded-md bg-background px-3 py-2 text-sm focus-visible:outline-none"
            contentEditable
            onInput={() => {
              syncValueFromDom()
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
