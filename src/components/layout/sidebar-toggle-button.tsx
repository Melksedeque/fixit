"use client"

import { Button } from "@/components/ui/button"
import { PanelLeft } from "lucide-react"

export function SidebarToggleButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground"
      aria-label="Alternar sidebar"
      onClick={() => {
        const current = window.localStorage.getItem("fixit:sidebar:collapsed")
        const next = current === "true" ? "false" : "true"
        window.localStorage.setItem("fixit:sidebar:collapsed", next)
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "fixit:sidebar:collapsed",
            newValue: next,
          }),
        )
      }}
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  )
}

