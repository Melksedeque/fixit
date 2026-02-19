import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AppIconProps {
  className?: string
  size?: number
}

export function AppIcon({ className, size = 32 }: AppIconProps) {
  return (
    <Image
      src="/icon_fixit.png"
      alt="Fixit Icon"
      width={size}
      height={size}
      className={cn('h-auto w-auto', className)}
    />
  )
}
