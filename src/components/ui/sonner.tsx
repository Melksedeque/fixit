'use client'

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'
import { cn } from '@/lib/utils'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4 text-green-600" />,
        info: <Info className="h-4 w-4 text-blue-600" />,
        warning: <TriangleAlert className="h-4 w-4 text-orange-600" />,
        error: <OctagonX className="h-4 w-4 text-red-600" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: cn(
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            'data-[type=success]:!bg-green-50 data-[type=success]:!text-green-900 data-[type=success]:!border-green-200',
            'data-[type=error]:!bg-red-50 data-[type=error]:!text-red-900 data-[type=error]:!border-red-200',
            'data-[type=info]:!bg-blue-50 data-[type=info]:!text-blue-900 data-[type=info]:!border-blue-200',
            'data-[type=warning]:!bg-orange-50 data-[type=warning]:!text-orange-900 data-[type=warning]:!border-orange-200'
          ),
          description: cn(
            'group-[.toast]:text-muted-foreground',
            'data-[type=success]:!text-green-700',
            'data-[type=error]:!text-red-700',
            'data-[type=info]:!text-blue-700',
            'data-[type=warning]:!text-orange-700'
          ),
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
