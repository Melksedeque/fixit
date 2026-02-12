import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className, width = 150, height = 40 }: LogoProps) {
  return (
    <Image
      src="/logo_fixit_horizontal.png"
      alt="Fixit Logo"
      width={width}
      height={height}
      priority
      className={cn("h-auto w-auto", className)}
    />
  )
}
