import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from './button'

export type SegmentedTabsItem = {
  label: string
  href: string
  value: string
  disabled?: boolean
}

export function SegmentedTabs({
  items,
  value,
  className,
}: {
  items: SegmentedTabsItem[]
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-md border border-border bg-muted/40 gap-2 p-1',
        className
      )}
      role="tablist"
      aria-label="Abas"
    >
      {items.map((item) => (
        <Button
          key={item.value}
          asChild
          variant={item.value === value ? 'default' : 'ghost'}
          size="sm"
          aria-selected={item.value === value}
          role="tab"
          disabled={item.disabled}
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </div>
  )
}
