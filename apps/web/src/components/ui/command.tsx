import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '../../lib/utils'

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive
className={cn('flex h-full w-full flex-col overflow-hidden bg-card text-card-foreground', className)}
{...props}
  />
}

export function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
className="flex items-center gap-3 border-b border-border px-4"
cmdk-input-wrapper=""
    >
      <Search
className="shrink-0 text-muted-foreground"
size={18}
      />
      <CommandPrimitive.Input
className={cn('h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground', className)}
{...props}
      />
      <kbd className="rounded-[4px] border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
ESC
</kbd>
    </div>
  )
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List
className={cn('max-h-80 overflow-y-auto p-2', className)}
{...props}
  />
}

export function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty
className="py-8 text-center text-sm text-muted-foreground"
{...props}
  />
}

export function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group
className={cn('text-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground', className)}
{...props}
  />
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return <CommandPrimitive.Item
className={cn('flex cursor-pointer items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-muted data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50', className)}
{...props}
  />
}
