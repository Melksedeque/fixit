import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors transition-transform duration-200 ease-out hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[var(--shadow-e2-main)] active:shadow-[var(--shadow-glow-brand-soft)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[var(--shadow-e2-main)]',
        outline:
          'border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--shadow-e2-main)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-[var(--shadow-e2-main)]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success:
          'bg-green-600 text-white hover:bg-green-700 hover:shadow-[var(--shadow-e2-main)] active:shadow-[var(--shadow-glow-brand-soft)]',
        warning:
          'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-[var(--shadow-e2-main)]',
        edit: 'bg-sky-500 text-white hover:bg-sky-600 hover:shadow-[var(--shadow-e2-main)]',
        soft: 'bg-primary/10 text-primary border border-primary/15 hover:bg-primary/20 hover:text-primary shadow-none',
        'soft-success':
          'bg-green-500/10 text-green-400 border border-green-500/15 hover:bg-green-500/20 hover:text-green-300 shadow-none',
        'soft-warning':
          'bg-orange-500/10 text-orange-400 border border-orange-500/15 hover:bg-orange-500/20 hover:text-orange-300 shadow-none',
        'soft-edit':
          'bg-blue-500/10 text-blue-400 border border-blue-500/15 hover:bg-blue-500/20 hover:text-blue-300 shadow-none',
        'soft-destructive':
          'bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 hover:text-red-300 shadow-none',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
